import { NextRequest, NextResponse } from "next/server";
import { searchDatasets } from "@/lib/mcp/tools";
import { parseSearchDatasets } from "@/lib/mcp/parsers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("page_size") || "20", 10);

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Le paramètre 'q' est requis" },
        { status: 400 }
      );
    }

    if (pageSize > 100) {
      return NextResponse.json(
        { error: "page_size doit être <= 100" },
        { status: 400 }
      );
    }

    const raw = await searchDatasets({ query, page, page_size: pageSize });
    const { total, datasets } = parseSearchDatasets(raw);

    return NextResponse.json({ results: datasets, total, raw, page, pageSize });
  } catch (error) {
    console.error("[API] /datasets/search error:", error);
    return NextResponse.json(
      {
        error: "Échec de la recherche de datasets",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
