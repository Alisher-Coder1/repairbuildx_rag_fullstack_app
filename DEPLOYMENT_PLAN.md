# План вывода проекта в production

## Текущий статус

Проект находится в состоянии рабочего fullstack MVP.

Реализовано:

- React + Vite frontend
- FastAPI backend
- RAG-сервис
- FAISS-векторный поиск
- OpenAI embeddings
- OpenAI chat generation
- база знаний через chunks, metadata и FAISS index
- GitHub-репозиторий
- стабильный тег: v0.1-stage7-working-mvp

## Цель production-этапа

Цель следующего этапа — вынести локально работающее web-приложение в публичную production-like среду, чтобы пользователь мог открыть web-интерфейс по ссылке, отправить параметры помещения и получить ответ AI-консультанта.

## Целевая production-архитектура

```text
Пользователь
↓
Frontend-хостинг
↓
Backend API
↓
RAG-база знаний
↓
FAISS-поиск
↓
OpenAI API
↓
Структурированный ответ консультанта
```

## Размещение frontend

Frontend можно разместить на:

```text
Vercel
Netlify
Cloudflare Pages
другом static hosting
```

Frontend должен хранить только публичные настройки.

Пример переменной:

```env
VITE_API_BASE_URL=https://backend-production-url
```

Frontend не должен содержать:

```text
OPENAI_API_KEY
backend/.env
RAG-файлы
закрытые ключи
локальные секреты
```

## Размещение backend

Backend можно разместить на:

```text
Render
Railway
Fly.io
VPS
другом cloud/server hosting
```

Backend отвечает за:

```text
приём запросов от frontend
валидацию входных данных
расчёт параметров помещения
загрузку chunks.json
загрузку vector_metadata.json
загрузку faiss_index.bin
создание embedding вопроса
FAISS-поиск релевантных chunks
формирование prompt
запрос к OpenAI chat model
возврат ответа во frontend
```

## Переменные окружения backend

На production-хостинге нужно настроить переменные окружения:

```env
OPENAI_API_KEY=secret_value
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini
TOP_K_CHUNKS=5
RAG_DATA_DIR=./data
```

Важно:

```text
OPENAI_API_KEY должен храниться только на backend.
Ключ нельзя передавать во frontend.
Ключ нельзя публиковать в GitHub.
```

## RAG-файлы

Для запуска backend нужны файлы:

```text
backend/data/chunks.json
backend/data/vector_metadata.json
backend/data/faiss_index.bin
```

Для MVP эти файлы можно поставлять вместе с backend.

Для более серьёзного production в будущем лучше перенести их в:

```text
private object storage
server volume
S3/R2-compatible storage
private deployment artifact
закрытое хранилище данных
```

## CORS

Локально backend разрешает frontend по адресам:

```text
http://localhost:5173
http://127.0.0.1:5173
```

В production нужно заменить или дополнить CORS реальным доменом frontend:

```text
https://frontend-production-domain
```

Нельзя оставлять слишком открытый CORS для публичного production без необходимости.

## Health check

Backend имеет endpoint для проверки состояния:

```text
/api/health
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

Этот endpoint нужен для быстрой проверки:

```text
backend запущен
RAG-файлы найдены
chunks загружены
metadata загружены
FAISS index активен
```

## Минимальный порядок production-деплоя

```text
1. Выбрать backend-хостинг.
2. Загрузить backend-код.
3. Добавить production environment variables.
4. Убедиться, что RAG-файлы доступны backend.
5. Запустить FastAPI backend.
6. Проверить /api/health.
7. Выбрать frontend-хостинг.
8. Указать VITE_API_BASE_URL на production backend.
9. Собрать и разместить frontend.
10. Проверить полный цикл: frontend → backend → RAG → OpenAI → ответ.
11. Ограничить CORS production-доменом frontend.
12. Проверить, что секреты не попали в frontend и GitHub.
```

## Production readiness checklist

Перед реальным production нужно проверить:

```text
backend запускается без ошибок
frontend открывается по публичной ссылке
/api/health возвращает ok
/api/consult возвращает ответ консультанта
OpenAI API key хранится только в backend environment variables
.env не опубликован в GitHub
CORS настроен на production frontend domain
HTTPS включён
логи backend доступны в панели хостинга
ошибки API отображаются пользователю понятно
RAG-файлы доступны backend
```

## Что пока не входит в MVP

Текущая версия не включает:

```text
регистрацию пользователей
личный кабинет
историю запросов
базу данных проектов
оплату
админ-панель
ролевой доступ
Docker deployment
CI/CD pipeline
rate limiting
мониторинг production-уровня
автоматическую пересборку FAISS
обновление базы знаний через админку
```

## Будущие усиления

После базового production-деплоя можно добавить:

```text
Dockerfile для backend
CI/CD через GitHub Actions
автоматический deploy при push в main
production logging
rate limiting
auth layer
project history
database persistence
admin panel для обновления базы знаний
автоматическую пересборку embeddings и FAISS index
хранение RAG-файлов в private storage
```

## Значение для Stage 7

На Stage 7 Colab-прототип был вынесен в полноценную fullstack web-архитектуру.

Формулировка:

```text
На этапе интеграции был реализован рабочий fullstack MVP web-приложения. Пользователь работает через React-интерфейс, backend реализован на FastAPI, база знаний подключена через FAISS/RAG, а ответ AI-консультанта формируется через OpenAI API. Следующий шаг — размещение backend и frontend в production-like среде с настройкой секретов, CORS, HTTPS и health monitoring.
```
