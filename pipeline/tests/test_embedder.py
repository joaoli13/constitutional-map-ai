from __future__ import annotations

import json
from collections import Counter

import pandas as pd
import pytest
from google.api_core import exceptions as google_exceptions

from src.m3_embedder.batch_processor import EmbeddingBatchProcessor
from src.m3_embedder.embedder import ConstitutionalEmbedder
from src.m3_embedder.gemini_client import GeminiEmbeddingClient


def _articles_csv(path) -> None:
    frame = pd.DataFrame(
        [
            {
                "NomeDoPais": "Brazil",
                "Data": 2017,
                "NrDispositivo": "Article 1",
                "Texto": "Foundations of the federative republic.",
            },
            {
                "NomeDoPais": "Brazil",
                "Data": 2017,
                "NrDispositivo": "Article 2",
                "Texto": "Separation of powers.",
            },
            {
                "NomeDoPais": "Austria",
                "Data": 2013,
                "NrDispositivo": "Article 1",
                "Texto": "Austria is a democratic republic.",
            },
        ]
    )
    frame.to_csv(path, index=False)


def _metadata_json(path) -> None:
    payload = [
        {
            "country_name": "Brazil",
            "country_code": "BRA",
            "iso_alpha2": "BR",
            "region": "Americas",
            "sub_region": "South America",
            "constitution_year": 1988,
            "last_amendment_year": 2017,
            "language": "en",
            "available_languages": ["en"],
            "source_url": "https://example.test/constitution/Brazil_2017?lang=en",
            "file_path": "data/raw/BRA_2017.txt",
            "status": "success",
        },
        {
            "country_name": "Austria",
            "country_code": "AUT",
            "iso_alpha2": "AT",
            "region": "Europe",
            "sub_region": "Western Europe",
            "constitution_year": 1920,
            "last_amendment_year": 2013,
            "language": "en",
            "available_languages": ["en"],
            "source_url": "https://example.test/constitution/Austria_2013?lang=en",
            "file_path": "data/raw/AUT_2013.txt",
            "status": "success",
        },
    ]
    path.write_text(json.dumps(payload), encoding="utf-8")


def _normalized(values: list[float]) -> list[float]:
    norm = sum(value * value for value in values) ** 0.5
    return [value / norm for value in values]


def test_embedder_writes_parquet_and_report(tmp_path) -> None:
    articles_path = tmp_path / "all_articles.csv"
    metadata_path = tmp_path / "metadata.json"
    output_path = tmp_path / "embeddings.parquet"
    report_path = tmp_path / "embedding_report.json"
    _articles_csv(articles_path)
    _metadata_json(metadata_path)

    client = GeminiEmbeddingClient(
        embed_fn=lambda **_: {"embedding": [3.0, 4.0, 0.0, 0.0]},
        model="models/gemini-embedding-001",
        dimensions=4,
    )
    processor = EmbeddingBatchProcessor(client, batch_size=2, max_rpm=10_000, checkpoint_interval=10)
    embedder = ConstitutionalEmbedder(
        articles_path=articles_path,
        metadata_path=metadata_path,
        output_path=output_path,
        report_path=report_path,
        client=client,
        batch_processor=processor,
        token_counter=lambda text: len(text.split()),
    )

    report = embedder.run()

    assert report.total_segments == 3
    assert report.cached_segments == 0
    assert report.embedded_segments == 3
    assert report.api_call_count == 3
    assert report.failure_counts == {}

    frame = pd.read_parquet(output_path)
    assert list(frame.columns) == [
        "country_code",
        "country_name",
        "year",
        "article_id",
        "text",
        "embedding",
        "model",
        "dimensions",
        "embedded_at",
    ]
    assert set(frame["country_code"]) == {"BRA", "AUT"}
    assert all(len(vector) == 4 for vector in frame["embedding"])
    assert frame["dimensions"].tolist() == [4, 4, 4]
    assert frame["model"].tolist() == ["models/gemini-embedding-001"] * 3
    assert all(abs(sum(value * value for value in vector) ** 0.5 - 1.0) < 1e-6 for vector in frame["embedding"])

    report_payload = json.loads(report_path.read_text(encoding="utf-8"))
    assert report_payload["total_segments"] == 3
    assert report_payload["estimated_cost_usd"] > 0


