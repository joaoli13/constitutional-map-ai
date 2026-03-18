import {NextResponse} from "next/server";

import {getArticleDetail} from "@/lib/article";

export async function GET(request: Request) {
  try {
    const {searchParams} = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        {error: "Missing required query parameter: id"},
        {status: 400},
      );
    }

    const article = await getArticleDetail(id);
    if (!article) {
      return NextResponse.json({error: "Article not found."}, {status: 404});
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Article route failed", error);
    return NextResponse.json(
      {error: "Article request failed."},
      {status: 500},
    );
  }
}
