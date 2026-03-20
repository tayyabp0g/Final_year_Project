import { NextResponse } from "next/server";

export const runtime = "nodejs";

function approxTokens(text) {
  // Very rough: ~4 chars per token for English-ish text.
  return Math.ceil(String(text ?? "").length / 4);
}

function trimMessagesToBudget(messages, { tokenBudget, perMessageCharLimit }) {
  const trimmed = messages.map((m) => ({
    ...m,
    content: String(m.content ?? "").slice(0, perMessageCharLimit),
  }));

  let total = trimmed.reduce((sum, m) => sum + approxTokens(m.content), 0);
  while (total > tokenBudget && trimmed.length > 1) {
    // Remove oldest non-system message (keep any system messages at the start)
    const firstNonSystemIndex = trimmed.findIndex((m) => m?.role !== "system");
    if (firstNonSystemIndex <= 0) break;
    const removed = trimmed.splice(firstNonSystemIndex, 1)[0];
    total -= approxTokens(removed?.content);
  }
  return trimmed;
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function detectSrsRequest(text) {
  const t = normalizeText(text);
  if (!t) return false;

  // English + Roman Urdu triggers
  const triggers = [
    "generate",
    "create srs",
    "create a srs",
    "final srs",
    "full srs",
    "complete srs",
    "export",
    "download",
    "pdf",
    "markdown",
    "srs bana",
    "srs bna",
    "srs banado",
    "srs bana do",
    "srs bana dy",
    "srs bana de",
    "complete depth",
    "proper srs",
  ];

  if (triggers.some((k) => t.includes(k))) return true;
  if (t.includes("srs") && (t.includes("final") || t.includes("export") || t.includes("pdf") || t.includes("download"))) {
    return true;
  }

  return false;
}

function detectContinue(text) {
  const t = normalizeText(text);
  if (!t) return false;
  return (
    t === "continue" ||
    t.startsWith("continue ") ||
    t === "next" ||
    t.startsWith("next ") ||
    t.includes("next part") ||
    t.includes("agla") ||
    t.includes("aglay") ||
    t.includes("part 2") ||
    t.includes("part 3")
  );
}

function parseLastPartMarker(assistantText) {
  const raw = String(assistantText ?? "");
  const m = raw.match(/SRS\s*Part\s*(\d+)\s*\/\s*(\d+)/i);
  if (!m) return null;
  const part = Number.parseInt(m[1], 10);
  const total = Number.parseInt(m[2], 10);
  if (!Number.isFinite(part) || !Number.isFinite(total)) return null;
  return { part, total };
}

function lastMessageOfRole(messages, role) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === role) return messages[i];
  }
  return null;
}

function isHighDetailRequest(text) {
  const t = normalizeText(text);
  if (!t) return false;
  return (
    t.includes("fine detail") ||
    t.includes("full detail") ||
    t.includes("complete depth") ||
    t.includes("proper srs") ||
    t.includes("complete srs") ||
    t.includes("full srs") ||
    t.includes("detail") ||
    t.includes("depth")
  );
}

async function callOpenAiCompatible({
  baseUrl,
  apiKey,
  model,
  payload,
  isOpenRouter,
  openRouterReferer,
  openRouterTitle,
}) {
  const isLocal = /localhost:11434|127\.0\.0\.1:11434/i.test(String(baseUrl || ""));
  const timeoutMs = Number.parseInt(
    process.env.AI_REQUEST_TIMEOUT_MS || process.env.OPENAI_TIMEOUT_MS || (isLocal ? "180000" : "90000"),
    10
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 90000);
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(isOpenRouter
        ? {
            "HTTP-Referer": openRouterReferer,
            "X-Title": openRouterTitle,
          }
        : {}),
    },
    body: JSON.stringify({ ...payload, model }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  const data = await response.json().catch(() => null);
  return { response, data };
}

