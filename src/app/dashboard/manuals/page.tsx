'use client';

import InternalLayout from "@/components/InternalLayout";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookMarked, ChevronDown, Search, X,
  AlignLeft, ChevronUp, BookOpen, Scale, ShieldCheck, Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";

import daData from "./da-manual-data.json";
import investigatorData from "./investigator-manual-data.json";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Section {
  heading: string;
  paragraphs: string[];
}

interface TableCell {
  text: string;
  colspan: number;
  isHeader: boolean;
  image: string | null;
}

interface TableGroupRow { type: "group"; label: string; }
interface TableDataRow  { type: "row";   cells: TableCell[]; }
type TableRow = TableGroupRow | TableDataRow;

interface ManualTable {
  afterSection: string | null;
  data: TableRow[];
}

interface Chapter {
  heading: string;
  paragraphs: string[];
  sections: Section[];
  tables: ManualTable[];
}

interface ManualData {
  key: string;
  chapters: Chapter[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0E00-\u0E7F-]/g, "");
}

type ManualKey = "da" | "investigator";

const MANUALS: Record<ManualKey, { label: string; icon: React.ReactNode; data: ManualData }> = {
  da:           { label: "DA Manual",           icon: <Scale       className="w-3.5 h-3.5" />, data: daData           as ManualData },
  investigator: { label: "Investigator Manual", icon: <ShieldCheck className="w-3.5 h-3.5" />, data: investigatorData as ManualData },
};

