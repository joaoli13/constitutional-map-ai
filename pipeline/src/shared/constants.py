"""Shared constants for the TCA pipeline."""

from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────

PIPELINE_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PIPELINE_ROOT / "data"

RAW_DIR = DATA_DIR / "raw"
ARTICLES_DIR = DATA_DIR / "articles"
EMBEDDINGS_DIR = DATA_DIR / "embeddings"
CLUSTERS_DIR = DATA_DIR / "clusters"

APP_PUBLIC_DATA_DIR = PIPELINE_ROOT.parent / "app" / "public" / "data"
APP_COUNTRIES_DIR = APP_PUBLIC_DATA_DIR / "countries"

# ── Constitute Project ────────────────────────────────────────────────────────

CONSTITUTE_BASE_URL = "https://www.constituteproject.org"
CONSTITUTE_LIST_PATH = "/constitutions?lang=en&status=in_force"
CONSTITUTE_USER_AGENT = (
    "TheConstitutionalAtlas/0.1 (academic research; "
    "https://github.com/constitutional-atlas)"
)

# ── Scraper ───────────────────────────────────────────────────────────────────

SCRAPER_RATE_LIMIT_SECONDS = 2.0
SCRAPER_MAX_RETRIES = 3
SCRAPER_BACKOFF_DELAYS = (5, 15, 45)   # seconds between retries
SCRAPER_MIN_TEXT_LENGTH = 500          # chars; shorter → status "suspicious"

# ── Segmenter ─────────────────────────────────────────────────────────────────

SEGMENT_MIN_COUNT = 5
SEGMENT_MAX_COUNT = 500
SEGMENT_MAX_TOKENS = 8_000
ALL_ARTICLES_FILENAME = "all_articles.csv"

# ── Embedder ──────────────────────────────────────────────────────────────────

DEFAULT_EMBEDDING_MODEL = "models/gemini-embedding-001"
DEFAULT_EMBEDDING_DIMENSIONS = 768
DEFAULT_EMBEDDING_TASK_TYPE = "RETRIEVAL_DOCUMENT"
EMBEDDING_CHECKPOINT_INTERVAL = 1_000  # segments between Parquet flushes

# ── Clusterer ─────────────────────────────────────────────────────────────────

UMAP_N_NEIGHBORS_CLUSTER = 30
UMAP_N_NEIGHBORS_VIZ = 15
UMAP_MIN_DIST_CLUSTER = 0.0
UMAP_MIN_DIST_VIZ = 0.1
UMAP_METRIC = "cosine"
UMAP_RANDOM_STATE = 42

HDBSCAN_MIN_CLUSTER_SIZE = 10
HDBSCAN_MIN_SAMPLES = 5
HDBSCAN_METRIC = "euclidean"

HDBSCAN_COUNTRY_MIN_CLUSTER_SIZE = 3
HDBSCAN_COUNTRY_MIN_SAMPLES = 2

# ── Exporter ──────────────────────────────────────────────────────────────────

NEON_BATCH_SIZE = 500
TEXT_SNIPPET_LENGTH = 200              # chars for text_snippet field
