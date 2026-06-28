'use client';

import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Scale, Shield, Users, FileText, Phone,
  AlertTriangle, ChevronRight, BookOpen, Search, Gavel,
  CheckCircle, Building2, Eye, Heart,
} from "lucide-react";
import { format } from "date-fns";

const stats = [
  { label: "คดีที่ดำเนินการแล้ว", value: "12,400+", icon: Scale },
  { label: "อัตราชนะคดี", value: "87%", icon: Shield },
  { label: "เจ้าหน้าที่และอัยการ", value: "240+", icon: Users },
  { label: "ปีแห่งการให้บริการ", value: "50+", icon: BookOpen },
];

const services = [
  { icon: AlertTriangle, label: "แจ้งเบาะแส", desc: "รายงานเบาะแสอาชญากรรมโดยไม่เปิดเผยตัวตน", href: "/services/tip", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
  { icon: FileText, label: "ยื่นคำร้อง", desc: "ขอเอกสาร ข้อมูลคดี หรือบริการอื่น ๆ", href: "/services/request", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { icon: Scale, label: "ตรวจสอบสถานะคดี", desc: "ค้นหาสถานะคดีสาธารณะด้วยหมายเลขคดี", href: "/services/case-status", color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
  { icon: BookOpen, label: "ดาวน์โหลดเอกสาร", desc: "แบบฟอร์มและเอกสารสาธารณะของสำนักงาน", href: "/services/documents", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
];

const bureaus = [
  { name: "Bureau of Central Trials", desc: "ดำเนินคดีอาญาหลักในศาล ตั้งแต่ Arraignment ถึงการพิพากษา", type: "Line Operations" },
  { name: "Bureau of Pre-Filing Diversion", desc: "โครงการเบี่ยงเบนคดีก่อนฟ้อง มุ่งฟื้นฟูผู้กระทำผิดรายแรก", type: "Line Operations" },
  { name: "Special Prosecutions Bureau", desc: "ดำเนินคดีพิเศษ — ทุจริต อาชญากรรมองค์กร คดีซับซ้อนสูง", type: "Special" },
  { name: "Justice System Integrity Division", desc: "สืบสวนคดีเบิกความเท็จ (Perjury) และทุจริตในกระบวนการยุติธรรม", type: "JSID" },
  { name: "Gang Injunction Division", desc: "จัดการคดีและคำสั่งห้ามที่เกี่ยวข้องกับแก๊งอาชญากรรม", type: "Special" },
  { name: "Bureau of Investigation", desc: "DA Investigators มีสถานะ Peace Officer สืบสวนอิสระเพื่อสนับสนุนคดี", type: "Investigation" },
];

const processSteps = [
  { n: "01", icon: Search,       title: "สืบสวน",          desc: "DA Investigators รวบรวมหลักฐาน สัมภาษณ์พยาน ประสานงาน LSPD/LSSD/SAHP" },
  { n: "02", icon: FileText,     title: "ทบทวนคดี",        desc: "อัยการตรวจสอบหลักฐาน ตัดสินใจฟ้องหรือเบี่ยงเบนคดีตามข้อเท็จจริง" },
  { n: "03", icon: Gavel,        title: "Arraignment",     desc: "อ่านข้อกล่าวหาต่อจำเลยอย่างเป็นทางการ จำเลยมีสิทธิ์ทนายความ" },
  { n: "04", icon: Scale,        title: "Plea / Motions",  desc: "เจรจาข้อตกลง หรือดำเนิน Motion Hearings เพื่อคัดกรองพยานหลักฐาน" },
  { n: "05", icon: Building2,    title: "Trial",           desc: "พิจารณาคดีในศาล นำเสนอหลักฐาน ซักถามพยาน โต้เถียงข้อกฎหมาย" },
  { n: "06", icon: CheckCircle,  title: "Sentencing",      desc: "กำหนดโทษที่เหมาะสม ผู้เสียหายมีสิทธิ์ยื่น Victim Impact Statement" },
];

const values = [
  { icon: Scale,  title: "Justice",      desc: "แสวงหาความยุติธรรม ไม่ใช่เพียงแค่ชนะคดี" },
  { icon: Shield, title: "Integrity",    desc: "จริยธรรมวิชาชีพสูงสุด โปร่งใส ตรวจสอบได้" },
  { icon: Eye,    title: "Impartiality", desc: "ปราศจากอคติ เคารพสิทธิ์ทุกฝ่ายในกระบวนการ" },
  { icon: Heart,  title: "Compassion",   desc: "ปฏิบัติต่อผู้เสียหายด้วยความเคารพและเห็นใจ" },
];

export default function Home() {
  const { data: pressReleases } = trpc.open.pressReleases.useQuery();
  const { data: notices } = trpc.open.notices.useQuery();
  const latestNews = pressReleases?.slice(0, 3) ?? [];
  const latestNotices = notices?.slice(0, 2) ?? [];

  return (
    <PublicLayout>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative bg-navy-gradient text-white overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)" }} />
        <div className="container relative py-24 md:py-36">
          <div className="max-w-3xl">
            <Badge className="mb-5 bg-accent/20 text-accent border-accent/30 font-medium tracking-wide">
              Los Santos County — San Andreas
            </Badge>
            <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-5">
              District<br />
              <span className="text-gold-gradient">Attorney's</span><br />
              Office
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-3 max-w-2xl">
              สำนักงานอัยการเขตลอสแซนโตสเคาน์ตี้ดำเนินคดีอาญาทุกระดับ
              ปกป้องสิทธิ์ผู้เสียหาย และรักษาความยุติธรรมให้แก่ประชาชนทุกคนในเขต
              ด้วยความซื่อสัตย์และความเที่ยงธรรม
            </p>
            <blockquote className="text-sm text-white/45 italic mb-8 max-w-xl border-l-2 border-accent/40 pl-4">
              "The duty of the prosecutor is to seek justice, not merely to convict."
              <span className="block mt-1 not-italic text-white/30 text-xs">— DA Office Closing Statement</span>
            </blockquote>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-lg">
                <Link href="/services/how-we-work">กระบวนการทำงานของเรา <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                <Link href="/services/tip">แจ้งเบาะแส</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                <Link href="/about">เกี่ยวกับเรา</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.04] hidden xl:block pointer-events-none">
          <Scale className="w-[500px] h-[500px]" />
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="bg-white dark:bg-card border-b border-border shadow-sm">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-2">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <div className="font-serif text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Mission ─────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <Badge variant="outline" className="mb-4 text-accent border-accent/30">Our Mission</Badge>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Justice. Integrity.<br />Public Trust.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                สำนักงานอัยการเขต (LSCDA) มีหน้าที่ดำเนินคดีอาญาทุกประเภทที่เกิดขึ้น
                ในเขตลอสแซนโตสเคาน์ตี้ โดยยึดหลักความเที่ยงธรรม ปราศจากอคติ
                และคำนึงถึงสิทธิ์ของทุกฝ่ายตลอดกระบวนการยุติธรรม
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                ประกอบด้วย <strong className="text-foreground">Deputy District Attorney</strong> (อัยการ),{" "}
                <strong className="text-foreground">DA Investigator</strong> (นักสืบที่มีสถานะ Peace Officer),
                และ <strong className="text-foreground">Victim Advocate</strong> (เจ้าหน้าที่ผู้เสียหาย)
                ที่ทำงานร่วมกันเพื่อความยุติธรรมแก่ประชาชนทุกคน
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button asChild variant="outline" className="border-primary/30 hover:bg-primary/5">
                  <Link href="/about">เกี่ยวกับสำนักงาน <ChevronRight className="ml-1 w-4 h-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="border-primary/30 hover:bg-primary/5">
                  <Link href="/about/org-structure">โครงสร้างองค์กร <ChevronRight className="ml-1 w-4 h-4" /></Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {values.map((v) => {
                const Icon = v.icon;
                return (
                  <Card key={v.title} className="card-hover border-border/60">
                    <CardContent className="p-5">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                        <Icon className="w-4 h-4 text-accent" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1.5 text-foreground">{v.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Prosecution Process (summary) ───────────────────── */}
      <section className="py-20 bg-muted/40">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">How We Work</Badge>
            <h2 className="font-serif text-3xl font-bold text-foreground">6 ขั้นตอนสู่ความยุติธรรม</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm">
              จากการสืบสวนจนถึงการพิพากษา — กระบวนการดำเนินคดีของ LSCDA ออกแบบมาเพื่อความยุติธรรมและความโปร่งใส
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto mb-10">
            {processSteps.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.n} className="border-border/60 bg-background">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        <span className="font-serif text-3xl font-bold text-accent/30 leading-none">{s.n}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className="w-4 h-4 text-accent shrink-0" />
                          <h3 className="font-semibold text-sm text-foreground">{s.title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="text-center">
            <Button asChild className="bg-navy-gradient text-white hover:opacity-90">
              <Link href="/services/how-we-work">อ่านรายละเอียดทั้งหมด <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Bureaus & Divisions ──────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <Badge variant="outline" className="mb-3 text-accent border-accent/30">Our Divisions</Badge>
              <h2 className="font-serif text-3xl font-bold text-foreground">หน่วยงานในสังกัด</h2>
              <p className="text-muted-foreground mt-2 text-sm max-w-xl">
                แต่ละ Bureau และ Division มีความเชี่ยวชาญเฉพาะด้าน ทำงานร่วมกันเพื่อดำเนินคดีอย่างครอบคลุม
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/about/org-structure">โครงสร้างทั้งหมด <ChevronRight className="ml-1 w-4 h-4" /></Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bureaus.map((b) => (
              <Card key={b.name} className="card-hover border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm text-foreground leading-snug">{b.name}</h3>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{b.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Public Services ──────────────────────────────────── */}
      <section className="py-20 bg-muted/40">
        <div className="container">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">Public Services</Badge>
            <h2 className="font-serif text-3xl font-bold text-foreground">บริการสำหรับประชาชน</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm">
              ติดต่อสำนักงาน แจ้งเบาะแส หรือตรวจสอบข้อมูลคดีผ่านบริการออนไลน์ของเรา
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((svc) => {
              const Icon = svc.icon;
              return (
                <Link key={svc.href} href={svc.href}>
                  <Card className="card-hover h-full cursor-pointer border-border/60 hover:border-accent/30">
                    <CardContent className="p-6 flex flex-col items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${svc.bg} flex items-center justify-center ${svc.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{svc.label}</h3>
                        <p className="text-sm text-muted-foreground">{svc.desc}</p>
                      </div>
                      <div className="mt-auto flex items-center text-sm font-medium text-accent">
                        เริ่มต้น <ArrowRight className="ml-1 w-3.5 h-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Latest News + Notices ────────────────────────────── */}
      {(latestNews.length > 0 || latestNotices.length > 0) && (
        <section className="py-20 bg-background">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Press Releases — col-span-2 */}
              {latestNews.length > 0 && (
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <Badge variant="outline" className="mb-2 text-accent border-accent/30">Latest News</Badge>
                      <h2 className="font-serif text-2xl font-bold text-foreground">ข่าวแจ้งสื่อมวลชน</h2>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="text-accent">
                      <Link href="/press-releases">ดูทั้งหมด <ArrowRight className="ml-1 w-3.5 h-3.5" /></Link>
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {latestNews.map((pr) => (
                      <Link key={pr.id} href={`/press-releases/${pr.id}`}>
                        <Card className="card-hover cursor-pointer border-border/60">
                          <CardContent className="p-5 flex gap-4">
                            <div className="shrink-0 w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-muted-foreground mb-1">
                                {pr.publishedAt ? format(new Date(pr.publishedAt), "d MMM yyyy") : ""}
                              </div>
                              <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-snug">{pr.title}</h3>
                              {pr.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pr.summary}</p>}
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {/* Notices — col-span-1 */}
              {latestNotices.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <Badge variant="outline" className="mb-2 text-accent border-accent/30">Notices</Badge>
                      <h2 className="font-serif text-2xl font-bold text-foreground">ประกาศสาธารณะ</h2>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="text-accent">
                      <Link href="/notices">ดูทั้งหมด <ArrowRight className="ml-1 w-3.5 h-3.5" /></Link>
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {latestNotices.map((n) => (
                      <Card key={n.id} className="border-border/60">
                        <CardContent className="p-5">
                          <div className="text-xs text-muted-foreground mb-1">
                            {n.publishedAt ? format(new Date(n.publishedAt), "d MMM yyyy") : ""}
                          </div>
                          <h3 className="font-semibold text-sm text-foreground leading-snug">{n.title}</h3>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">{n.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Staff Portal CTA ─────────────────────────────────── */}
      <section className="py-16 bg-navy-gradient text-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Staff Portal</Badge>
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">เจ้าหน้าที่สำนักงาน</h2>
              <p className="text-white/70 leading-relaxed mb-6 text-sm">
                ระบบจัดการคดี หลักฐาน หมายจับ และการพิจารณาคดีสำหรับเจ้าหน้าที่ DA สามารถเข้าสู่ระบบผ่าน Staff Portal
              </p>
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                <Link href="/login">เข้าสู่ระบบ Staff Portal <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "จัดการคดี", desc: "ติดตามและอัปเดตคดีอาญาทุกระดับ" },
                { label: "หลักฐาน", desc: "Chain of Custody และ Digital Forensics" },
                { label: "หมายจับ / ค้น", desc: "ออกหมายและติดตามสถานะ" },
                { label: "นัดพิจารณาคดี", desc: "ปฏิทินห้องพิจารณาคดีทั้งหมด" },
              ].map((f) => (
                <div key={f.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="font-semibold text-sm text-white mb-1">{f.label}</div>
                  <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Emergency Banner ─────────────────────────────────── */}
      <section className="bg-destructive/5 border-y border-destructive/20 py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <div className="font-semibold text-foreground">เหตุฉุกเฉิน? โทร 911</div>
                <div className="text-sm text-muted-foreground">สำหรับกรณีไม่ฉุกเฉิน ติดต่อสำนักงานที่ (213) 974-3512</div>
              </div>
            </div>
            <Button asChild className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shrink-0">
              <Link href="/contact">ติดต่อสำนักงาน</Link>
            </Button>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