// ─── Paragraph / bullet block ─────────────────────────────────────────────────
function ParagraphBlock({ text }: { text: string }) {
  if (text.includes("\n• ")) {
    const lines   = text.split("\n").map(l => l.trim()).filter(Boolean);
    const intro   = lines[0].startsWith("•") ? null : lines[0];
    const bullets = lines.filter(l => l.startsWith("• ")).map(l => l.slice(2));
    return (
      <div className="mb-3">
        {intro && <p className="mb-1.5 text-foreground/90 leading-relaxed">{intro}</p>}
        <ul className="list-none space-y-1 ml-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-foreground/85 leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return <p className="mb-3 text-foreground/90 leading-relaxed">{text}</p>;
}

// ─── Table component ──────────────────────────────────────────────────────────
function ManualTableView({ table }: { table: ManualTable }) {
  return (
    <div className="my-6 rounded-lg border border-border overflow-hidden text-sm">
      <table className="w-full border-collapse">
        <tbody>
          {table.data.map((row, i) => {
            if (row.type === "group") {
              return (
                <tr key={i}>
                  <td colSpan={99} className="px-4 py-2 bg-muted font-semibold text-foreground text-xs uppercase tracking-wide border-b border-border">
                    {row.label}
                  </td>
                </tr>
              );
            }
            return (
              <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                {row.cells.map((cell, ci) => (
                  <td key={ci} colSpan={cell.colspan} className="px-4 py-2.5 align-middle">
                    {cell.image ? (
                      <div className="flex flex-col items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cell.image} alt={cell.text} className="max-h-48 w-auto rounded-md border border-border object-contain" />
                        {cell.text && <span className="text-xs text-muted-foreground">{cell.text}</span>}
                      </div>
                    ) : (
                      <span className={ci === 0 ? "font-medium text-foreground" : "text-muted-foreground"}>{cell.text}</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Chapter component ────────────────────────────────────────────────────────
function ChapterView({ chapter, chIndex }: { chapter: Chapter; chIndex: number }) {
  const chapterId     = slugify(chapter.heading);
  const chapterTables = chapter.tables.filter(t => t.afterSection === null);

  return (
    <section id={chapterId} className="scroll-mt-20">
      <div className="flex items-baseline gap-3 mb-5 pb-3 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground/60 shrink-0 tabular-nums">
          {String(chIndex + 1).padStart(2, "0")}
        </span>
        <h2 className="text-xl font-bold text-foreground tracking-tight">{chapter.heading}</h2>
      </div>

      {chapter.paragraphs.length > 0 && (
        <div className="mb-6 text-[15px]">
          {chapter.paragraphs.map((p, i) => <ParagraphBlock key={i} text={p} />)}
        </div>
      )}

      {chapterTables.map((t, i) => <ManualTableView key={i} table={t} />)}

      {chapter.sections.length > 0 && (
        <div className="space-y-6">
          {chapter.sections.map((sec) => {
            const secId     = `${chapterId}--${slugify(sec.heading)}`;
            const secTables = chapter.tables.filter(t => t.afterSection === sec.heading);
            return (
              <div key={sec.heading} id={secId} className="scroll-mt-20">
                <h3 className="text-[0.95rem] font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary/50 shrink-0" />
                  {sec.heading}
                </h3>
                <div className="pl-3 border-l border-border/50 text-[14.5px]">
                  {sec.paragraphs.map((p, i) => <ParagraphBlock key={i} text={p} />)}
                  {secTables.map((t, i) => <ManualTableView key={i} table={t} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Manuals() {
  return (
    <InternalLayout>
      <ManualReader />
    </InternalLayout>
  );
}

function ManualReader() {
  const [activeManual,    setActiveManual]    = useState<ManualKey>("da");
  const [search,          setSearch]          = useState("");
  const [activeId,        setActiveId]        = useState("");
  const [tocOpen,         setTocOpen]         = useState(true);
  const [showScrollTop,   setShowScrollTop]   = useState(false);
  const [readProgress,    setReadProgress]    = useState(0);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // contentAnchorRef — attaches to the content wrapper div so we can query headings
  const contentAnchorRef = useRef<HTMLDivElement>(null);
  // scrollEl — the actual scrollable container (InternalLayout's <main>)
  const scrollEl = useRef<HTMLElement | null>(null);

  // Find the scrollable parent once on mount
  useEffect(() => {
    let el = contentAnchorRef.current?.parentElement ?? null;
    while (el) {
      const ov = window.getComputedStyle(el).overflowY;
      if (ov === "auto" || ov === "scroll") { scrollEl.current = el; break; }
      el = el.parentElement;
    }
  }, []);

  const manual   = MANUALS[activeManual];
  const chapters = manual.data.chapters as Chapter[];

  const toc = useMemo(() => {
    const items: { id: string; level: 2 | 3; text: string }[] = [];
    chapters.forEach(ch => {
      const chId = slugify(ch.heading);
      items.push({ id: chId, level: 2, text: ch.heading });
      ch.sections.forEach(sec =>
        items.push({ id: `${chId}--${slugify(sec.heading)}`, level: 3, text: sec.heading })
      );
    });
    return items;
  }, [chapters]);

  // Reset on manual switch
  useEffect(() => {
    setActiveId("");
    setReadProgress(0);
    setSearch("");
    setExpandedChapters(new Set());
    scrollEl.current?.scrollTo({ top: 0 });
  }, [activeManual]);

  // IntersectionObserver — uses window as root when scrollEl isn't available yet
  useEffect(() => {
    const anchor = contentAnchorRef.current;
    if (!anchor) return;
    const root = scrollEl.current ?? null;
    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) { if (e.isIntersecting) { setActiveId(e.target.id); break; } }
      },
      { root, rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    toc.forEach(({ id }) => {
      const el = anchor.querySelector(`#${CSS.escape(id)}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc, activeManual]);

  // Scroll progress
  useEffect(() => {
    const el = scrollEl.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollTop(el.scrollTop > 300);
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setReadProgress(Math.round(Math.min(pct * 100, 100)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-expand active chapter
  useEffect(() => {
    if (!activeId) return;
    const chId = activeId.includes("--") ? activeId.split("--")[0] : activeId;
    setExpandedChapters(prev => prev.has(chId) ? prev : new Set([...prev, chId]));
  }, [activeId]);

  const scrollToTop = () => scrollEl.current?.scrollTo({ top: 0, behavior: "smooth" });

  const scrollTo = useCallback((id: string) => {
    const container = scrollEl.current;
    const el        = contentAnchorRef.current?.querySelector(`#${CSS.escape(id)}`);
    if (!container || !el) return;
    const offset = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 80;
    container.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    setActiveId(id);
  }, []);

  const filteredToc = toc.filter(h => h.text.toLowerCase().includes(search.toLowerCase()));

  const currentChapter = useMemo(() => {
    const idx = toc.findIndex(h => h.id === activeId);
    if (idx === -1) return undefined;
    for (let i = idx; i >= 0; i--) { if (toc[i].level === 2) return toc[i]; }
  }, [toc, activeId]);

  return (
    <>
      {/* ── Fixed TOC sidebar ────────────────────────────────── */}
      {tocOpen && (
        <div className="hidden lg:flex fixed top-14 left-60 bottom-0 w-72 flex-col border-r border-border bg-sidebar z-20">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-sidebar-border shrink-0">
            <BookMarked className="w-4 h-4 text-sidebar-primary shrink-0" />
            <span className="font-semibold text-sm text-sidebar-foreground truncate flex-1">Table of Contents</span>
            <button onClick={() => setTocOpen(false)} className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-sidebar-border shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/40" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาหัวข้อ..."
                className="pl-8 h-8 text-xs bg-sidebar-accent/50 border-sidebar-border focus-visible:ring-1" />
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto">
            <nav className="py-1.5 px-2">
              {search ? (
                filteredToc.length > 0 ? filteredToc.map(item => (
                  <button key={item.id} onClick={() => scrollTo(item.id)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-2 mb-0.5 text-xs",
                      item.level === 2 ? "font-semibold" : "ml-3 font-normal",
                      item.id === activeId ? "bg-sidebar-primary/15 text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    )}>
                    {item.level === 3 && <span className="w-1 h-1 rounded-full bg-current opacity-50 shrink-0" />}
                    <span className="leading-snug">{item.text}</span>
                  </button>
                )) : (
                  <div className="text-center py-8 px-4">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-sidebar-foreground/20" />
                    <p className="text-xs text-sidebar-foreground/40">ไม่พบหัวข้อที่ค้นหา</p>
                  </div>
                )
              ) : chapters.map((ch, i) => {
                const chId       = slugify(ch.heading);
                const isExpanded = expandedChapters.has(chId);
                const isChActive = activeId === chId || activeId.startsWith(chId + "--");
                return (
                  <div key={chId} className="mb-0.5">
                    <button
                      onClick={() => {
                        setExpandedChapters(prev => { const n = new Set(prev); n.has(chId) ? n.delete(chId) : n.add(chId); return n; });
                        scrollTo(chId);
                      }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center gap-2 text-xs font-medium",
                        isChActive ? "bg-sidebar-primary/15 text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                      )}>
                      <span className={cn("shrink-0 w-5 h-5 rounded text-[10px] font-bold tabular-nums flex items-center justify-center",
                        isChActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-sidebar-accent/80 text-sidebar-foreground/50")}>
                        {i + 1}
                      </span>
                      <span className="flex-1 leading-snug text-left">{ch.heading}</span>
                      {ch.sections.length > 0 && (
                        <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform duration-200 text-sidebar-foreground/30", isExpanded && "rotate-180")} />
                      )}
                    </button>
                    {isExpanded && ch.sections.length > 0 && (
                      <div className="ml-4 mt-0.5 mb-1 pl-3 border-l-2 border-sidebar-border space-y-0.5">
                        {ch.sections.map(sec => {
                          const secId = `${chId}--${slugify(sec.heading)}`;
                          const isSecActive = activeId === secId;
                          return (
                            <button key={secId} onClick={() => scrollTo(secId)}
                              className={cn("w-full text-left px-2 py-1 rounded-md transition-colors text-xs leading-snug",
                                isSecActive ? "text-sidebar-primary font-medium" : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60")}>
                              {sec.heading}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-sidebar-border shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs text-sidebar-foreground/40 mb-1">
              <span>อ่านแล้ว</span><span>{readProgress}%</span>
            </div>
            <div className="w-full h-1 bg-sidebar-accent rounded-full overflow-hidden">
              <div className="h-full bg-sidebar-primary transition-all duration-300 rounded-full" style={{ width: `${readProgress}%` }} />
            </div>
            <p className="text-xs text-sidebar-foreground/35 mt-1">{chapters.length} chapters · {toc.length} sections</p>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────── */}
      <div className={cn("transition-all duration-300", tocOpen && "lg:pl-72")}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
          <button onClick={() => setTocOpen(v => !v)} className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0">
            <AlignLeft className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-1 shrink-0">
            {(Object.entries(MANUALS) as [ManualKey, typeof MANUALS[ManualKey]][]).map(([key, m]) => (
              <button key={key} onClick={() => setActiveManual(key)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  activeManual === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                {m.icon}
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>

          {currentChapter && (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-border">·</span>
              <Badge variant="secondary" className="text-xs font-normal truncate max-w-xs hidden sm:flex">{currentChapter.text}</Badge>
            </div>
          )}

          {readProgress > 0 && (
            <div className="hidden sm:flex items-center gap-2 shrink-0 ml-auto">
              <span className="text-xs text-muted-foreground">{readProgress}%</span>
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${readProgress}%` }} />
              </div>
            </div>
          )}

          <Button variant="ghost" size="sm"
            className="shrink-0 text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground ml-auto sm:ml-0"
            onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </Button>
        </div>

        {/* Content */}
        <div ref={contentAnchorRef}>
          <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 space-y-14">
            {chapters.map((ch, i) => <ChapterView key={ch.heading} chapter={ch} chIndex={i} />)}
          </div>
          <div className="h-20" />
        </div>
      </div>

      {showScrollTop && (
        <button onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105">
          <ChevronUp className="w-4 h-4" />
        </button>
      )}
    </>
  );
}
