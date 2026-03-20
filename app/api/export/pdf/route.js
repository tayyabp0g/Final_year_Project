import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const KROKI_BASE_URL = (process.env.KROKI_BASE_URL || "https://kroki.io").replace(/\/$/, "");

function normalizeMarkdown(markdown) {
  let text = String(markdown ?? "");
  text = text.replace(/\r\n/g, "\n");
  return text;
}

function parseHeadingLine(line) {
  const md = line.match(/^(#{1,6})\s+(.*)$/);
  if (md) return { level: md[1].length, text: md[2].trim() };

  // Support IEEE-style numeric headings: "1. Intro", "1.1 Purpose", etc.
  const num = line.match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
  if (num) {
    const dots = (num[1].match(/\./g) || []).length;
    const level = Math.min(3, dots + 1); // 1, 2, 3
    return { level, text: `${num[1]} ${num[2].trim()}` };
  }

  return null;
}

async function renderMermaidPng(mermaidCode) {
  const res = await fetch(`${KROKI_BASE_URL}/mermaid/png`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: mermaidCode,
  });
  if (!res.ok) throw new Error(`Diagram render failed (${res.status})`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

function wrapTextToLines(text, font, fontSize, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  const width = (s) => font.widthOfTextAtSize(s, fontSize);

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (width(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);

    // If a single word is too long, hard-split it.
    if (width(word) > maxWidth) {
      let chunk = "";
      for (const ch of word) {
        const next = chunk + ch;
        if (width(next) <= maxWidth) {
          chunk = next;
        } else {
          if (chunk) lines.push(chunk);
          chunk = ch;
        }
      }
      current = chunk;
    } else {
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const markdown = body?.markdown;
    const filename = typeof body?.filename === "string" && body.filename.trim() ? body.filename.trim() : "SRS.pdf";

    if (typeof markdown !== "string" || !markdown.trim()) {
      return NextResponse.json({ error: "Missing 'markdown' content." }, { status: 400 });
    }

    const md = normalizeMarkdown(markdown);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle("Software Requirements Specification");

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

    const fontSizeBody = 11;
    const lineHeightBody = 14;

    const pageWidth = 595.28; // A4
    const pageHeight = 841.89; // A4
    const margin = 50;
    const maxWidth = pageWidth - margin * 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const lines = md.split("\n");
    let inCode = false;
    let codeLang = "";
    let codeLines = [];

    const ensureSpace = (needed) => {
      if (y - needed >= margin) return;
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    };

    const drawParagraph = (text, { font = fontRegular, size = fontSizeBody, indent = 0, spacingAfter = 6 } = {}) => {
      const wrapped = text ? wrapTextToLines(text, font, size, maxWidth - indent) : [""];
      const lh = Math.max(lineHeightBody, size + 3);
      for (const l of wrapped) {
        ensureSpace(lh);
        page.drawText(l, { x: margin + indent, y: y - size, size, font });
        y -= lh;
      }
      y -= spacingAfter;
    };

    const drawHeading = (h) => {
      const level = h.level;
      const size = level === 1 ? 20 : level === 2 ? 15 : 12;
      ensureSpace(size + 18);
      drawParagraph(h.text, { font: fontBold, size, indent: 0, spacingAfter: 10 });
    };

    const drawCodeBlock = (code, { isMermaid } = {}) => {
      const size = 9;
      const lh = 12;
      const padding = 10;
      const indent = 0;
      const effectiveWidth = maxWidth - indent;

      const codeText = code.replace(/\t/g, "  ").replace(/\r\n/g, "\n");
      const rawLines = codeText.split("\n");
      const wrappedLines = [];
      for (const rl of rawLines) {
        const w = wrapTextToLines(rl || " ", fontMono, size, effectiveWidth - padding * 2);
        wrappedLines.push(...w);
      }

      // optional label
      if (isMermaid) drawParagraph("Diagram (Mermaid):", { font: fontBold, size: 11, spacingAfter: 4 });

      for (const l of wrappedLines) {
        ensureSpace(lh + padding);
        // background
        page.drawRectangle({
          x: margin + indent,
          y: y - (lh + padding),
          width: effectiveWidth,
          height: lh + padding,
          color: rgb(0.1, 0.1, 0.1),
          opacity: 0.08,
        });
        page.drawText(l, { x: margin + indent + padding, y: y - size - 6, size, font: fontMono });
        y -= lh + 2;
      }
      y -= 10;
    };

    const drawMermaidDiagram = async (mermaidCode) => {
      try {
        const png = await renderMermaidPng(mermaidCode);
        const img = await pdfDoc.embedPng(png);
        const dims = img.scale(1);
        const scale = Math.min(1, maxWidth / dims.width);
        const w = dims.width * scale;
        const h = dims.height * scale;

        ensureSpace(h + 18);
        page.drawText("Diagram:", { x: margin, y: y - 12, size: 11, font: fontBold });
        y -= 18;
        ensureSpace(h + 10);
        page.drawImage(img, { x: margin, y: y - h, width: w, height: h });
        y -= h + 12;
      } catch {
        drawCodeBlock(mermaidCode, { isMermaid: true });
      }
    };

    for (const raw of lines) {
      const line = raw.replace(/\s+$/g, "");

      const fence = line.match(/^```(\w+)?\s*$/);
      if (fence) {
        if (!inCode) {
          inCode = true;
          codeLang = (fence[1] || "").toLowerCase();
          codeLines = [];
        } else {
          const code = codeLines.join("\n");
          if (codeLang === "mermaid") {
            // Render into an image when possible
            // eslint-disable-next-line no-await-in-loop
            await drawMermaidDiagram(code);
          } else {
            drawCodeBlock(code, { isMermaid: false });
          }
          inCode = false;
          codeLang = "";
          codeLines = [];
        }
        continue;
      }

      if (inCode) {
        codeLines.push(raw);
        continue;
      }

      const heading = parseHeadingLine(line.trim());
      if (heading) {
        drawHeading(heading);
        continue;
      }

      const bullet = line.match(/^(\s*)([-*+]|\u2022)\s+(.+)$/);
      if (bullet) {
        const indent = Math.min(60, bullet[1].length * 6);
        drawParagraph(`• ${bullet[3].trim()}`, { indent });
        continue;
      }

      const numbered = line.match(/^\s*(\d+)\.\s+(.+)$/);
      if (numbered) {
        drawParagraph(`${numbered[1]}. ${numbered[2].trim()}`, { indent: 0 });
        continue;
      }

      if (!line.trim()) {
        y -= 10;
        continue;
      }

      drawParagraph(line.trim(), { font: fontRegular, size: fontSizeBody });
    }

    const bytes = await pdfDoc.save();
    const buf = Buffer.from(bytes);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${filename.replace(/\"/g, "")}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "PDF export failed." }, { status: 500 });
  }
}