def test_embedder_skips_cached_rows(tmp_path) -> None:
    articles_path = tmp_path / "all_articles.csv"
    metadata_path = tmp_path / "metadata.json"
    output_path = tmp_path / "embeddings.parquet"
    report_path = tmp_path / "embedding_report.json"
    _articles_csv(articles_path)
    _metadata_json(metadata_path)

    cached_frame = pd.DataFrame(
        [
            {
                "country_code": "BRA",
                "country_name": "Brazil",
                "year": 2017,
                "article_id": "Article 1",
                "text": "Foundations of the federative republic.",
                "embedding": _normalized([1.0, 1.0, 0.0, 0.0]),
                "model": "models/gemini-embedding-001",
                "dimensions": 4,
                "embedded_at": "2026-03-17T00:00:00+00:00",
            }
        ]
    )
    cached_frame.to_parquet(output_path, index=False)

    call_counter = Counter()

    def embed_fn(**_: object) -> dict[str, list[float]]:
        call_counter["count"] += 1
        return {"embedding": [0.0, 0.0, 3.0, 4.0]}

    client = GeminiEmbeddingClient(embed_fn=embed_fn, model="models/gemini-embedding-001", dimensions=4)
    processor = EmbeddingBatchProcessor(client, batch_size=2, max_rpm=10_000, checkpoint_interval=10)
    embedder = ConstitutionalEmbedder(
        articles_path=articles_path,
        metadata_path=metadata_path,
        output_path=output_path,
        report_path=report_path,
        client=client,
        batch_processor=processor,
        token_counter=lambda text: len(text.split()),
    )

    report = embedder.run()

    assert report.cached_segments == 1
    assert report.embedded_segments == 2
    assert call_counter["count"] == 2

    frame = pd.read_parquet(output_path)
    assert len(frame) == 3
    brazil_row = frame[
        (frame["country_code"] == "BRA") & (frame["article_id"] == "Article 1")
    ].iloc[0]
    assert brazil_row["text"] == "Foundations of the federative republic."


def test_batch_processor_retries_retryable_errors(tmp_path) -> None:
    del tmp_path
    attempts = Counter()

    def embed_fn(**kwargs: object) -> dict[str, list[float]]:
        attempts["count"] += 1
        if attempts["count"] == 1:
            raise google_exceptions.TooManyRequests("quota")
        assert kwargs["content"] == "Separation of powers."
        assert "title" not in kwargs
        return {"embedding": [1.0, 0.0, 0.0, 0.0]}

    client = GeminiEmbeddingClient(embed_fn=embed_fn, dimensions=4)
    processor = EmbeddingBatchProcessor(
        client,
        batch_size=1,
        max_rpm=10_000,
        sleep_fn=lambda _: None,
        checkpoint_interval=10,
    )

    rows, stats = processor.process_rows(
        [
            {
                "country_code": "BRA",
                "country_name": "Brazil",
                "year": 2017,
                "article_id": "Article 1",
                "text": "Separation of powers.",
            }
        ]
    )

    assert len(rows) == 1
    assert stats.api_call_count == 2
    assert stats.failure_counts == {}
    assert attempts["count"] == 2


def test_embedder_writes_checkpoint_during_long_run(tmp_path) -> None:
    articles_path = tmp_path / "all_articles.csv"
    metadata_path = tmp_path / "metadata.json"
    output_path = tmp_path / "embeddings.parquet"
    report_path = tmp_path / "embedding_report.json"
    _articles_csv(articles_path)
    _metadata_json(metadata_path)

    client = GeminiEmbeddingClient(
        embed_fn=lambda **_: {"embedding": [1.0, 0.0, 0.0, 0.0]},
        dimensions=4,
    )
    processor = EmbeddingBatchProcessor(client, batch_size=2, max_rpm=10_000, checkpoint_interval=2)
    embedder = ConstitutionalEmbedder(
        articles_path=articles_path,
        metadata_path=metadata_path,
        output_path=output_path,
        report_path=report_path,
        client=client,
        batch_processor=processor,
        token_counter=lambda text: len(text.split()),
    )

    report = embedder.run()

    assert output_path.exists()
    frame = pd.read_parquet(output_path)
    assert len(frame) == 3
    assert report.embedded_segments == 3


def test_batch_processor_reports_progress_for_successes_and_failures(tmp_path) -> None:
    del tmp_path
    attempts = Counter()
    progress_events: list[tuple[int, int, int, int]] = []

    def embed_fn(*, content: str, **_: object) -> dict[str, list[float]]:
        attempts[content] += 1
        if content == "fail immediately":
            raise ValueError("bad input")
        return {"embedding": [1.0, 0.0, 0.0, 0.0]}

    client = GeminiEmbeddingClient(embed_fn=embed_fn, dimensions=4)
    processor = EmbeddingBatchProcessor(client, batch_size=2, max_rpm=10_000, checkpoint_interval=10)

    rows, stats = processor.process_rows(
        [
            {
                "country_code": "BRA",
                "country_name": "Brazil",
                "year": 2017,
                "article_id": "Article 1",
                "text": "ok row",
            },
            {
                "country_code": "BRA",
                "country_name": "Brazil",
                "year": 2017,
                "article_id": "Article 2",
                "text": "fail immediately",
            },
        ],
        progress_callback=lambda completed, total, current_stats: progress_events.append(
            (
                completed,
                total,
                current_stats.success_count,
                current_stats.failure_count,
            )
        ),
    )

    assert len(rows) == 1
    assert stats.completed_count == 2
    assert stats.success_count == 1
    assert stats.failure_count == 1
    assert len(progress_events) == 2
    assert progress_events[-1][0] == 2
    assert progress_events[-1][1] == 2
    assert progress_events[-1][2] == 1
    assert progress_events[-1][3] == 1