async function callGeminiGenerateContent({ apiKey, model, systemPrompt, messages, temperature, maxOutputTokens }) {
  const baseUrl = (process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
  const url = `${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = (messages || []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content ?? "") }],
  }));

  const body = {
    contents,
    system_instruction: {
      parts: [{ text: String(systemPrompt || "") }],
    },
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  const timeoutMs = Number.parseInt(process.env.AI_REQUEST_TIMEOUT_MS || "90000", 10);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 90000);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  const data = await response.json().catch(() => null);
  return { response, data };
}

async function streamOpenAiCompatibleSse({
  baseUrl,
  apiKey,
  model,
  payload,
  isOpenRouter,
  openRouterReferer,
  openRouterTitle,
  providerUsed,
}) {
  const isLocal = /localhost:11434|127\.0\.0\.1:11434/i.test(String(baseUrl || ""));
  const timeoutMs = Number.parseInt(
    process.env.AI_REQUEST_TIMEOUT_MS || process.env.OPENAI_TIMEOUT_MS || (isLocal ? "180000" : "90000"),
    10
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 90000);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(isOpenRouter
        ? {
            "HTTP-Referer": openRouterReferer,
            "X-Title": openRouterTitle,
          }
        : {}),
    },
    body: JSON.stringify({ ...payload, model, stream: true }),
    signal: controller.signal,
  });

  if (!response.ok) {
    clearTimeout(timeout);
    const data = await response.json().catch(() => null);
    return { response, data, streamResponse: null };
  }

  const ct = String(response.headers.get("content-type") || "");
  if (!ct.toLowerCase().includes("text/event-stream") || !response.body) {
    clearTimeout(timeout);
    const data = await response.json().catch(() => null);
    return { response, data, streamResponse: null };
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (obj) => {
        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      send({ providerUsed });

      const reader = response.body.getReader();
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          let idx = buffer.indexOf("\n\n");
          while (idx !== -1) {
            const packet = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            idx = buffer.indexOf("\n\n");

            const lines = packet.split("\n");
            for (const line of lines) {
              const t = String(line || "").trimStart();
              if (!t.startsWith("data:")) continue;
              const dataText = t.slice(5).trim();
              if (!dataText) continue;
              if (dataText === "[DONE]") {
                send({ done: true });
                ctrl.close();
                clearTimeout(timeout);
                return;
              }
              let json = null;
              try {
                json = JSON.parse(dataText);
              } catch {
                continue;
              }
              const delta =
                json?.choices?.[0]?.delta?.content ??
                json?.choices?.[0]?.message?.content ??
                "";
              if (typeof delta === "string" && delta) send({ delta });
            }
          }
        }

        send({ done: true });
        ctrl.close();
      } catch (e) {
        send({ error: e?.message || "Stream failed" });
        ctrl.close();
      } finally {
        clearTimeout(timeout);
      }
    },
  });

  const streamResponse = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Provider-Used": providerUsed || "",
    },
  });

  return { response, data: null, streamResponse };
}

function parseRetryAfterSeconds({ response, upstreamMessage, data, useGemini }) {
  const headerRetryAfter = response?.headers?.get?.("retry-after");
  const retryAfterFromHeader = headerRetryAfter ? Number.parseFloat(headerRetryAfter) : null;
  if (Number.isFinite(retryAfterFromHeader)) return retryAfterFromHeader;

  const msg = String(upstreamMessage || "");
  const m = msg.match(/try again in\s+([\d.]+)\s*s/i);
  const retryAfterFromMessage = m ? Number.parseFloat(m[1]) : null;
  if (Number.isFinite(retryAfterFromMessage)) return retryAfterFromMessage;

  if (useGemini) {
    // Gemini often returns google.rpc.RetryInfo with retryDelay e.g. "21s"
    const details = data?.error?.details;
    if (Array.isArray(details)) {
      for (const d of details) {
        const delay = d?.retryDelay;
        const mm = String(delay || "").match(/([\d.]+)\s*s/i);
        const s = mm ? Number.parseFloat(mm[1]) : null;
        if (Number.isFinite(s)) return s;
      }
    }
  }

  return null;
}

function postProcessSrsMarkdown(raw) {
  const text = String(raw ?? "").replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const out = [];
  let inFence = false;

  const pushBlankLineIfNeeded = () => {
    if (out.length === 0) return;
    if (out[out.length - 1].trim() !== "") out.push("");
  };

  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i] ?? "";

    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    const trimmed = line.trimEnd();

    // Preserve SRS part marker line verbatim.
    if (/^\s*SRS\s*Part\s*\d+\s*\/\s*\d+\s*$/i.test(trimmed)) {
      pushBlankLineIfNeeded();
      out.push(trimmed);
      out.push("");
      continue;
    }

    // Normalize numbered section headings when the model forgets Markdown '#'
    if (!/^\s*#/.test(trimmed)) {
      const m3 = trimmed.match(/^\s*(\d+)\.(\d+)\.(\d+)\s+(.+?)\s*$/);
      if (m3) {
        pushBlankLineIfNeeded();
        out.push(`#### ${m3[1]}.${m3[2]}.${m3[3]} ${m3[4]}`);
        out.push("");
        continue;
      }

      const m2 = trimmed.match(/^\s*(\d+)\.(\d+)\s+(.+?)\s*$/);
      if (m2) {
        pushBlankLineIfNeeded();
        out.push(`### ${m2[1]}.${m2[2]} ${m2[3]}`);
        out.push("");
        continue;
      }

      const m1 = trimmed.match(/^\s*(\d+)\.\s+(.+?)\s*$/);
      if (m1) {
        pushBlankLineIfNeeded();
        out.push(`## ${m1[1]}. ${m1[2]}`);
        out.push("");
        continue;
      }
    }

    // Ensure blank line after explicit Markdown headings too.
    if (/^\s*#{1,6}\s+\S/.test(trimmed)) {
      pushBlankLineIfNeeded();
      out.push(trimmed);
      out.push("");
      continue;
    }

    out.push(trimmed);
  }

  // Trim excessive trailing blank lines
  while (out.length && out[out.length - 1].trim() === "") out.pop();
  return out.join("\n");
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages, stream } = body || {};
    const wantsStream = Boolean(stream);

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: 'messages' must be an array." },
        { status: 400 }
      );
    }

    const openAiCompatibleApiKey =
      process.env.OPENAI_API_KEY ||
      process.env.AI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OPENROUTER_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY;
    const provider = normalizeText(process.env.AI_PROVIDER || "");

    if (!openAiCompatibleApiKey && !geminiApiKey) {
      return NextResponse.json(
        {
          error:
            "Server is not configured. Set OPENAI_API_KEY (or GROQ_API_KEY / OPENROUTER_API_KEY) or GEMINI_API_KEY in `.env.local` (Next.js) and restart the frontend.",
        },
        { status: 500 }
      );
    }

    const wantsOpenAiCompatible = ["openai", "openrouter", "groq", "openai-compatible", "openai_compatible"].includes(provider);
    // Prefer Gemini automatically when a Gemini key is present, unless the user explicitly selects an OpenAI-compatible provider.
    const useGemini = provider === "gemini" || (!wantsOpenAiCompatible && Boolean(geminiApiKey));

    // OpenAI-compatible config (OpenAI / Groq / OpenRouter, etc.)
    const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY);
    const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY || process.env.AI_API_KEY);
    const hasGroqKey = Boolean(process.env.GROQ_API_KEY);

    const baseUrlDefault = (() => {
      if (hasOpenRouterKey && !hasGroqKey && !process.env.OPENAI_BASE_URL && !process.env.AI_BASE_URL && !hasOpenAiKey) {
        return "https://openrouter.ai/api/v1";
      }
      // If Groq key is present and nothing else is configured, default to Groq's OpenAI-compatible endpoint.
      if (hasGroqKey && !process.env.OPENAI_BASE_URL && !process.env.AI_BASE_URL && !hasOpenAiKey) {
        return "https://api.groq.com/openai/v1";
      }
      return "https://api.openai.com/v1";
    })();

    const baseUrl = (process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || baseUrlDefault).replace(/\/$/, "");
    const isOpenRouter = /openrouter\.ai/i.test(baseUrl);
    const isGroq = /groq\.com/i.test(baseUrl);
    const isLocal = /localhost:11434|127\.0\.0\.1:11434/i.test(baseUrl);
    const modelDefault = isOpenRouter ? "openai/gpt-4o-mini" : "gpt-4o-mini";
    const openRouterModelEnv = process.env.OPENROUTER_MODEL || "";
    const model =
      process.env.OPENAI_MODEL ||
      process.env.AI_MODEL ||
      (isOpenRouter && openRouterModelEnv.trim() ? openRouterModelEnv.trim() : modelDefault);

    const maxTokensEnv = process.env.OPENAI_MAX_TOKENS || process.env.AI_MAX_TOKENS || "";
    // Keep per-call output smaller on rate-limited providers and on local CPU models (to avoid long hangs).
    const maxTokensDefault = isGroq ? "1100" : isOpenRouter ? "1200" : useGemini ? "900" : isLocal ? "220" : "2400";
    let maxTokens = parseInt(maxTokensEnv || maxTokensDefault, 10);
    let tokenBudget = parseInt(
      process.env.OPENAI_PROMPT_TOKEN_BUDGET || (isGroq ? "6500" : isOpenRouter ? "6500" : isLocal ? "2200" : "9000"),
      10
    );
    let perMessageCharLimit = parseInt(
      process.env.OPENAI_MESSAGE_CHAR_LIMIT || (isGroq ? "4500" : isOpenRouter ? "5000" : isLocal ? "1400" : "6000"),
      10
    );

    // Local Ollama models can stall with large contexts/outputs. Clamp to keep responses snappy.
    if (isLocal) {
      if (Number.isFinite(maxTokens)) maxTokens = Math.min(maxTokens, 260);
      if (Number.isFinite(tokenBudget)) tokenBudget = Math.min(tokenBudget, 2600);
      if (Number.isFinite(perMessageCharLimit)) perMessageCharLimit = Math.min(perMessageCharLimit, 1600);
    }

    // Groq free tier enforces strict Tokens-Per-Minute (TPM). Keep input+output under the limit.
    const tpmLimit = parseInt(process.env.AI_TPM_LIMIT || (isGroq ? "12000" : "0"), 10);

    const fence = "```";
    const systemPrompt = `You are an AI assistant inside an SRS Generator web app.\n\nGoal: interview the user step-by-step and then generate a detailed, company-ready Software Requirements Specification (SRS) aligned with IEEE 830 / ISO/IEC/IEEE 29148 style.\n\nUse this REQUIRED section layout (keep numbering exactly):\n1. Introduction\n  1.1 Purpose of Document\n  1.2 Project Overview\n  1.3 Scope (In scope / Out of scope)\n  1.4 Definitions, Acronyms, and Abbreviations\n  1.5 References\n  1.6 Document Overview\n2. Overall System Description\n  2.1 Product Perspective\n  2.2 Product Functions\n  2.3 User Classes and Characteristics\n  2.4 Operating Environment\n  2.5 Design and Implementation Constraints\n  2.6 Assumptions and Dependencies\n3. External Interface Requirements\n  3.1 User Interfaces\n  3.2 Hardware Interfaces\n  3.3 Software Interfaces\n  3.4 Communication Interfaces\n4. Functional Requirements\n  (Use numbered identifiers FR-1, FR-2, ...)\n5. Non-functional Requirements\n  5.1 Performance (NFR-P*)\n  5.2 Security (NFR-SE*)\n  5.3 Reliability (NFR-R*)\n  5.4 Availability (NFR-A*)\n  5.5 Maintainability (NFR-M*)\n  5.6 Portability (NFR-PO*)\n  5.7 Usability & Accessibility (NFR-U*)\n6. References\n7. Appendix\n  7.1 Use Cases (UC-1, UC-2, ...)\n  7.2 Flow Diagram (Mermaid)\n  7.3 System Architecture Diagram (Mermaid)\n\nConversation rules:\n- Ask ONE focused question at a time until you have enough information.\n- If the user provides partial info, continue with the next best question.\n- If something is unknown, state assumptions explicitly.\n- Do NOT invent real people, organizations, or dates unless the user provides them.\n- If the user asks for “PDF”, “download”, or “export”, respond by generating the SRS in Markdown (the app exports to PDF).\n\nFormatting rules (very important):\n- Use Markdown headings (#, ##, ###) ONLY at the start of a line.\n- Every heading must be on its own line, followed by a blank line.\n- Never write headings inline in a paragraph.\n- Use bullet lists with '-' on their own lines.\n- Keep line breaks readable.\n\nFunctional requirement format (very important):\n- For EACH FR, output a mini-spec block with these fields on separate lines:\n  - ID:\n  - Title:\n  - Description: (use “shall” statements)\n  - Inputs:\n  - Processing:\n  - Outputs:\n  - Preconditions:\n  - Postconditions:\n  - Priority: (Must/Should/Could)\n  - Acceptance Criteria:\n\nMermaid rules (very important):\n- Use only valid Mermaid syntax.\n- Start diagrams with 'flowchart LR' (or 'flowchart TD').\n- Use edges like 'A --> B' or 'A -->|label| B' (never 'A -->|label|> B').\n- Do not output dangling/incomplete lines like 'B --' or 'A -->'.\n\nWhen the user says “generate”, “create SRS”, “final”, “export”, or clearly requests the document:\n- Output ONLY the final SRS in Markdown.\n- Include at least 12 functional requirements.\n- Include at least 18 non-functional requirements across the NFR categories.\n- Under 7.2 and 7.3, include Mermaid diagrams in fenced code blocks exactly like:\n${fence}mermaid\nflowchart LR\nA[User] --> B[Server]\n${fence}\n`;

    const userMessages = messages
      .filter((m) => m && typeof m === "object")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content ?? ""),
      }))
      .slice(-18);

    const lastUser = lastMessageOfRole(userMessages, "user");
    const lastAssistant = lastMessageOfRole(userMessages, "assistant");
    const lastUserText = lastUser?.content || "";

    const wantsSrsNow = detectSrsRequest(lastUserText);
    const wantsContinue = detectContinue(lastUserText);
    const highDetail = isHighDetailRequest(lastUserText);
    // Local small models can hang on very large minimums; keep the bar achievable and allow follow-up expansion.
    const minFr = isLocal ? (highDetail ? 10 : 8) : highDetail ? 20 : 12;
    const minNfr = isLocal ? (highDetail ? 14 : 12) : highDetail ? 28 : 18;

    const lastMarker = parseLastPartMarker(lastAssistant?.content || "");
    const shouldContinueSrs = Boolean(wantsContinue && lastMarker && lastMarker.part < lastMarker.total);

    const pagingRules = (() => {
      if (shouldContinueSrs) {
        const nextPart = Math.min(lastMarker.part + 1, lastMarker.total);
        const nextNext = Math.min(nextPart + 1, lastMarker.total);
        return (
          "SRS paging rules (IMPORTANT):\n" +
          "- Continue the same SRS without repeating previous parts.\n" +
          "- Start EXACTLY where the previous part ended (next sentence/next subsection).\n" +
          `- Begin the response with a single line exactly like: SRS Part ${nextPart}/${lastMarker.total}\n` +
          "- Do not write anything before that first line.\n" +
          "- Output ONLY this part.\n" +
          "- End at a clean boundary (end of a subsection), not mid-sentence.\n" +
          `- If this is the FINAL part (Part ${lastMarker.total}/${lastMarker.total}), it MUST include 7.2 and 7.3 Mermaid diagrams in \`${fence}mermaid\` fenced blocks.\n` +
          `- If this is not the final part, end with: (AutoSRS will request CONTINUE for Part ${nextNext}/${lastMarker.total}.)\n`
        );
      }

      if (wantsSrsNow) {
        return (
          "SRS paging rules (IMPORTANT):\n" +
          "- The SRS is long; split it into multiple parts.\n" +
          "- Begin the response with a single line exactly like: SRS Part 1/TOTAL\n" +
          "- Choose TOTAL as a whole number between 2 and 10 and keep it consistent across all parts.\n" +
          `- Prefer TOTAL between ${isLocal ? "6 and 10" : highDetail ? "6 and 10" : "3 and 6"} (smaller parts are more reliable).\n` +
          (isLocal ? "- Keep THIS part short. Do not try to write everything at once.\n" : "") +
          "- Do not write anything before that first line.\n" +
          "- Output ONLY Part 1 in this response.\n" +
          "- End at a clean boundary (end of a subsection), not mid-sentence.\n" +
          "- If more parts remain, end with: (AutoSRS will request CONTINUE for Part 2/TOTAL.)\n"
        );
      }

      return "";
    })();

    const effectiveSystemPrompt =
      // Local (Ollama) needs a shorter instruction set to avoid long "thinking" stalls.
      (isLocal
        ? `You are an AI assistant in an SRS Generator app.\n\nGoal: produce a clear, company-ready SRS in Markdown using the required outline.\n\nIMPORTANT (local speed):\n- Start writing immediately (no long thinking).\n- Keep each response short (aim under ~250 tokens).\n- Prefer smaller SRS parts.\n\nRequired section layout:\n1. Introduction (1.1–1.6)\n2. Overall System Description (2.1–2.6)\n3. External Interface Requirements (3.1–3.4)\n4. Functional Requirements (FR-1, FR-2, ... blocks)\n5. Non-functional Requirements (NFR-P*, NFR-SE*, NFR-R*, NFR-A*, NFR-M*, NFR-PO*, NFR-U*)\n6. References\n7. Appendix (7.1 Use Cases, 7.2 Flow Diagram Mermaid, 7.3 Architecture Mermaid)\n\nRules:\n- Ask ONE question only if essential; otherwise proceed with reasonable assumptions.\n- Use valid Mermaid. First line in Mermaid blocks: flowchart LR.\n- Use short node IDs without spaces.\n\nWhen asked to generate/final/export:\n- Output ONLY the SRS in Markdown.\n- Prefer shorter parts and finish diagrams in the final part.\n`
        : systemPrompt) +
      (wantsSrsNow || shouldContinueSrs
        ? `\n\nOverrides (IMPORTANT):\n- These overrides supersede any earlier minimum counts.\n- Across the WHOLE SRS (all parts combined), include at least ${minFr} functional requirements.\n- Across the WHOLE SRS (all parts combined), include at least ${minNfr} non-functional requirements across the NFR categories.\n- If you cannot fit everything in this part, stop cleanly and wait for CONTINUE.\n- Under 7.2 and 7.3 (in the FINAL part), include Mermaid diagrams in fenced code blocks (use the \`${fence}mermaid\` fence).\n\nMermaid strict rules (to avoid parser errors):\n- FIRST LINE inside each Mermaid block must be: flowchart LR\n- Use short node IDs without spaces (e.g., U, APP, API, DB, PG).\n- Put human-readable text only inside brackets, e.g., PG[Payment Gateway].\n- Never use raw phrases as node IDs like \"Payment Gateway --> Order Service\".\n- Use only edges like: A --> B or A -->|label| B\n\n${pagingRules}`
        : "");

    // Keep context small during multi-part continuation to reduce TPM usage and speed up local models.
    const contextTail = isLocal ? (shouldContinueSrs ? 4 : wantsSrsNow ? 6 : 10) : shouldContinueSrs ? 6 : wantsSrsNow ? 10 : 18;
    const contextMessages = userMessages.slice(-contextTail);

    const preparedContext = trimMessagesToBudget(contextMessages, { tokenBudget, perMessageCharLimit });

    // For long SRS generation, allow a bit more output per request (still provider-safe).
    const maxTokensForThisRequest = (() => {
      if (!wantsSrsNow && !shouldContinueSrs) return Number.isFinite(maxTokens) ? maxTokens : 900;
      const hardCap = isGroq ? 1200 : useGemini ? 1400 : isLocal ? 260 : 3000;
      const safe = Number.isFinite(maxTokens) ? maxTokens : isGroq ? 1100 : useGemini ? 900 : isLocal ? 220 : 1400;
      const minOut = isLocal ? 120 : 600;
      return Math.min(hardCap, Math.max(minOut, safe));
    })();

    let response = null;
    let data = null;
    const providerUsed = useGemini ? "gemini" : isOpenRouter ? "openrouter" : isGroq ? "groq" : "openai-compatible";

    if (useGemini) {
      const geminiModel = (process.env.GEMINI_MODEL || process.env.AI_MODEL || "gemini-2.0-flash").trim();
      const r = await callGeminiGenerateContent({
        apiKey: geminiApiKey,
        model: geminiModel,
        systemPrompt: effectiveSystemPrompt,
        messages: preparedContext,
        temperature: 0.2,
        maxOutputTokens: maxTokensForThisRequest,
      });
      response = r.response;
      data = r.data;
    } else {
      const openRouterReferer =
        process.env.OPENROUTER_HTTP_REFERER ||
        process.env.OPENROUTER_REFERRER ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000";
      const openRouterTitle = process.env.OPENROUTER_APP_TITLE || process.env.OPENROUTER_APP_NAME || "AutoSRS.ai";

      const payload = {
        temperature: 0.2,
        max_tokens: maxTokensForThisRequest,
        messages: [{ role: "system", content: effectiveSystemPrompt }, ...preparedContext],
        ...(isLocal ? { stream: false, keep_alive: process.env.OLLAMA_KEEP_ALIVE || "30m" } : {}),
      };

      if (wantsStream && isLocal) {
        const s = await streamOpenAiCompatibleSse({
          baseUrl,
          apiKey: openAiCompatibleApiKey,
          model,
          payload,
          isOpenRouter,
          openRouterReferer,
          openRouterTitle,
          providerUsed,
        });
        if (s.streamResponse) return s.streamResponse;
        response = s.response;
        data = s.data;
      } else {
        const r = await callOpenAiCompatible({
          baseUrl,
          apiKey: openAiCompatibleApiKey,
          model,
          payload,
          isOpenRouter,
          openRouterReferer,
          openRouterTitle,
        });
        response = r.response;
        data = r.data;
      }
    }

    if (!response.ok) {
      const upstreamMessage =
        data?.error?.message ||
        data?.error?.message ||
        `Upstream AI request failed (${response.status}). Check OPENAI_BASE_URL/OPENAI_MODEL.`;

      // Surface rate limits so the client can auto-wait and retry.
      if (response.status === 429 || /rate limit/i.test(String(upstreamMessage)) || /resource_exhausted/i.test(String(upstreamMessage))) {
        const retryAfterSeconds = parseRetryAfterSeconds({ response, upstreamMessage, data, useGemini });
        return NextResponse.json(
          {
            error: upstreamMessage,
            retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : null,
            providerUsed,
          },
          { status: 429 }
        );
      }

      // If Groq (or another provider) complains the prompt is too large, retry once with a smaller context.
      if (String(upstreamMessage).toLowerCase().includes("request too large")) {
        const smaller = trimMessagesToBudget(
          [{ role: "system", content: effectiveSystemPrompt }, ...userMessages.slice(-8)],
          { tokenBudget: Math.min(5000, tokenBudget), perMessageCharLimit: Math.min(2500, perMessageCharLimit) }
        );

        const retry = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ ...payload, messages: smaller, max_tokens: Math.min(600, payload.max_tokens) }),
        });

        const retryData = await retry.json().catch(() => null);
        if (retry.ok) {
          const content = retryData?.choices?.[0]?.message?.content;
          if (typeof content === "string" && content.trim()) return NextResponse.json({ content });
        }
      }

      return NextResponse.json({ error: upstreamMessage, providerUsed }, { status: 502 });
    }

    const content = (() => {
      if (useGemini) {
        const parts = data?.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) {
          return parts.map((p) => p?.text).filter(Boolean).join("");
        }
        return data?.candidates?.[0]?.content?.parts?.[0]?.text;
      }
      return data?.choices?.[0]?.message?.content;
    })();
    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "AI returned an empty response." },
        { status: 502 }
      );
    }

    const shouldNormalize =
      detectSrsRequest(lastUserText) || detectContinue(lastUserText) || /SRS\s*Part\s*\d+\s*\/\s*\d+/i.test(content);
    const finalContent = shouldNormalize ? postProcessSrsMarkdown(content) : content;

    return NextResponse.json({ content: finalContent, providerUsed });
  } catch (error) {
    if (String(error?.name || "").toLowerCase() === "aborterror") {
      return NextResponse.json(
        { error: "AI request timed out. Try again (smaller output) or reduce OPENAI_MAX_TOKENS / AI_REQUEST_TIMEOUT_MS.", timedOut: true },
        { status: 504 }
      );
    }
    const msg = String(error?.message || "Unexpected server error.");
    if (/fetch failed/i.test(msg)) {
      const baseUrl = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || "";
      return NextResponse.json(
        {
          error:
            `Upstream connection failed (fetch failed). If you are using Ollama, make sure it is running and reachable at ${baseUrl || "http://localhost:11434/v1"}.`,
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
