# Studywise — AI study tutor

A local-first study workspace for uploading course material, asking grounded questions with source citations, and generating revision flashcards and quizzes.

## Features

- Upload PDF, DOCX, TXT, and Markdown notes. Audio transcription is available when an OpenAI API key is configured.
- Split notes into paragraph-aware chunks and keep source/page metadata.
- Search relevant chunks with OpenAI embeddings + Chroma when configured; use a local lexical retriever otherwise.
- Ask questions and get an answer, explanation, memory tips, practice questions, and citations.
- Generate flashcards and multiple-choice quizzes from the uploaded sources.

## Run locally

Requires Python 3.10+ and Node 18+.

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```


for bash :

1st terminal: 
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload


2nd terminal:
cd frontend
npm install
npm run dev


Open the Vite URL. The dev server proxies `/api` to `http://127.0.0.1:8000`. Add `OPENAI_API_KEY` to `backend/.env` to enable embedding-based retrieval, GPT explanations, and audio transcription. Without a key, uploads, lexical retrieval, and extractive study aids still work locally.

For a deployment with a separate API host, copy `frontend/.env.example` to `frontend/.env.production` and set `VITE_API_URL` to the public API base URL. Set `CORS_ORIGINS` in `backend/.env` to the exact frontend origins. For a same-origin deployment, reverse-proxy `/api` to FastAPI and leave `VITE_API_URL` empty.

## Storage and privacy

The prototype stores uploaded source text and chunks in `backend/data/studywise.db`; Chroma's optional local index is in `backend/data/chroma`. The API binds to localhost when run with the command above. It is a single-workspace prototype with no login, per-user data isolation, or encryption. Do not deploy it as a public multi-client service with personal course material until authentication, authorization, encryption, rate limits, and per-user storage are implemented.

## Copyright and sharing

This project is proprietary. See [`LICENSE`](LICENSE) for the copyright notice and terms. Do not publish it in a public repository if you need to keep the source code private: public GitHub repositories can be viewed and forked. Use a private repository and review the files and commit history before pushing. The `.gitignore` excludes local environment files, credentials, uploaded course material, and generated data, but it cannot remove files that were committed earlier.

## Evaluation before relying on answers

Try questions with known answers and check that cited passages support each claim. The fallback retriever uses lexical overlap and the fallback answer is extractive; neither should be treated as a replacement for reviewing the source material.
