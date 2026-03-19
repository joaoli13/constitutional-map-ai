"""Gemini embedding client wrapper with vector validation."""

from __future__ import annotations

import logging
import math
import os
from typing import Any, Callable

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

from src.shared.constants import (
    DEFAULT_EMBEDDING_DIMENSIONS,
    DEFAULT_EMBEDDING_MODEL,
    DEFAULT_EMBEDDING_TASK_TYPE,
)

LOGGER = logging.getLogger(__name__)

EmbedFn = Callable[..., Any]


class GeminiEmbeddingClient:
    """Small wrapper around `genai.embed_content`."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str = DEFAULT_EMBEDDING_MODEL,
        dimensions: int = DEFAULT_EMBEDDING_DIMENSIONS,
        task_type: str = DEFAULT_EMBEDDING_TASK_TYPE,
        embed_fn: EmbedFn | None = None,
        logger: logging.Logger | None = None,
    ) -> None:
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model
        self.dimensions = dimensions
        self.task_type = task_type
        self.logger = logger or LOGGER

        if embed_fn is not None:
            self.embed_fn = embed_fn
            return

        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required to generate embeddings.")

        genai.configure(api_key=self.api_key)
        self.embed_fn = genai.embed_content

    def embed_text(self, text: str) -> list[float]:
        """Embed one text segment and return a normalized vector."""

        response = self.embed_fn(
            model=self.model,
            content=text,
            task_type=self.task_type,
            output_dimensionality=self.dimensions,
        )
        embedding = extract_embedding(response)
        return normalize_embedding(embedding, expected_dimensions=self.dimensions)


def extract_embedding(response: Any) -> list[float]:
    """Handle the response shapes returned by the Gemini SDK."""

    if isinstance(response, dict):
        embedding = response.get("embedding")
        if embedding is None:
            embeddings = response.get("embedding_list") or response.get("embeddings")
            if isinstance(embeddings, list) and embeddings:
                embedding = embeddings[0]
    else:
        embedding = getattr(response, "embedding", None)

    if embedding is None:
        raise ValueError("Gemini response did not include an embedding vector.")

    if isinstance(embedding, dict):
        embedding = embedding.get("values") or embedding.get("embedding")

    if not isinstance(embedding, list):
        raise ValueError("Gemini response contained an invalid embedding payload.")

    return [float(value) for value in embedding]


def normalize_embedding(embedding: list[float], *, expected_dimensions: int) -> list[float]:
    """Validate and L2-normalize an embedding vector."""

    if len(embedding) != expected_dimensions:
        raise ValueError(
            f"Embedding dimension mismatch: expected {expected_dimensions}, got {len(embedding)}."
        )
    if any(not math.isfinite(value) for value in embedding):
        raise ValueError("Embedding vector contains NaN or Inf values.")

    norm = math.sqrt(sum(value * value for value in embedding))
    if norm == 0.0:
        raise ValueError("Embedding vector has zero norm.")

    normalized = [value / norm for value in embedding]
    normalized_norm = math.sqrt(sum(value * value for value in normalized))
    if abs(normalized_norm - 1.0) > 0.01:
        raise ValueError("Embedding vector norm is outside the allowed tolerance.")
    return normalized


def is_retryable_error(exc: Exception) -> bool:
    """Return whether an embedding error should be retried."""

    retryable_types = (
        google_exceptions.TooManyRequests,
        google_exceptions.InternalServerError,
        google_exceptions.ServiceUnavailable,
    )
    return isinstance(exc, retryable_types)
