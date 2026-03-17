## ADDED Requirements

### Requirement: Dual UMAP Projection

The clusterer SHALL apply two independent UMAP projections to the 768-dimensional embeddings: one to 50 dimensions (cosine metric, `n_neighbors=30`, `min_dist=0.0`) for use as HDBSCAN input, and one to 3 dimensions (cosine metric, `n_neighbors=15`, `min_dist=0.1`) for visualization coordinates. Both projections SHALL use `random_state=42` for reproducibility.

#### Scenario: 3D coordinates produced for every segment

- **WHEN** UMAP completes the visualization projection
- **THEN** every row in the output Parquet has non-null `x`, `y`, `z` float values, and the coordinate ranges are finite (no Inf/NaN)

#### Scenario: Reproducible output

- **WHEN** the clusterer is re-run on the same input Parquet with the same environment
- **THEN** the `x`, `y`, `z` values and cluster labels are identical to the previous run

---

### Requirement: Global HDBSCAN Clustering

The clusterer SHALL apply HDBSCAN (`min_cluster_size=10`, `min_samples=5`, `metric='euclidean'`, `cluster_selection_method='eom'`, `prediction_data=True`) to the 50-dimensional UMAP projection. Each segment SHALL receive a `global_cluster` label (integer ≥ 0, or -1 for noise) and a `cluster_probability` float (0–1).

#### Scenario: Noise ratio within acceptable bounds

- **WHEN** global clustering completes
- **THEN** the ratio of segments with `global_cluster == -1` is ≤ 10%

#### Scenario: Cluster count within expected range

- **WHEN** global clustering completes
- **THEN** the number of distinct non-noise clusters is between 50 and 150

---

### Requirement: Per-country HDBSCAN Clustering

The clusterer SHALL apply a separate HDBSCAN pass for each country using its own 50D UMAP subset (`min_cluster_size=3`, `min_samples=2`). Each segment SHALL receive a `country_cluster` label scoped to its country (not globally unique).

#### Scenario: Per-country labels are country-scoped

- **WHEN** per-country clustering completes for Brazil and Germany
- **THEN** both countries may have a `country_cluster == 0` without conflict; labels are independent per country

#### Scenario: Single-article country handled gracefully

- **WHEN** a country has fewer than `min_cluster_size` segments
- **THEN** all its segments receive `country_cluster == -1` and no error is raised

---

### Requirement: Cluster Report

The clusterer SHALL write `data/clusters/cluster_report.json` containing: total points, total global clusters, noise count, noise ratio, per-country cluster count, largest cluster metadata (id, size, top countries, sample texts), and total processing time.

#### Scenario: Report reflects actual output

- **WHEN** the report is written
- **THEN** `total_points` equals the row count of `clustered.parquet` and `total_clusters_global` equals the number of distinct non-noise `global_cluster` values

---

### Requirement: Clustered Parquet Output

The clusterer SHALL produce `data/clusters/clustered.parquet` with columns: `country_code`, `country_name`, `region`, `article_id`, `text`, `x`, `y`, `z`, `global_cluster`, `country_cluster`, `cluster_probability`.

#### Scenario: Output schema complete

- **WHEN** clustering completes
- **THEN** `clustered.parquet` contains all required columns with no null values in `x`, `y`, `z`, `global_cluster`, or `country_code`
