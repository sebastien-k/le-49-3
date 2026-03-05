import { NextRequest, NextResponse } from "next/server";
import { searchDataservices } from "@/lib/mcp/tools";
import { parseSearchDataservices } from "@/lib/mcp/parsers";

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

    const raw = await searchDataservices({ query, page, page_size: pageSize });
    const { total, dataservices } = parseSearchDataservices(raw);

    return NextResponse.json({ results: dataservices, total, raw, page, pageSize });
  } catch (error) {
    console.error("[API] /dataservices/search error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      {
        error: "Échec de la recherche de dataservices",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
