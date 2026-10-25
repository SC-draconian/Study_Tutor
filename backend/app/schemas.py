from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1500)
    source_ids: list[str] | None = None
    mode: str = "detailed"


class GenerateRequest(BaseModel):
    source_ids: list[str] | None = None
    count: int = Field(default=8, ge=1, le=20)
    topic: str = ""


class SourceOut(BaseModel):
    id: str
    name: str
    kind: str
    chunk_count: int
    created_at: str

