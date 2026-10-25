import json
import re
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from .config import settings


class Store:
    def __init__(self) -> None:
        settings.data_path.mkdir(parents=True, exist_ok=True)
        self.path = settings.data_path / "studywise.db"
        with self.connect() as db:
            db.execute("CREATE TABLE IF NOT EXISTS sources (id TEXT PRIMARY KEY, name TEXT, kind TEXT, created_at TEXT)")
            db.execute("CREATE TABLE IF NOT EXISTS chunks (id TEXT PRIMARY KEY, source_id TEXT, text TEXT, page INTEGER, section TEXT, FOREIGN KEY(source_id) REFERENCES sources(id))")
            db.execute("CREATE VIRTUAL TABLE IF NOT EXISTS chunk_search USING fts5(chunk_id UNINDEXED, source_id UNINDEXED, text, tokenize='porter unicode61')")

    def connect(self):
        db = sqlite3.connect(self.path)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        return db

    def add_source(self, name: str, kind: str, pages: list[dict]) -> dict:
        source_id = str(uuid.uuid4())
        created = datetime.now(timezone.utc).isoformat()
        chunks = []
        for page in pages:
            for section, body in semantic_chunks(page["text"]):
                if len(body.strip()) < 25:
                    continue
                chunks.append({"id": str(uuid.uuid4()), "source_id": source_id, "text": body.strip(), "page": page.get("page", 1), "section": section})
        if not chunks:
            raise ValueError("No readable text found in this file.")
        with self.connect() as db:
            db.execute("INSERT INTO sources VALUES(?,?,?,?)", (source_id, name, kind, created))
            db.executemany("INSERT INTO chunks VALUES(?,?,?,?,?)", [(c["id"], c["source_id"], c["text"], c["page"], c["section"]) for c in chunks])
            db.executemany("INSERT INTO chunk_search(chunk_id,source_id,text) VALUES(?,?,?)", [(c["id"], c["source_id"], c["text"]) for c in chunks])
        return {"id": source_id, "name": name, "kind": kind, "chunk_count": len(chunks), "created_at": created, "chunks": chunks}

    def sources(self) -> list[dict]:
        with self.connect() as db:
            rows = db.execute("SELECT s.id,s.name,s.kind,s.created_at,COUNT(c.id) chunk_count FROM sources s LEFT JOIN chunks c ON c.source_id=s.id GROUP BY s.id ORDER BY s.created_at DESC").fetchall()
        return [dict(row) for row in rows]

    def delete_source(self, source_id: str) -> bool:
        with self.connect() as db:
            db.execute("DELETE FROM chunk_search WHERE source_id=?", (source_id,))
            db.execute("DELETE FROM chunks WHERE source_id=?", (source_id,))
            cur = db.execute("DELETE FROM sources WHERE id=?", (source_id,))
        return cur.rowcount > 0

    def get_chunks(self, source_ids: list[str] | None = None) -> list[dict]:
        with self.connect() as db:
            if source_ids:
                placeholders = ",".join("?" for _ in source_ids)
                rows = db.execute(f"SELECT c.*,s.name FROM chunks c JOIN sources s ON s.id=c.source_id WHERE c.source_id IN ({placeholders})", source_ids).fetchall()
            else:
                rows = db.execute("SELECT c.*,s.name FROM chunks c JOIN sources s ON s.id=c.source_id").fetchall()
        return [dict(row) for row in rows]

    def lexical_search(self, query: str, source_ids: list[str] | None, limit: int) -> list[dict]:
        terms = list(dict.fromkeys(re.findall(r"[\w+#.-]{2,}", query.lower())))[:12]
        if not terms:
            return []
        fts_query = " OR ".join('"' + t.replace('"', '') + '"' for t in terms)
        with self.connect() as db:
            sql = "SELECT c.*,s.name,bm25(chunk_search) rank FROM chunk_search JOIN chunks c ON c.id=chunk_search.chunk_id JOIN sources s ON s.id=c.source_id WHERE chunk_search MATCH ?"
            args: list = [fts_query]
            if source_ids:
                sql += " AND c.source_id IN (" + ",".join("?" for _ in source_ids) + ")"
                args.extend(source_ids)
            sql += " ORDER BY rank LIMIT ?"
            args.append(limit)
            rows = db.execute(sql, args).fetchall()
        return [dict(row) for row in rows]


def semantic_chunks(text: str, target_words: int = 650, overlap_words: int = 100):
    paragraphs = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    groups: list[tuple[str, str]] = []
    current: list[str] = []
    count = 0
    title = ""
    for paragraph in paragraphs:
        heading = paragraph[:100] if len(paragraph) < 100 and (paragraph.isupper() or paragraph.endswith(":")) else ""
        if heading and current:
            groups.append((title, "\n\n".join(current)))
            current, count = [], 0
        if heading:
            title = heading.rstrip(":")
        words = len(paragraph.split())
        if current and count + words > target_words:
            groups.append((title, "\n\n".join(current)))
            tail = " ".join("\n\n".join(current).split()[-overlap_words:])
            current, count = ([tail] if tail else []), len(tail.split())
        current.append(paragraph)
        count += words
    if current:
        groups.append((title, "\n\n".join(current)))
    return groups


store = Store()
