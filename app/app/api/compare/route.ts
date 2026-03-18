import {NextResponse} from "next/server";

import {compareCountries} from "@/lib/compare";

export async function GET(request: Request) {
  try {
    const {searchParams} = new URL(request.url);
    const countryA = searchParams.get("a")?.trim().toUpperCase();
    const countryB = searchParams.get("b")?.trim().toUpperCase();

    if (!countryA || !countryB) {
      return NextResponse.json(
        {error: "Query parameters a and b are required."},
        {status: 400},
      );
    }

    if (countryA === countryB) {
      return NextResponse.json(
        {error: "Comparison requires two distinct countries."},
        {status: 400},
      );
    }

    const payload = await compareCountries(countryA, countryB);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Compare route failed", error);
    return NextResponse.json(
      {error: "Comparison request failed."},
      {status: 500},
    );
  }
}
