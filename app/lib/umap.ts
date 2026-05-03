import type {AtlasSelectionPoint, SearchResultBase} from "./types";

// Global UMAP space centroid (x: -1.07->15.43, y: -4.74->11.43, z: 0.88->17.86).
// Raw corpus coordinates are centered before they are rendered in Plotly.
export const UMAP_CENTER = {x: 7.18, y: 3.35, z: 9.37} as const;

export function centerUmapPoint<T extends Pick<SearchResultBase, "x" | "y" | "z">>(
  point: T,
): T {
  return {
    ...point,
    x: point.x - UMAP_CENTER.x,
    y: point.y - UMAP_CENTER.y,
    z: point.z - UMAP_CENTER.z,
  };
}

export function toAtlasSelectionPointFromSearchBase(
  result: SearchResultBase,
  extras?: Partial<Pick<
    AtlasSelectionPoint,
    "country_cluster" | "cluster_probability" | "rank" | "semantic_score"
  >>,
): AtlasSelectionPoint {
  return {
    ...centerUmapPoint(result),
    country_cluster: extras?.country_cluster ?? null,
    cluster_probability: extras?.cluster_probability ?? null,
    rank: extras?.rank ?? null,
    semantic_score: extras?.semantic_score ?? null,
  };
}
