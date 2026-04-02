"""Pydantic models shared across TCA pipeline modules."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ── M1: Scraper ───────────────────────────────────────────────────────────────

ScraperStatus = Literal["success", "not_found", "timeout", "suspicious", "pending"]


class CountryMetadata(BaseModel):
    country_name: str
    country_code: str                   # ISO 3166-1 alpha-3
    iso_alpha2: str                     # ISO 3166-1 alpha-2
    region: str
    sub_region: str
    constitution_year: int
    last_amendment_year: int | None = None
    language: str = "en"
    available_languages: list[str] = Field(default_factory=list)
    source_url: str
    file_path: str
    sha256: str | None = None
    scraped_at: datetime | None = None
    status: ScraperStatus = "pending"
    processing_enabled: bool = True
    processing_reason: str | None = None


# ── M2: Segmenter ─────────────────────────────────────────────────────────────

class Article(BaseModel):
    country_name: str
    country_code: str
    year: int
    article_id: str                     # e.g. "Article 5", "Section 12"
    text: str


# ── M3: Embedder ──────────────────────────────────────────────────────────────

class EmbeddedArticle(BaseModel):
    country_code: str
    country_name: str
    year: int
    article_id: str
    text: str
    embedding: list[float]
    model: str
    dimensions: int
    embedded_at: datetime = Field(default_factory=datetime.utcnow)


# ── M4: Clusterer ─────────────────────────────────────────────────────────────

class ClusteredArticle(BaseModel):
    country_code: str
    country_name: str
    region: str
    article_id: str
    text: str
    x: float
    y: float
    z: float
    global_cluster: int                 # -1 = noise
    country_cluster: int                # -1 = noise; scoped per country
    cluster_probability: float = Field(ge=0.0, le=1.0)


# ── M4.5: Exporter ────────────────────────────────────────────────────────────

class CountryIndexEntry(BaseModel):
    code: str
    iso_alpha2: str
    name: str
    region: str
    sub_region: str
    constitution_year: int
    last_amendment_year: int | None
    article_count: int
    cluster_count: int
    semantic_coverage: float            # % of global clusters touched (0–1)
    semantic_entropy: float
    has_data: bool


class ClusterIndexEntry(BaseModel):
    id: int
    size: int
    labels: dict[str, str] | None = None
    top_countries: list[str]
    top_countries_counts: list[int]
    country_count: int
    all_countries: list[str] | None = None
    centroid: list[float]               # [x, y, z] mean
    sample_texts: list[str]


class ArticlePoint(BaseModel):
    id: str                             # e.g. "BRA_2023_Art1"
    article_id: str
    text_snippet: str
    x: float
    y: float
    z: float
    global_cluster: int
    country_cluster: int
    cluster_probability: float
