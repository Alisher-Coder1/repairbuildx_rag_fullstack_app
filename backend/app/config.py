from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings:
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    embedding_model: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    chat_model: str = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
    top_k_chunks: int = int(os.getenv("TOP_K_CHUNKS", "5"))
    rag_data_dir: Path = Path(os.getenv("RAG_DATA_DIR", "./data"))

    @property
    def chunks_path(self) -> Path:
        return self.rag_data_dir / "chunks.json"

    @property
    def metadata_path(self) -> Path:
        return self.rag_data_dir / "vector_metadata.json"

    @property
    def faiss_index_path(self) -> Path:
        return self.rag_data_dir / "faiss_index.bin"


settings = Settings()
