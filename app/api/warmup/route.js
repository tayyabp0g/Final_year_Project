import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const baseUrl = String(process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || "").replace(/\/$/, "");
  const isLocal = /localhost:11434|127\.0\.0\.1:11434/i.test(baseUrl);
  if (!isLocal) return NextResponse.json({ ok: true, warmed: false });

  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "local";
  const model = process.env.OPENAI_MODEL || process.env.AI_MODEL || "llama3.2:1b";
  const keepAlive = process.env.OLLAMA_KEEP_ALIVE || "30m";

  const timeoutMs = 120000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0,
        max_tokens: 1,
        keep_alive: keepAlive,
        messages: [{ role: "user", content: "ping" }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const msg = data?.error?.message || `Warmup failed (${res.status})`;
      return NextResponse.json({ ok: false, warmed: false, error: msg }, { status: 200 });
    }

    return NextResponse.json({ ok: true, warmed: true });
  } catch (e) {
    clearTimeout(timeout);
    const timedOut = String(e?.name || "").toLowerCase() === "aborterror";
    return NextResponse.json(
      { ok: false, warmed: false, error: timedOut ? "Warmup timed out" : e?.message || "Warmup failed" },
      { status: 200 }
    );
  }
}

