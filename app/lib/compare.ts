import {readFile} from "node:fs/promises";
import path from "node:path";

import type {CompareResponse, CountryPoint} from "@/lib/types";

type CountryDataset = {
  points: CountryPoint[];
  centroid: [number, number, number] | null;
  clusters: Set<number>;
};

const DATA_ROOT = path.join(process.cwd(), "public", "data", "countries");

export async function compareCountries(
  countryA: string,
  countryB: string,
): Promise<CompareResponse> {
  const [datasetA, datasetB] = await Promise.all([
    loadCountryDataset(countryA),
    loadCountryDataset(countryB),
  ]);

  const sharedClusters = [...datasetA.clusters].filter((clusterId) =>
    datasetB.clusters.has(clusterId),
  );
  const uniqueToA = [...datasetA.clusters].filter(
    (clusterId) => !datasetB.clusters.has(clusterId),
  );
  const uniqueToB = [...datasetB.clusters].filter(
    (clusterId) => !datasetA.clusters.has(clusterId),
  );

  const unionSize = new Set([...datasetA.clusters, ...datasetB.clusters]).size;
  const jaccardSimilarity =
    unionSize === 0 ? 0 : sharedClusters.length / unionSize;

  return {
    a: countryA,
    b: countryB,
    article_count_a: datasetA.points.length,
    article_count_b: datasetB.points.length,
    cluster_count_a: datasetA.clusters.size,
    cluster_count_b: datasetB.clusters.size,
    shared_cluster_count: sharedClusters.length,
    jaccard_similarity: jaccardSimilarity,
    centroid_distance: euclideanDistance(datasetA.centroid, datasetB.centroid),
    shared_clusters: sharedClusters.sort((left, right) => left - right),
    unique_to_a: uniqueToA.sort((left, right) => left - right),
    unique_to_b: uniqueToB.sort((left, right) => left - right),
  };
}

async function loadCountryDataset(countryCode: string): Promise<CountryDataset> {
  const filePath = path.join(DATA_ROOT, `${countryCode}.json`);
  const payload = JSON.parse(await readFile(filePath, "utf-8")) as CountryPoint[];

  const clusters = new Set(
    payload
      .map((point) => point.global_cluster)
      .filter((clusterId) => clusterId >= 0),
  );

  return {
    points: payload,
    centroid: averageCentroid(payload),
    clusters,
  };
}

function averageCentroid(
  points: CountryPoint[],
): [number, number, number] | null {
  if (points.length === 0) {
    return null;
  }

  const totals = points.reduce(
    (accumulator, point) => {
      accumulator[0] += point.x;
      accumulator[1] += point.y;
      accumulator[2] += point.z;
      return accumulator;
    },
    [0, 0, 0] as [number, number, number],
  );

  return [
    totals[0] / points.length,
    totals[1] / points.length,
    totals[2] / points.length,
  ];
}

function euclideanDistance(
  left: [number, number, number] | null,
  right: [number, number, number] | null,
): number | null {
  if (!left || !right) {
    return null;
  }

  const [dx, dy, dz] = [
    left[0] - right[0],
    left[1] - right[1],
    left[2] - right[2],
  ];
  return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
}
