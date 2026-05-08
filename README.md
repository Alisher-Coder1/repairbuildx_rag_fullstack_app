# Repair RAG Fullstack Web App

Полноценное web-приложение для Stage 7: интеграция Colab-прототипа AI-консультанта по ремонту помещения в production-like fullstack архитектуру.

## Архитектура

```text
Frontend: React + Vite
↓
Backend API: FastAPI
↓
Validation + Room Calculation
↓
RAG Service
↓
FAISS + chunks.json + vector_metadata.json
↓
OpenAI Embeddings + Chat Model
↓
Structured consultant answer
```

## Что нужно положить в backend/data

Скопируйте из Colab реальные файлы:

```text
backend/data/chunks.json
backend/data/vector_metadata.json
backend/data/faiss_index.bin
```

Файл `chunk_embeddings.npy` для runtime не обязателен, если `faiss_index.bin` уже создан. Он нужен только для пересборки индекса.

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Проверка: `http://localhost:8000/api/health`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Открыть: `http://localhost:5173`

## Production-идея

Для дипломного Stage 7 это приложение показывает переход от Colab notebook к пользовательскому web-интерфейсу. Backend можно разместить на Render/Railway/Fly.io/VPS, frontend — на Vercel/Netlify или вместе с backend.
