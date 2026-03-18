export type ColorMode = "country" | "cluster";

export type CountryIndexRecord = {
  code: string;
  iso_alpha2: string;
  name: string;
  region: string;
  sub_region: string;
  constitution_year: number;
  last_amendment_year: number | null;
  article_count: number;
  cluster_count: number;
  semantic_coverage: number;
  semantic_entropy: number;
  has_data: boolean;
};

export type AtlasIndexData = {
  generated_at: string;
  pipeline_version: string;
  total_articles: number;
  countries: CountryIndexRecord[];
};

export type ClusterSummary = {
  id: number;
  size: number;
  label: string | null;
  top_countries: string[];
  centroid: [number, number, number];
  sample_texts: string[];
};

export type CountryPoint = {
  id: string;
  article_id: string;
  text_snippet: string;
  x: number;
  y: number;
  z: number;
  global_cluster: number;
  country_cluster: number;
  cluster_probability: number;
};

export type AtlasSelectionPoint = {
  id: string;
  article_id: string;
  text_snippet: string;
  country_code: string;
  country_name: string;
  x: number;
  y: number;
  z: number;
  global_cluster: number;
  country_cluster: number | null;
  cluster_probability: number | null;
  rank: number | null;
};

export type SearchResult = {
  id: string;
  country_code: string;
  country_name: string;
  article_id: string;
  text_snippet: string;
  global_cluster: number;
  x: number;
  y: number;
  z: number;
  rank: number;
};

export type SearchResponse = {
  query: string;
  total: number;
  results: SearchResult[];
};

export type CompareResponse = {
  a: string;
  b: string;
  article_count_a: number;
  article_count_b: number;
  cluster_count_a: number;
  cluster_count_b: number;
  shared_cluster_count: number;
  jaccard_similarity: number;
  centroid_distance: number | null;
  shared_clusters: number[];
  unique_to_a: number[];
  unique_to_b: number[];
};

export type ArticleDetail = {
  id: string;
  country_code: string;
  country_name: string;
  article_id: string;
  text: string;
  text_snippet: string;
  global_cluster: number;
};
