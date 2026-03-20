"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Menu, Plus, MessageSquare, FileText, Download, User, LogOut, ChevronLeft, ChevronRight, MoreHorizontal, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

function MermaidDiagram({ code }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const sanitizeMermaid = (raw) => {
      let txt = String(raw ?? "").replace(/\r\n/g, "\n").trim();
      txt = txt.replace(/^```(?:mermaid)?/i, "").replace(/```$/m, "").trim();
      const lines = txt.split("\n");
      while (lines.length && !lines[0].trim()) lines.shift();
      if (lines[0]?.trim().toLowerCase() === "mermaid") lines.shift();

      const labelToId = new Map();
      const usedIds = new Set();

      const idForLabel = (label) => {
        const key = String(label || "").trim();
        if (labelToId.has(key)) return labelToId.get(key);

        let base = key
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");

        if (!base) base = "n";
        if (!/^[a-z]/.test(base)) base = `n_${base}`;

        let candidate = base;
        let i = 2;
        while (usedIds.has(candidate)) {
          candidate = `${base}_${i}`;
          i += 1;
        }

        usedIds.add(candidate);
        labelToId.set(key, candidate);
        return candidate;
      };

      const splitClassSuffix = (rawNode) => {
        const rawText = String(rawNode || "").trim();
        const idx = rawText.indexOf(":::");
        if (idx === -1) return { node: rawText, suffix: "" };
        return { node: rawText.slice(0, idx).trim(), suffix: ` ${rawText.slice(idx).trim()}` };
      };

      const cleanNodeLabel = (label) => {
        let s = String(label || "")
          .replace(/\r?\n/g, " ")
          .replace(/\t/g, " ")
          .trim();

        // AI sometimes leaks edge-label syntax into node labels: [|label|]
        s = s.replace(/^\|+/, "").replace(/\|+$/, "");

        // Mermaid flowchart node labels don't need pipes; they frequently break parsing.
        s = s.replace(/\|+/g, " ");

        // Brackets/parentheses in labels often trigger Mermaid shape parsing (e.g., (( )), [ ]) or mismatches.
        s = s.replace(/[\[\]\(\)\{\}<>]/g, " ");

        // Remove long ASCII separators that sometimes get appended
        s = s.replace(/-{3,}/g, " ");

        // Collapse whitespace
        s = s.replace(/\s+/g, " ").trim();
        return s || "Node";
      };

      const cleanEdgeLabel = (label) => {
        let s = String(label || "")
          .replace(/\r?\n/g, " ")
          .replace(/\t/g, " ")
          .trim();

        // Strip characters that frequently break `--> |label|` syntax
        s = s.replace(/\|+/g, " ");
        s = s.replace(/[\[\]\(\)\{\}<>]/g, " ");
        s = s.replace(/-{3,}/g, " ");
        s = s.replace(/\s+/g, " ").trim();
        return s;
      };

      const normalizeNodeRef = (rawNode) => {
        const { node, suffix } = splitClassSuffix(rawNode);
        const n = String(node || "").trim();
        if (!n) return "";

        const shaped = n.match(/^([A-Za-z_][\w-]*)\s*(\[(.*)\]|\((.*)\)|\{(.*)\})$/);
        if (shaped) {
          const id = shaped[1];
          const label = cleanNodeLabel(shaped[3] ?? shaped[4] ?? shaped[5] ?? "");
          return `${id}[${label}]${suffix}`;
        }

        if (/^[A-Za-z_][\w-]*$/.test(n)) return `${n}${suffix}`;

        const label = n.replace(/^[\[\(]\s*|\s*[\]\)]$/g, "");
        const safeLabel = String(label).replace(/[\[\]]/g, (ch) => (ch === "[" ? "(" : ")"));
        const id = idForLabel(safeLabel);
        return `${id}[${cleanNodeLabel(safeLabel)}]${suffix}`;
      };

      const cleaned = [];
      for (let line of lines) {
        line = line.replace(/\t/g, "  ").trimEnd();
        line = line.replace(/\s+-{3,}\s*$/g, "").trimEnd();

        // Fix a common AI typo: extra ">" after edge label (TAGEND parse error)
        // Example: A -->|register|> B  =>  A -->|register| B
        line = line.replace(/\|\s*([^|]+?)\s*\|>\s*/g, "|$1| ");

        const trimmed = line.trim();
        if (!trimmed) continue;

        // Remove dangling arrows like "B --" or "A -->"
        if (/^\s*[\w\[\]\(\)\"'.-]+\s*-->\s*$/.test(line)) continue;
        if (/^\s*[\w\[\]\(\)\"'.-]+\s*--\s*$/.test(line)) continue;
        if (/^\s*[\w\[\]\(\)\"'.-]+\s*-\s*$/.test(line)) continue;

        // If a line ends with a stray ">" after an arrow, drop it
        line = line.replace(/(-->|---|--)\s*>+\s*$/g, "$1");

        // Keep common directives/comments as-is
        if (/^(flowchart|graph)\s+/i.test(trimmed)) {
          cleaned.push(trimmed.replace(/\s+/g, " "));
          continue;
        }
        if (/^(subgraph)\b/i.test(trimmed) || /^end\b/i.test(trimmed)) {
          cleaned.push(trimmed);
          continue;
        }
        if (/^(classDef|class|style|linkStyle|direction|click)\b/i.test(trimmed)) {
          cleaned.push(trimmed);
          continue;
        }
        if (/^%%/.test(trimmed)) {
          cleaned.push(trimmed);
          continue;
        }

        // Repair common "labels used as node IDs" mistakes on edges
        const edge = trimmed.match(/^\s*(.+?)\s*-->\s*(?:\|([^|]+)\|\s*)?(.+?)\s*$/);
        if (edge) {
          const left = normalizeNodeRef(edge[1]);
          const label = edge[2] ? cleanEdgeLabel(edge[2]) : "";
          const right = normalizeNodeRef(edge[3]);
          if (!left || !right) continue;
          cleaned.push(`${left} -->${label ? `|${label}| ` : " "}${right}`);
          continue;
        }

        // Drop non-mermaid prose lines that commonly break parsing
        if (!trimmed.includes("-->")) continue;
        cleaned.push(trimmed);
      }

      if (cleaned.length === 0) return "";

      const first = cleaned.find((l) => l && l.trim()) || "";
      if (!/^(flowchart|graph)\s+/i.test(first.trim())) {
        cleaned.unshift("flowchart LR");
      }

      return cleaned.join("\n").trim();
    };

    const run = async () => {
      try {
        setError("");
        setSvg("");

        const mermaidCode = sanitizeMermaid(code);
        if (!mermaidCode) return;

        // Prefer local rendering (no network dependency)
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default || mermaidModule;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "strict",
        });

        const id = `mmd_${Math.random().toString(16).slice(2)}`;
        const { svg: rendered } = await mermaid.render(id, mermaidCode);
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Diagram render failed");
      }
    };

    if (typeof code === "string" && code.trim()) run();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-red-300">
        {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-gray-400">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/5 p-3 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function renderMarkdownLite(text) {
  const source = String(text ?? "").replace(/\r\n/g, "\n");
  const lines = source.split("\n");

  const nodes = [];
  let inCode = false;
  let codeLang = "";
  let code = [];
  let para = [];

  const flushPara = () => {
    const content = para.join(" ").trim();
    if (content) {
      nodes.push(
        <p key={`p:${nodes.length}`} className="whitespace-pre-wrap leading-relaxed text-gray-100">
          {content}
        </p>
      );
    }
    para = [];
  };

  const flushCode = () => {
    const content = code.join("\n");
    if (codeLang === "mermaid") {
      nodes.push(<MermaidDiagram key={`mmd:${nodes.length}`} code={content} />);
    } else {
      nodes.push(
        <pre
          key={`code:${nodes.length}`}
          className="whitespace-pre-wrap overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[12px] leading-relaxed text-gray-100"
        >
          {codeLang ? `${codeLang}\n${content}` : content}
        </pre>
      );
    }
    code = [];
    codeLang = "";
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/g, "");
    const fence = line.match(/^```(\w+)?(?:\s+.*)?$/);

    if (fence) {
      flushPara();
      if (!inCode) {
        inCode = true;
        codeLang = (fence[1] || "").toLowerCase();
        code = [];
      } else {
        inCode = false;
        flushCode();
      }
      continue;
    }

    if (inCode) {
      code.push(rawLine);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushPara();
      const level = heading[1].length;
      const HeadingTag = level === 1 ? "h1" : level === 2 ? "h2" : level === 3 ? "h3" : "h4";
      const className =
        level === 1
          ? "text-xl font-bold mt-3"
          : level === 2
            ? "text-lg font-semibold mt-3"
            : level === 3
              ? "text-base font-semibold mt-2"
              : "text-sm font-semibold mt-2";
      nodes.push(
        <HeadingTag key={`h:${nodes.length}`} className={`${className} text-gray-50`}>
          {heading[2].trim()}
        </HeadingTag>
      );
      continue;
    }

    const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
    if (bullet) {
      flushPara();
      nodes.push(
        <div key={`li:${nodes.length}`} className="flex gap-2 text-gray-100 leading-relaxed">
          <span className="mt-1 text-gray-400">•</span>
          <span className="whitespace-pre-wrap">{bullet[1].trim()}</span>
        </div>
      );
      continue;
    }

    if (!line.trim()) {
      flushPara();
      continue;
    }

    para.push(line.trim());
  }

  flushPara();
  if (inCode) flushCode();

  return <div className="space-y-2">{nodes}</div>;
}

function GeneratorPage() {
  const router = useRouter();
  const { user, logout, token } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [historyMenuOpenId, setHistoryMenuOpenId] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [autoContinueParts, setAutoContinueParts] = useState(true);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [resumeHint, setResumeHint] = useState("");

  const abortRef = useRef(null);
  const messagesRef = useRef(messages);
  const activeConversationIdRef = useRef(activeConversationId);

  // Warm up local Ollama (first call can be slow while the model loads into memory).
  useEffect(() => {
    fetch("/api/warmup", { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const normalizeText = (value) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const parseSrsPartMarker = (assistantText) => {
    const raw = String(assistantText ?? "");
    const m = raw.match(/SRS\s*Part\s*(\d+)\s*\/\s*(\d+)/i);
    if (!m) return null;
    const part = Number.parseInt(m[1], 10);
    const total = Number.parseInt(m[2], 10);
    if (!Number.isFinite(part) || !Number.isFinite(total)) return null;
    return { part, total };
  };

  const collapseSpaces = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

  const rawIndexForCollapsedPrefix = (raw, targetCollapsedLen) => {
    const text = String(raw ?? "");
    let collapsedLen = 0;
    let inWs = false;

    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      const isWs = /\s/.test(ch);
      if (isWs) {
        if (!inWs) {
          // would add a single space if we already have some content
          if (collapsedLen > 0) collapsedLen += 1;
          inWs = true;
        }
      } else {
        collapsedLen += 1;
        inWs = false;
      }

      if (collapsedLen >= targetCollapsedLen) return i + 1;
    }

    return text.length;
  };

  const mergeWithoutRepeating = (existingText, incomingText) => {
    const existing = String(existingText ?? "");
    const incoming = String(incomingText ?? "");
    if (!existing.trim()) return incoming;
    if (!incoming.trim()) return existing;

    const oldTailRaw = existing.slice(Math.max(0, existing.length - 5000));
    const newHeadRaw = incoming.slice(0, 5000);

    const oldC = collapseSpaces(oldTailRaw);
    const newC = collapseSpaces(newHeadRaw);
    if (!oldC || !newC) return `${existing}\n\n---\n\n${incoming}`;

    const maxLen = Math.min(1800, oldC.length, newC.length);
    let best = 0;
    for (let len = maxLen; len >= 80; len -= 1) {
      const prefix = newC.slice(0, len);
      if (oldC.endsWith(prefix)) {
        best = len;
        break;
      }
    }

    if (best > 0) {
      const cutIndex = rawIndexForCollapsedPrefix(incoming, best);
      const trimmedIncoming = incoming.slice(cutIndex).replace(/^\s+/, "");
      if (!trimmedIncoming.trim()) return existing;
      return `${existing}\n\n${trimmedIncoming}`;
    }

    return `${existing}\n\n---\n\n${incoming}`;
  };

  const canResumeFromText = (txt) => {
    const t = String(txt || "");
    const marker = parseSrsPartMarker(t);
    if (marker && marker.part < marker.total) return { can: true, hint: `continue (output SRS Part ${marker.part + 1}/${marker.total})` };
    if (/autosrs will request continue/i.test(t)) return { can: true, hint: "continue (do not repeat; continue exactly where you stopped; finish remaining SRS; include 7.2 and 7.3 mermaid diagrams)" };
    if (/(^|\n)\s*\d+\.\s*$/.test(t.trimEnd())) return { can: true, hint: "continue (finish the incomplete section and continue)" };
    return { can: false, hint: "" };
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const cached = localStorage.getItem(`chatConversations:${user.id}`);
      if (cached) setConversations(JSON.parse(cached));
    } catch {}
  }, [user?.id]);

  const fetchConversations = async () => {
    if (!token) return;
    try {
      setHistoryLoading(true);
      setHistoryError("");
      const res = await fetch('http://localhost:5000/api/chat/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `History request failed (${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        const items = data?.data?.conversations || [];
        setConversations(items);
        if (user?.id) {
          try {
            localStorage.setItem(`chatConversations:${user.id}`, JSON.stringify(items));
          } catch {}
        }
      } else {
        throw new Error(data.message || "History request failed");
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
      setHistoryError(err?.message || "Failed to fetch history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteConversation = async (conversationId) => {
    if (!token || !conversationId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/chat/conversations/${encodeURIComponent(conversationId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Delete failed (${res.status})`);
      }

      const next = conversations.filter((h) => h?.conversationId !== conversationId);
      setConversations(next);
      if (user?.id) {
        try {
          localStorage.setItem(`chatConversations:${user.id}`, JSON.stringify(next));
        } catch {}
      }

      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (e) {
      console.error(e);
      setHistoryError(e?.message || "Failed to delete history item");
    } finally {
      setHistoryMenuOpenId(null);
    }
  };

  const handleNewProject = () => {
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setExportOpen(false);
    setHistoryMenuOpenId(null);
    setActiveConversationId(null);
  };

  const handleExportMarkdown = () => {
    const exportText = getExportText();
    if (!exportText) return;

    const blob = new Blob([exportText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `SRS_${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    const exportText = getExportText();
    if (!exportText) return;

    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: exportText,
          filename: `SRS_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `PDF export failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `SRS_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { text: `Error: ${e?.message || "PDF export failed."}`, sender: "ai", id: Date.now() + 2 },
      ]);
    } finally {
      setExportOpen(false);
    }
  };

  const getExportText = () => {
    const combined = messages.find((m) => m?.sender === "ai" && m?.contextSkip && !m?.hidden && typeof m.text === "string" && m.text.trim());
    if (combined) return String(combined.text).trim();

    const aiTexts = messages
      .filter((m) => m?.sender === "ai" && !m?.hidden && typeof m.text === "string" && m.text.trim())
      .map((m) => m.text.trim());
    if (aiTexts.length === 0) return "";

    // Join all assistant parts so multi-part SRS exports correctly.
    return aiTexts.join("\n\n---\n\n");
  };

  const stopGenerating = (note) => {
    try {
      abortRef.current?.abort();
    } catch {}
    abortRef.current = null;
    setIsAutoGenerating(false);
    setIsTyping(false);
    if (note) {
      setMessages((prev) => [
        ...prev,
        { text: note, sender: "ai", id: crypto?.randomUUID ? crypto.randomUUID() : `ai_${Date.now()}` },
      ]);
    }
  };

  const sleep = (ms, signal) =>
    new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
        return;
      }
      const t = setTimeout(resolve, Math.max(0, ms | 0));
      if (signal) {
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(t);
            reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
          },
          { once: true }
        );
      }
    });

  const getConversationTitle = (uiMessages) => {
    const first = (uiMessages || []).find((m) => m?.sender === "user" && !m?.hidden && String(m.text || "").trim());
    return String(first?.text || "SRS Conversation").trim().slice(0, 80);
  };

  const callChatApi = async (uiMessages, signal, { onDelta } = {}) => {
    const apiMessages = (uiMessages || [])
      .filter((msg) => !msg?.contextSkip)
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

    let response = null;
    try {
      response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, stream: Boolean(onDelta) }),
        signal,
      });
    } catch (e) {
      if (String(e?.name || "").toLowerCase() === "aborterror") throw e;
      // Browser network error (dev server restarted/crashed, offline, etc.)
      const err = new Error(
        "Network error calling /api/chat (fetch failed). Make sure `npm run dev` is running, then refresh the page."
      );
      err.name = "NetworkError";
      throw err;
    }

    const contentType = String(response.headers?.get?.("content-type") || "");
    const providerHeader = response.headers?.get?.("x-provider-used") || null;

    if (response.ok && contentType.toLowerCase().includes("text/event-stream") && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      let providerUsed = providerHeader;

      const pump = async () => {
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
              let json = null;
              try {
                json = JSON.parse(dataText);
              } catch {
                continue;
              }
              if (json?.providerUsed && !providerUsed) providerUsed = String(json.providerUsed);
              if (json?.error) throw new Error(String(json.error));
              if (json?.done) return { content: full, providerUsed };
              const delta = json?.delta;
              if (typeof delta === "string" && delta) {
                full += delta;
                if (typeof onDelta === "function") onDelta(delta, { providerUsed });
              }
            }
          }
        }
        return { content: full, providerUsed };
      };

      return await pump();
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 429) {
        const retryAfterSeconds = Number.isFinite(Number(data?.retryAfterSeconds))
          ? Number(data.retryAfterSeconds)
          : null;
        const err = new Error(data?.error || "Rate limited");
        err.name = "RateLimited";
        err.retryAfterMs = retryAfterSeconds ? Math.ceil(retryAfterSeconds * 1000) : null;
        err.providerUsed = data?.providerUsed || null;
        throw err;
      }
      throw new Error(data?.error || `Request failed (${response.status})`);
    }
    if (data?.error) throw new Error(data.error);
    if (typeof data?.content !== "string" || !data.content.trim()) throw new Error("Empty AI response");
    return { content: data.content, providerUsed: data?.providerUsed || null };
  };

  const saveChatPair = async ({ conversationId, conversationTitle, message, response }) => {
    if (!token) return;

    try {
      const saveRes = await fetch("http://localhost:5000/api/chat/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId, conversationTitle, message, response }),
      });

      if (!saveRes.ok) {
        const saveData = await saveRes.json().catch(() => null);
        throw new Error(saveData?.message || `Save failed (${saveRes.status})`);
      }

      await fetchConversations();
    } catch (err) {
      console.error("Failed to save chat", err);
      if (user?.id) {
        try {
          const fallback = Array.isArray(conversations) ? conversations : [];
          const item = { conversationId, title: conversationTitle, lastMessage: message, updatedAt: new Date().toISOString() };
          const next = [item, ...fallback.filter((c) => c?.conversationId !== conversationId)].slice(0, 50);
          setConversations(next);
          localStorage.setItem(`chatConversations:${user.id}`, JSON.stringify(next));
        } catch {}
      }
    }
  };

  const requestAiTurn = async ({ userText, hiddenUserMessage, mergeIntoAiMessageId }) => {
    const userMessage = {
      text: userText,
      sender: "user",
      hidden: Boolean(hiddenUserMessage),
      id: crypto?.randomUUID ? crypto.randomUUID() : `u_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    };

    const before = Array.isArray(messagesRef.current) ? messagesRef.current : [];
    let withUser = [...before, userMessage];

    const streamTargetId =
      mergeIntoAiMessageId ||
      (crypto?.randomUUID ? crypto.randomUUID() : `ai_stream_${Date.now()}_${Math.random().toString(16).slice(2)}`);

    let streamAiMessage = null;
    if (!mergeIntoAiMessageId) {
      streamAiMessage = {
        text: "",
        sender: "ai",
        contextSkip: true,
        providerUsed: null,
        id: streamTargetId,
      };
      withUser = [...withUser, streamAiMessage];
    }

    messagesRef.current = withUser;
    setMessages(withUser);

    const controller = new AbortController();
    abortRef.current = controller;

    let aiText = null;
    let providerUsed = null;

    const appendDelta = (delta, meta) => {
      const d = String(delta || "");
      if (!d) return;
      const p = meta?.providerUsed || null;

      messagesRef.current = (Array.isArray(messagesRef.current) ? messagesRef.current : []).map((m) => {
        if (m?.id !== streamTargetId) return m;
        return { ...m, text: String(m?.text || "") + d, providerUsed: p || m?.providerUsed || null, contextSkip: true };
      });

      setMessages((prev) =>
        (Array.isArray(prev) ? prev : []).map((m) => {
          if (m?.id !== streamTargetId) return m;
          return { ...m, text: String(m?.text || "") + d, providerUsed: p || m?.providerUsed || null, contextSkip: true };
        })
      );
    };

    let announced = false;
    let noticeId = null;
    let tries = 0;
    while (true) {
      try {
        const out = await callChatApi(withUser, controller.signal, { onDelta: appendDelta });
        aiText = out?.content;
        providerUsed = out?.providerUsed || null;
        break;
      } catch (e) {
        const isRateLimited = String(e?.name || "") === "RateLimited";
        if (!isRateLimited) {
          const msg = String(e?.message || "");
          if (/timed out/i.test(msg)) {
            setResumeHint("continue (do not repeat; continue exactly where you stopped)");
            setMessages((prev) => [
              ...prev,
              {
                text:
                  "Ollama local model is slow and hit a timeout. Tip: keep prompts short, or change `.env.local` to a bigger model (e.g., `llama3.2:3b`) for better structure. You can also tap Resume to continue.",
                sender: "ai",
                id: crypto?.randomUUID ? crypto.randomUUID() : `ai_timeout_${Date.now()}_${Math.random().toString(16).slice(2)}`,
              },
            ]);
          }
          throw e;
        }

        tries += 1;
        const waitMs = Number.isFinite(e?.retryAfterMs) ? e.retryAfterMs : 25000;
        const cappedWaitMs = Math.min(waitMs, 20000);

        // If the provider is explicitly asking for a longer wait than our cap, pause instead of hammering 429s.
        if (waitMs > 20000) {
          const providerNote = e?.providerUsed ? ` (${e.providerUsed})` : "";
          const needS = Math.ceil(waitMs / 1000);
          setResumeHint("continue (do not repeat; continue exactly where you stopped)");
          setMessages((prev) => [
            ...prev,
            {
              text: `Rate limit${providerNote} requires ~${needS}s. Auto-wait is capped at 20s, so generation is paused. Tap Resume after ~${needS}s.`,
              sender: "ai",
              id: crypto?.randomUUID ? crypto.randomUUID() : `ai_rate_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            },
          ]);
          throw Object.assign(new Error("Aborted"), { name: "AbortError" });
        }

        if (tries > 6) {
          const providerNote = e?.providerUsed ? ` (${e.providerUsed})` : "";
          setResumeHint("continue (do not repeat; continue exactly where you stopped)");
          setMessages((prev) => [
            ...prev,
            {
              text: `Rate limit${providerNote} is happening repeatedly. Generation is paused to avoid looping. Tap Resume in a moment.`,
              sender: "ai",
              id: crypto?.randomUUID ? crypto.randomUUID() : `ai_rate_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            },
          ]);
          throw Object.assign(new Error("Aborted"), { name: "AbortError" });
        }

        const providerNote = e?.providerUsed ? ` (${e.providerUsed})` : "";
        const msg = `Rate limit hit${providerNote}. Waiting ${Math.ceil(cappedWaitMs / 1000)}s then retrying...`;
        if (!announced) {
          noticeId = crypto?.randomUUID ? crypto.randomUUID() : `ai_rate_${Date.now()}_${Math.random().toString(16).slice(2)}`;
          announced = true;
          setMessages((prev) => [...prev, { text: msg, sender: "ai", id: noticeId }]);
        } else if (noticeId) {
          setMessages((prev) => prev.map((m) => (m?.id === noticeId ? { ...m, text: msg } : m)));
        }

        await sleep(cappedWaitMs + 400, controller.signal);
        continue;
      }
    }

    const chunkMessage = {
      text: aiText,
      sender: "ai",
      hidden: true,
      chunk: true,
      providerUsed,
      id: crypto?.randomUUID ? crypto.randomUUID() : `ai_chunk_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    };

    let aiMessage = mergeIntoAiMessageId ? null : streamAiMessage;
    let withAi = withUser;

    if (mergeIntoAiMessageId) {
      const next = withUser.map((m) => {
        if (m?.id !== mergeIntoAiMessageId) return m;
        const prevText = String(m?.text || "");
        const joined = prevText ? mergeWithoutRepeating(prevText, aiText) : aiText;
        return { ...m, text: joined, contextSkip: true, providerUsed: providerUsed || m?.providerUsed || null };
      });
      withAi = [...next, chunkMessage];
      messagesRef.current = withAi;
      setMessages(withAi);
    } else {
      const next = withUser.map((m) => {
        if (m?.id !== streamTargetId) return m;
        return { ...m, text: String(aiText || ""), contextSkip: true, providerUsed: providerUsed || m?.providerUsed || null };
      });
      withAi = [...next, chunkMessage];
      messagesRef.current = withAi;
      setMessages(withAi);
    }

    const convId = activeConversationIdRef.current || (crypto?.randomUUID ? crypto.randomUUID() : `conv_${Date.now()}`);
    if (!activeConversationIdRef.current) {
      activeConversationIdRef.current = convId;
      setActiveConversationId(convId);
    }
    const convTitle = getConversationTitle(withAi);

    await saveChatPair({
      conversationId: convId,
      conversationTitle: convTitle,
      message: userMessage.text,
      response: aiText,
    });

    return { aiText, aiMessage };
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const firstText = input.trim();
    setInput("");
    setIsTyping(true);
    setIsAutoGenerating(false);

    try {
      const isLikelySrsRequest = (txt) => {
        const t = normalizeText(txt);
        if (!t) return false;
        return (
          t.includes("srs") ||
          t.includes("software requirements") ||
          t.includes("create srs") ||
          t.includes("generate") ||
          t.includes("final") ||
          t.includes("export") ||
          t.includes("complete srs") ||
          t.includes("proper srs") ||
          t.includes("fine detail") ||
          t.includes("full detail") ||
          t.includes("srs bana") ||
          t.includes("srs bna")
        );
      };

      const first = await requestAiTurn({ userText: firstText, hiddenUserMessage: false });

      const asksForContinue = (txt) => /autosrs will request continue/i.test(String(txt || ""));
      const looksLikeSrsFinalSectionsMissing = (txt) => {
        const t = String(txt || "");
        return (
          /(^|\n)7\.2\b/.test(t) === false ||
          /(^|\n)7\.3\b/.test(t) === false ||
          /```mermaid/i.test(t) === false
        );
      };
      const looksTruncated = (txt) => {
        const t = String(txt || "").trimEnd();
        if (!t) return false;
        if (/[A-Za-z0-9]\s*$/.test(t) === false) return false;
        // Common cutoff patterns: ends with a section number / heading stub / unfinished list
        if (/(^|\n)\s*\d+\.\s*$/.test(t)) return true;
        if (/(^|\n)\s*\d+\.\d+\s*$/.test(t)) return true;
        if (/(^|\n)\s*-\s*$/.test(t)) return true;
        if (t.endsWith("4.") || t.endsWith("5.") || t.endsWith("7.")) return true;
        return false;
      };
      const looksSrsComplete = (txt) => {
        const t = String(txt || "");
        const has72 = /(^|\n)7\.2\b/.test(t);
        const has73 = /(^|\n)7\.3\b/.test(t);
        const mermaids = (t.match(/```mermaid/gi) || []).length;
        return has72 && has73 && mermaids >= 2;
      };

      let marker = parseSrsPartMarker(first.aiText);
      let lastGoodMarker = marker;
      const shouldAuto =
        autoContinueParts &&
        (isLikelySrsRequest(firstText) || Boolean(marker) || asksForContinue(first.aiText) || looksTruncated(first.aiText));

      if (shouldAuto) {
        setIsAutoGenerating(true);
        let safety = 0;
        let consecutiveMarkerMisses = 0;
        const mergeIntoAiMessageId = first.aiMessage?.id || null;

        // Small pacing delay to reduce tokens/min bursts on rate-limited providers (e.g., Gemini).
        await sleep(1200);

        while (autoContinueParts && safety < 12) {
          const needsMore =
            marker
              ? marker.part < marker.total
              : lastGoodMarker
                ? lastGoodMarker.part < lastGoodMarker.total
                : asksForContinue(messagesRef.current?.[messagesRef.current.length - 1]?.text) ||
                  looksLikeSrsFinalSectionsMissing(messagesRef.current?.[messagesRef.current.length - 1]?.text) ||
                  looksTruncated(messagesRef.current?.[messagesRef.current.length - 1]?.text);

          if (!needsMore) break;

          const currentCombined = mergeIntoAiMessageId
            ? messagesRef.current?.find((m) => m?.id === mergeIntoAiMessageId)?.text
            : null;
          const tail = collapseSpaces(String(currentCombined || "").slice(-260));
          const tailHint = tail ? ` Start exactly after: "${tail.replace(/"/g, "'")}".` : "";

          const hint =
            marker || lastGoodMarker
              ? `continue (output SRS Part ${(marker || lastGoodMarker).part + 1}/${(marker || lastGoodMarker).total}). Do not repeat any already written text.${tailHint}`
              : `continue (do not repeat; continue exactly where you stopped; finish remaining SRS; include 7.2 and 7.3 mermaid diagrams).${tailHint}`;

          const next = await requestAiTurn({
            userText: hint,
            hiddenUserMessage: true,
            mergeIntoAiMessageId,
          });
          const nextMarker = parseSrsPartMarker(next.aiText);

          if (nextMarker) {
            marker = nextMarker;
            lastGoodMarker = nextMarker;
            consecutiveMarkerMisses = 0;
          } else {
            marker = null;
            consecutiveMarkerMisses += 1;
          }

          safety += 1;
          const currentAiText = String(messagesRef.current?.slice().reverse().find((m) => m?.sender === "ai")?.text || "");
          if (looksSrsComplete(currentAiText)) break;
          if (consecutiveMarkerMisses >= 3 && !asksForContinue(currentAiText) && !looksLikeSrsFinalSectionsMissing(currentAiText)) {
            break;
          }

          await sleep(1200);
        }

        // If the model stopped without explicit parts but diagrams/appendix seem missing, nudge once more.
        const lastAiText = String(messagesRef.current?.slice().reverse().find((m) => m?.sender === "ai")?.text || "");
        if (autoContinueParts && looksLikeSrsFinalSectionsMissing(lastAiText) && safety < 12) {
          await requestAiTurn({
            userText: "continue (finish remaining sections, and include 7.2 and 7.3 mermaid diagrams)",
            hiddenUserMessage: true,
            mergeIntoAiMessageId,
          });
        }
      }
    } catch (error) {
      if (String(error?.name || "").toLowerCase() === "aborterror") return;
      if (String(error?.message || "").toLowerCase().includes("aborted")) return;

      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: `Error: ${error?.message || "Connection failed. Please restart `npm run dev` and try again."}`,
          sender: "ai",
          id: crypto?.randomUUID ? crypto.randomUUID() : `ai_${Date.now()}`,
        },
      ]);
    } finally {
      abortRef.current = null;
      setIsAutoGenerating(false);
      setIsTyping(false);
    }
  };

  const loadConversation = async (conversationId) => {
    if (!token || !conversationId) return;
    try {
      setHistoryError("");
      const res = await fetch(`http://localhost:5000/api/chat/conversations/${encodeURIComponent(conversationId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Load failed (${res.status})`);
      }
      const data = await res.json();
      const chats = data?.data?.chats || [];
      const loaded = [];
      const aiChunks = [];
      for (const c of chats) {
        if (c?.message) {
          const msgText = String(c.message);
          const norm = normalizeText(msgText);
          const hidden =
            norm === "continue" ||
            norm === "next" ||
            norm.startsWith("continue ") ||
            norm.includes("next part") ||
            norm.includes("agla") ||
            norm.includes("aglay");
          loaded.push({ text: msgText, sender: "user", hidden, id: `${c.id}:u`, chatId: c.id });
        }
        if (c?.response) {
          const chunkText = String(c.response);
          aiChunks.push(chunkText);
          loaded.push({ text: chunkText, sender: "ai", hidden: true, chunk: true, id: `${c.id}:a`, chatId: c.id });
        }
      }

      if (aiChunks.length) {
        loaded.push({
          text: aiChunks.join("\n\n---\n\n"),
          sender: "ai",
          contextSkip: true,
          id: crypto?.randomUUID ? crypto.randomUUID() : `ai_combined_${Date.now()}`,
        });
      }

      const lastAi = loaded.slice().reverse().find((m) => m?.sender === "ai" && typeof m.text === "string" && m.text.trim());
      const resume = canResumeFromText(lastAi?.text || "");
      setResumeHint(resume.can ? resume.hint : "");
      setActiveConversationId(conversationId);
      setMessages(loaded);
      setExportOpen(false);
      setHistoryMenuOpenId(null);
      if (isMobile) setSidebarOpen(false);
    } catch (e) {
      console.error(e);
      setHistoryError(e?.message || "Failed to load conversation");
    }
  };

  const handleResume = async () => {
    if (!resumeHint || isTyping) return;
    setIsTyping(true);
    setIsAutoGenerating(true);
    try {
      await requestAiTurn({ userText: resumeHint, hiddenUserMessage: true });
    } catch (e) {
      if (String(e?.name || "").toLowerCase() === "aborterror") return;
      setMessages((prev) => [
        ...prev,
        { text: `Error: ${e?.message || "Failed to resume."}`, sender: "ai", id: crypto?.randomUUID ? crypto.randomUUID() : `ai_${Date.now()}` },
      ]);
    } finally {
      setIsAutoGenerating(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-900 text-white overflow-hidden font-sans">
      
      {/* Sidebar - ChatGPT Style */}
      <motion.aside 
        initial={{ width: 0 }}
        animate={{ width: isSidebarOpen ? 260 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-black/90 backdrop-blur-xl border-r border-white/10 flex flex-col overflow-hidden md:relative absolute z-50 h-full"
      >
        {/* Close Sidebar Button */}
        <div className="flex justify-between items-center p-3">
          <span className="text-sm font-medium text-gray-400 pl-3">Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition" title="Close Sidebar">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={handleNewProject}
            className="flex items-center gap-2 w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition text-sm"
            title="Start a fresh SRS conversation"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <div className="text-xs font-semibold text-gray-500 px-4 py-2">History</div>
          {historyLoading && (
            <div className="px-4 py-2 text-xs text-gray-500">Loading…</div>
          )}
          {!historyLoading && historyError && (
            <div className="px-4 py-2 text-xs text-red-400">{historyError}</div>
          )}
          {!historyLoading && !historyError && conversations.length === 0 && (
            <div className="px-4 py-2 text-xs text-gray-500">
              {token ? "No history yet." : "Login to save history."}
            </div>
          )}
          {conversations.map((item) => (
            <div key={item.conversationId} className="relative">
              <button
                onClick={() => loadConversation(item.conversationId)}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-white/5 rounded-lg text-sm transition overflow-hidden whitespace-nowrap pr-10"
                title={item.title}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </button>

              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                title="More"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHistoryMenuOpenId((prev) => (prev === item.conversationId ? null : item.conversationId));
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {historyMenuOpenId === item.conversationId && (
                <div className="absolute right-2 top-12 w-44 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-lg z-50">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteConversation(item.conversationId);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/10 transition flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {user && (
          <div className="p-4 border-t border-white/10 space-y-2">
            <button className="flex items-center gap-3 w-full px-2 py-2 hover:bg-white/5 rounded-lg transition">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm text-left">
                <div className="font-medium">{user?.username || 'User'}</div>
                <div className="text-xs text-gray-400">Free Plan</div>
              </div>
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-2 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </motion.aside>

      {/* Collapsed Sidebar Strip (Thin Line) */}
      {!isSidebarOpen && !isMobile && (
        <div 
          className="w-3 h-full bg-transparent border-r border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors z-40 group"
          onClick={() => setSidebarOpen(true)}
          title="Open Sidebar"
        >
            <div className="w-[1px] h-full bg-white/10 group-hover:bg-blue-500/50 transition-colors"></div>
            <ChevronRight className="w-4 h-4 text-gray-400 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      <main className="flex-1 flex flex-col relative">
        {isSidebarOpen && isMobile && <div className="absolute inset-0 bg-black/50 z-10" onClick={() => setSidebarOpen(false)}></div>}

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {messages.filter((m) => !m?.hidden).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">What project are we building today?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                <CardExample text="Create an SRS for a Food Delivery App." onClick={() => setInput("Create an SRS for a Food Delivery App.")} />
                <CardExample text="Build requirements for an IoT System." onClick={() => setInput("Build requirements for an IoT System.")} />
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              {messages.filter((m) => !m?.hidden).map((message) => (
                <motion.div 
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${message.sender === 'user' ? 'justify-start' : ''}`}
                >
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {message.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">AI</span>
                    </div>
                  )}
                  <div className={`px-4 py-2 rounded-2xl max-w-[95%] md:max-w-[88%] ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 rounded-tl-sm' 
                      : 'bg-white/5 rounded-tl-sm'
                  }`}>
                    {message.sender === "ai" ? (
                      <div>
                        {renderMarkdownLite(message.text)}
                        {message?.providerUsed ? (
                          <div className="mt-2 text-[10px] text-gray-400">Provider: {message.providerUsed}</div>
                        ) : null}
                      </div>
                    ) : (
                      message.text
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">AI</span>
                  </div>
                  <div className="bg-white/5 px-4 py-2 rounded-2xl rounded-tl-sm">
                    <div className="flex space-x-1">
                      <motion.div 
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-blue-500 transition">
              <div className="flex items-center gap-2 pb-1">
                <div className="relative">
                  <button
                    className="shrink-0 w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed text-gray-200"
                    title="Export SRS"
                    onClick={() => setExportOpen((v) => !v)}
                    disabled={!messages.some((m) => m?.sender === "ai" && typeof m.text === "string" && m.text.trim())}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {exportOpen && (
                    <div className="absolute left-0 bottom-12 w-48 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-lg z-50">
                      <button
                        onClick={handleExportPdf}
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={handleExportMarkdown}
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
                      >
                        Download Markdown
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  title={autoContinueParts ? "Auto-continue parts: ON" : "Auto-continue parts: OFF"}
                  onClick={() => setAutoContinueParts((v) => !v)}
                  className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border transition text-xs font-semibold ${
                    autoContinueParts
                      ? "bg-emerald-600/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-600/30"
                      : "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10"
                  }`}
                >
                  Auto
                </button>

                {resumeHint && !isTyping && (
                  <button
                    type="button"
                    title="Resume SRS generation"
                    onClick={handleResume}
                    className="shrink-0 h-10 px-3 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 transition text-xs font-semibold"
                  >
                    Resume
                  </button>
                )}
              </div>
              <textarea
                className="flex-1 bg-transparent focus:outline-none resize-none text-gray-200 placeholder:text-gray-500 min-h-[44px] max-h-40 py-2"
                placeholder="Message AutoSRS.ai..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              {isTyping ? (
                <motion.button
                  type="button"
                  className="shrink-0 w-14 h-10 flex items-center justify-center bg-red-600 rounded-xl hover:bg-red-700 transition"
                  onClick={() => stopGenerating("Generation stopped. Type 'continue' to resume.")}
                  title={isAutoGenerating ? "Stop auto-generation" : "Stop"}
                >
                  Stop
                </motion.button>
              ) : (
                <motion.button
                  className="shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!input.trim()}
                  onClick={handleSend}
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper component
function CardExample({ text, onClick }) {
  return (
    <button 
      className="p-4 text-sm text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition"
      onClick={onClick}
    >
      {text}
    </button>
  );
}

export default GeneratorPage;
