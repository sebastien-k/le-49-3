import { NextRequest, NextResponse } from "next/server";
import { downloadAndParseResource } from "@/lib/mcp/tools";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const maxRows = parseInt(searchParams.get("max_rows") || "100", 10);

    const raw = await downloadAndParseResource({
      resource_id: resourceId,
      max_rows: maxRows,
    });

    return NextResponse.json({ raw });
  } catch (error) {
    console.error("[API] /resources/download error:", error);
    return NextResponse.json(
      {
        error: "Échec du téléchargement",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
