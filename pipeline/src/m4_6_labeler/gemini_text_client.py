"""Gemini text generation client with retry/backoff."""

from __future__ import annotations

import logging
import os
import time

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

LOGGER = logging.getLogger(__name__)

DEFAULT_TEXT_MODEL = "gemini-2.5-flash"
_MAX_RETRIES = 3
_BACKOFF_DELAYS = (2, 4, 8)  # seconds between retries

_RETRYABLE = (
    google_exceptions.TooManyRequests,
    google_exceptions.InternalServerError,
    google_exceptions.ServiceUnavailable,
    google_exceptions.DeadlineExceeded,
)


class GeminiTextClient:
    """Thin wrapper around `genai.GenerativeModel.generate_content`."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str = DEFAULT_TEXT_MODEL,
        logger: logging.Logger | None = None,
    ) -> None:
        self.model_name = model
        self.logger = logger or LOGGER

        resolved_key = api_key or os.getenv("GEMINI_API_KEY")
        if not resolved_key:
            raise ValueError(
                "GEMINI_API_KEY is required for cluster labelling. "
                "Set the environment variable or pass api_key= explicitly."
            )

        genai.configure(api_key=resolved_key)
        self._model = genai.GenerativeModel(model)

    def generate(self, prompt: str) -> str:
        """Call the model and return the response text, retrying on transient errors."""

        last_exc: Exception | None = None
        for attempt, delay in enumerate((*_BACKOFF_DELAYS, None), start=1):
            try:
                response = self._model.generate_content(prompt)
                return response.text
            except _RETRYABLE as exc:
                last_exc = exc
                if delay is None:
                    break
                self.logger.warning(
                    "Gemini transient error (attempt %d/%d): %s — retrying in %ds",
                    attempt, _MAX_RETRIES, exc, delay,
                )
                time.sleep(delay)
            except Exception:
                raise

        raise RuntimeError(
            f"Gemini call failed after {_MAX_RETRIES} retries."
        ) from last_exc
