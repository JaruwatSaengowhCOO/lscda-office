import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

const REF_DOC_DIR = path.resolve(process.cwd(), "ref-doc");

const MANUALS = {
  da: {
    key: "da",
    title: "District Attorney Manual",
    dir: "DistrictAttorneyManual",
    file: "LosSantosCountyDistrictAttorneysManual.html",
    imagePrefix: "da",
  },
  investigator: {
    key: "investigator",
    title: "DA Investigator Manual",
    dir: "DAInvestigatorManual",
    file: "LosSantosCountyDistrictAttorneysManual.html",
    imagePrefix: "investigator",
  },
} as const;

export type ManualKey = keyof typeof MANUALS;

export interface TocItem {
  id: string;
  level: number;
  text: string;
}

function slugify(text: string, index: number): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0E00-\u0E7F-]/g, "")
    .slice(0, 60);
  return base || `heading-${index}`;
}

function processHtml(raw: string, imagePrefix: string): { html: string; toc: TocItem[] } {
  // Extract body only
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let html = bodyMatch ? bodyMatch[1] : raw;

  // Fix image paths → /uploads/ref-doc-images/<prefix>-imageX.png
  html = html.replace(
    /src="images\/([^"]+)"/g,
    `src="/uploads/ref-doc-images/${imagePrefix}-$1"`
  );

  // Unwrap fixed-size overflow:hidden spans around images → clean <img>
  html = html.replace(
    /<span\s[^>]*style="[^"]*overflow:\s*hidden[^"]*"[^>]*>\s*<img([^>]+)>\s*<\/span>/gi,
    (_, imgAttrs) => {
      const srcMatch = imgAttrs.match(/src="([^"]+)"/);
      const src = srcMatch ? srcMatch[1] : "";
      return `<img src="${src}" alt="" />`;
    }
  );

  // Strip all class and style attributes, but keep id
  html = html.replace(/\s+class="[^"]*"/g, "");
  html = html.replace(/\s+style="[^"]*"/g, "");

  // Remove empty / whitespace-only paragraphs and spans
  html = html.replace(/<p>\s*<\/p>/g, "");
  html = html.replace(/<p>\s*<span>\s*<\/span>\s*<\/p>/g, "");
  html = html.replace(/<p>\s*(&nbsp;|\s)+\s*<\/p>/g, "");
  html = html.replace(/<span>\s*<\/span>/g, "");

  // Flatten single-child spans: <p><span>text</span></p> → <p>text</p>
  html = html.replace(/<p>\s*<span>([\s\S]*?)<\/span>\s*<\/p>/g, "<p>$1</p>");

  // Collapse whitespace inside paragraphs (Google Docs splits text with newlines)
  html = html.replace(/<p>([\s\S]*?)<\/p>/g, (_, inner) => {
    const collapsed = inner.replace(/\s+/g, " ").trim();
    return collapsed ? `<p>${collapsed}</p>` : "";
  });

  // Collapse whitespace inside headings and strip inner tags for clean text
  html = html.replace(/<(h[2-4])([^>]*)>([\s\S]*?)<\/\1>/gi, (_, tag, attrs, inner) => {
    const collapsed = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    return `<${tag}${attrs}>${collapsed}</${tag}>`;
  });

  // Collapse whitespace inside td/th cells
  html = html.replace(/<td>([\s\S]*?)<\/td>/g, (_, inner) => {
    const collapsed = inner.replace(/\s+/g, " ").trim();
    return `<td>${collapsed}</td>`;
  });

  // Clean up &nbsp;
  html = html.replace(/&nbsp;/g, " ");

  // Trim multiple blank lines
  html = html.replace(/(\n\s*){3,}/g, "\n\n");

  // ── Extract TOC & assign stable IDs ──────────────────────────
  const toc: TocItem[] = [];
  let hIdx = 0;
  html = html.replace(/<(h[2-4])([^>]*)>([\s\S]*?)<\/\1>/gi, (_, tag, attrs, inner) => {
    const level = parseInt(tag[1], 10);
    const text = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!text) return ""; // drop empty headings

    const existingId = (attrs as string).match(/id="([^"]+)"/)?.[1];
    const id = existingId || slugify(text, hIdx++);

    const newAttrs = existingId ? attrs : ` id="${id}"`;
    toc.push({ id, level, text });
    return `<${tag}${newAttrs}>${inner}</${tag}>`;
  });

  return { html, toc };
}

export const manualsRouter = router({
  getManual: protectedProcedure
    .input(z.object({ key: z.enum(["da", "investigator"]) }))
    .query(async ({ input }) => {
      const manual = MANUALS[input.key];
      const filePath = path.join(REF_DOC_DIR, manual.dir, manual.file);

      let raw: string;
      try {
        raw = await fs.readFile(filePath, "utf-8");
      } catch {
        throw new TRPCError({ code: "NOT_FOUND", message: `Manual "${manual.title}" not found` });
      }

      const { html, toc } = processHtml(raw, manual.imagePrefix);
      return { html, toc, title: manual.title, key: manual.key };
    }),

  listManuals: protectedProcedure.query(() => {
    return Object.values(MANUALS).map(({ key, title }) => ({ key, title }));
  }),
});
