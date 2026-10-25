from pathlib import Path
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .extract import extract_document
from .rag import answer_question, generate_study_set, index_chunks, retrieve
from .rag import client as openai_client
from .schemas import ChatRequest, GenerateRequest
from .store import store
from .ratelimit import RateLimiter

app = FastAPI(title="Studywise API", version="0.1.0")
cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=cors_origins, allow_methods=["GET", "POST", "DELETE"], allow_headers=["Content-Type"])

# Rate limiter for AI endpoints — protects your OpenAI key from overuse
ai_limiter = RateLimiter(
    max_requests=settings.rate_limit_requests,
    window_seconds=settings.rate_limit_window,
)


@app.get("/api/health")
def health():
    return {"ok": True, "ai_enabled": bool(settings.openai_api_key), "retrieval": "embeddings with local lexical fallback" if settings.openai_api_key else "local lexical"}


@app.get("/api/sources")
def list_sources():
    return store.sources()


@app.post("/api/sources")
async def upload_source(file: UploadFile = File(...)):
    filename = Path(file.filename or "upload.txt").name
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(413, "File too large (20 MB maximum).")
    try:
        kind, pages = extract_document(filename, content)
        source = store.add_source(filename, kind, pages)
        index_chunks(source.pop("chunks"))
        source.pop("created_at", None)
        return source
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(400, f"Could not read this file: {exc}") from exc


@app.post("/api/transcribe")
async def transcribe_media(request: Request, file: UploadFile = File(...)):
    if not settings.openai_api_key:
        raise HTTPException(503, "Add OPENAI_API_KEY to backend/.env to transcribe audio or video.")
    ai_limiter.check(request)
    filename = Path(file.filename or "recording").name
    content = await file.read()
    if len(content) > 24 * 1024 * 1024:
        raise HTTPException(413, "Media file too large (24 MB maximum).")
    import io
    try:
        transcript = openai_client().audio.transcriptions.create(model="whisper-1", file=(filename, io.BytesIO(content)))
        text = transcript.text.strip()
        source = store.add_source(filename, "transcript", [{"page": 1, "text": text}])
        index_chunks(source.pop("chunks"))
        source.pop("created_at", None)
        return source
    except Exception as exc:
        raise HTTPException(400, f"Transcription failed: {exc}") from exc


@app.delete("/api/sources/{source_id}")
def delete_source(source_id: str):
    if not store.delete_source(source_id):
        raise HTTPException(404, "Source not found")
    try:
        import chromadb
        chroma = chromadb.PersistentClient(path=str(settings.data_path / "chroma"))
        collection = chroma.get_collection("studywise_chunks")
        collection.delete(where={"source_id": source_id})
    except Exception:
        pass
    return {"deleted": True}


@app.post("/api/chat")
def chat(request: Request, body: ChatRequest):
    ai_limiter.check(request)
    chunks = retrieve(body.question, body.source_ids)
    return answer_question(body.question, chunks, body.mode)


@app.post("/api/generate/{kind}")
def generate(kind: str, request: Request, body: GenerateRequest):
    ai_limiter.check(request)
    if kind not in {"flashcards", "quiz"}:
        raise HTTPException(404, "Choose flashcards or quiz.")
    query = body.topic or "key concepts definitions examples"
    chunks = retrieve(query, body.source_ids, limit=max(settings.top_k, body.count))
    if not chunks:
        chunks = store.get_chunks(body.source_ids)
    if not chunks:
        raise HTTPException(422, "Upload and select notes with readable text before generating a study set.")
    return {"items": generate_study_set(chunks, body.count, body.topic, kind)}


@app.get("/api/rate-limit")
def rate_limit_info(request: Request):
    remaining, reset = ai_limiter.remaining(request)
    return {
        "limit": ai_limiter.max_requests,
        "remaining": remaining,
        "reset_seconds": reset,
        "window_seconds": ai_limiter.window,
    }
