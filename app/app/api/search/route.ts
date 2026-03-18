import {NextResponse} from "next/server";

import {parseSearchParams, searchArticles} from "@/lib/search";

export async function GET(request: Request) {
  try {
    const {query, countries, clusterParam, cluster, limit} = parseSearchParams(
      new URL(request.url),
    );

    if (!query) {
      return NextResponse.json(
        {error: "Missing required query parameter: q"},
        {status: 400},
      );
    }

    if (clusterParam && Number.isNaN(cluster)) {
      return NextResponse.json(
        {error: "Invalid cluster query parameter."},
        {status: 400},
      );
    }

    const payload = await searchArticles({query, countries, cluster, limit});
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Search route failed", error);
    return NextResponse.json(
      {error: "Search request failed."},
      {status: 500},
    );
  }
}
