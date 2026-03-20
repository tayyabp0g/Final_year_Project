import { NextResponse } from "next/server";

export const runtime = "nodejs";

const KROKI_BASE_URL = (process.env.KROKI_BASE_URL || "https://kroki.io").replace(/\/$/, "");

export async function POST(req) {
  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code : "";
    const format = body?.format === "png" ? "png" : "svg";

    if (!code.trim()) {
      return NextResponse.json({ error: "Missing 'code'." }, { status: 400 });
    }

    const res = await fetch(`${KROKI_BASE_URL}/mermaid/${format}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: code,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Diagram render failed (${res.status}).`, details: text.slice(0, 500) },
        { status: 502 }
      );
    }

    if (format === "png") {
      const arr = await res.arrayBuffer();
      return new NextResponse(Buffer.from(arr), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store",
        },
      });
    }

    const svg = await res.text();
    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected error." }, { status: 500 });
  }
}

