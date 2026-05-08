# Repair RAG Fullstack Web App

Полноценное web-приложение для Stage 7: интеграция Colab-прототипа AI-консультанта по ремонту помещения в fullstack web-архитектуру.

Проект показывает переход от notebook-прототипа к пользовательскому приложению, где пользователь вводит параметры помещения через web-интерфейс, а система выполняет расчёты, RAG-поиск по базе знаний и формирует структурированный ответ консультанта.

---

## Статус проекта

Текущий статус:

```text
Stage 7 working MVP
```

Рабочая версия зафиксирована тегом:

```text
v0.1-stage7-working-mvp
```

---

## Что реализовано

```text
React frontend
FastAPI backend
Room input form
Room calculation engine
RAG service
FAISS vector search
OpenAI embeddings
OpenAI chat answer generation
JSON metadata
Structured consultant answer
```

Приложение уже работает локально как production-like MVP:

```text
Frontend → Backend → Validation → Room calculations → FAISS/RAG search → OpenAI API → Consultant answer
```

---

## Архитектура

```text
User
↓
React / Vite frontend
↓
FastAPI backend
↓
Input validation
↓
Room metrics calculation
↓
OpenAI embedding for query
↓
FAISS similarity search
↓
Relevant chunks from knowledge base
↓
Prompt construction
↓
OpenAI chat model
↓
Structured consultant answer
```

---

## Структура проекта

```text
repair_rag_fullstack_app/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── rag_service.py
│   │   ├── calculations.py
│   │   ├── validation.py
│   │   ├── schemas.py
│   │   └── config.py
│   ├── data/
│   │   ├── chunks.json
│   │   ├── vector_metadata.json
│   │   └── faiss_index.bin
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── package.json
│   └── index.html
│
├── .gitignore
└── README.md
```

---

## Backend

Backend реализован на FastAPI.

Он отвечает за:

```text
приём запроса от frontend;
валидацию входных данных;
расчёт площадей помещения;
загрузку chunks.json;
загрузку vector_metadata.json;
загрузку faiss_index.bin;
создание embedding вопроса;
поиск релевантных chunks через FAISS;
формирование prompt;
получение ответа от OpenAI chat model;
возврат результата во frontend.
```

---

## Frontend

Frontend реализован на React + Vite.

Он отвечает за:

```text
форму ввода параметров помещения;
ввод вопроса пользователя;
отправку данных в backend;
отображение расчётных показателей;
отображение ответа консультанта;
отображение результата RAG-обработки.
```

---

## Файлы базы знаний

Для работы RAG-системы backend использует файлы:

```text
backend/data/chunks.json
backend/data/vector_metadata.json
backend/data/faiss_index.bin
```

Файл `chunk_embeddings.npy` не обязателен для runtime, если `faiss_index.bin` уже создан. Он нужен только для пересборки индекса.

---

## Переменные окружения

Создайте файл:

```text
backend/.env
```

На основе:

```text
backend/.env.example
```

Пример:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini
TOP_K_CHUNKS=5
RAG_DATA_DIR=./data
```

Важно:

```text
.env нельзя публиковать в GitHub.
OPENAI_API_KEY должен храниться только на backend.
Frontend не должен получать API key.
```

---

## Запуск backend

Перейти в корень проекта:

```bash
cd repair_rag_fullstack_app
```

Создать и активировать виртуальное окружение:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Установить зависимости:

```bash
pip install -r backend/requirements.txt
```

Перейти в backend:

```bash
cd backend
```

Запустить сервер:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Проверка backend:

```text
http://localhost:8000/api/health
```

Ожидаемый результат:

```json
{
  "status": "ok",
  "chunks_loaded": 74,
  "metadata_loaded": 74,
  "faiss_index_loaded": true,
  "missing_files": []
}
```

---

## Запуск frontend

Открыть второй терминал.

Перейти в frontend:

```bash
cd repair_rag_fullstack_app/frontend
```

Установить зависимости:

```bash
npm install
```

Запустить frontend:

```bash
npm run dev
```

Открыть приложение:

```text
http://localhost:5173
```

---

## Локальные адреса

```text
Backend API: http://localhost:8000
Frontend UI: http://localhost:5173
Health check: http://localhost:8000/api/health
```

---

## Что делает приложение

Пользователь вводит:

```text
форму помещения;
тип зоны;
длину;
ширину;
высоту;
покрытие пола;
покрытие стен;
покрытие потолка;
проёмы в JSON;
вопрос консультанту.
```

Система рассчитывает:

```text
площадь пола;
площадь потолка;
периметр;
площадь стен без вычета;
площадь проёмов;
чистую площадь стен;
ориентировочную длину плинтуса.
```

После этого backend выполняет RAG-поиск по базе знаний и формирует ответ консультанта.

---

## Пример цепочки RAG

```text
Вопрос пользователя
↓
Embedding вопроса
↓
FAISS search
↓
TOP_K релевантных chunks
↓
Prompt with context
↓
OpenAI chat model
↓
Structured answer
```

---

## MVP-ограничения

Текущая версия является working MVP.

В неё не входят:

```text
регистрация пользователей;
личный кабинет;
оплата;
админ-панель;
много проектов на одного пользователя;
история запросов;
production database;
Docker deployment;
CI/CD pipeline;
cloud object storage;
authentication;
role-based access control.
```

---

## Production-план

Для вывода в production нужно выполнить следующие шаги:

```text
1. Разместить backend на Render, Railway, Fly.io, VPS или другом server/cloud hosting.
2. Разместить frontend на Vercel, Netlify или другом static hosting.
3. Настроить backend secrets через environment variables.
4. Не хранить OPENAI_API_KEY во frontend.
5. Настроить CORS только на production-домен frontend.
6. Включить HTTPS.
7. Добавить логирование ошибок.
8. Добавить rate limiting.
9. Добавить мониторинг health endpoint.
10. Решить, где хранить RAG-файлы: server volume, private storage, S3/R2 или private repo.
```

---

## Stage 7 значение

Для дипломного Stage 7 это приложение показывает, что Colab-прототип был вынесен в полноценную web-архитектуру.

Формулировка:

```text
На Stage 7 был реализован fullstack MVP web-приложения. Пользователь работает уже не с кодом notebook, а с web-интерфейсом. Frontend отправляет параметры помещения в FastAPI backend, backend выполняет расчёты, RAG-поиск через FAISS и формирует структурированный ответ AI-консультанта через OpenAI API.
```

---

## Безопасность

В репозиторий не должны попадать:

```text
.env
.venv
node_modules
__pycache__
API keys
local secrets
```

Эти файлы исключаются через `.gitignore`.

---

## Текущий результат

```text
Working fullstack RAG repair consultant MVP is completed.
Backend health check passes.
Frontend sends requests to backend.
RAG base is loaded.
FAISS index is active.
OpenAI embeddings and chat generation work.
```
