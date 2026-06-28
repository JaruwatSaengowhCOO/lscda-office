import PublicLayout from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Rank hierarchy from DA Manual
const executiveRanks = [
  { rank: "District Attorney", abbr: "DA", desc: "หัวหน้าสำนักงาน มีอำนาจสูงสุดในการตัดสินใจดำเนินคดีทั้งหมดของเขต" },
  { rank: "Chief Deputy District Attorney", abbr: "CDDA", desc: "รองหัวหน้าสำนักงาน รับผิดชอบการบริหารและกำกับดูแลทุก Bureau" },
  { rank: "Assistant District Attorney", abbr: "ADA", desc: "ผู้ช่วย DA ดูแลงานเฉพาะด้านและเป็นตัวแทน DA ในกรณีจำเป็น" },
];

const bureauCommandRanks = [
  { rank: "Bureau Director", desc: "ผู้อำนวยการ Bureau รับผิดชอบการดำเนินงานในระดับ Bureau" },
  { rank: "Assistant Bureau Director", desc: "ผู้ช่วยผู้อำนวยการ Bureau" },
  { rank: "Division Chief", desc: "หัวหน้าแผนก ดูแลการทำงานของ Division เฉพาะทาง" },
];

const prosecutorRanks = [
  { rank: "Head Deputy District Attorney", desc: "อัยการอาวุโสระดับสูง ดูแลคดีสำคัญและกำกับทีมอัยการ" },
  { rank: "Senior Deputy District Attorney", desc: "อัยการอาวุโส มีประสบการณ์สูงในการดำเนินคดีซับซ้อน" },
  { rank: "Deputy District Attorney III", desc: "อัยการระดับ 3 ดำเนินคดีอาญาทุกระดับ" },
  { rank: "Deputy District Attorney II", desc: "อัยการระดับ 2" },
  { rank: "Deputy District Attorney I", desc: "อัยการระดับ 1 — ระดับเริ่มต้น" },
];

const investigatorRanks = [
  { rank: "Chief Investigator", desc: "หัวหน้า Bureau of Investigation ดูแลนักสืบทั้งหมดของสำนักงาน" },
  { rank: "Assistant Chief Investigator", desc: "ผู้ช่วยหัวหน้า Bureau of Investigation" },
  { rank: "Supervising Investigator", desc: "หัวหน้าทีมนักสืบ ประสานงานการสืบสวนหลายคดี" },
  { rank: "Senior Investigator", desc: "นักสืบอาวุโส เชี่ยวชาญคดีพิเศษ" },
  { rank: "District Attorney Investigator", desc: "นักสืบ DA มีสถานะ Peace Officer ภายใต้กฎหมายซานแอนเดรียส" },
];

const bureaus = [
  {
    name: "Bureau of Central Trials",
    type: "Line Operations",
    desc: "ดำเนินคดีอาญาหลักในศาล ตั้งแต่การยื่นฟ้องจนถึงการพิจารณาคดี",
  },
  {
    name: "Bureau of Pre-Filing Diversion",
    type: "Line Operations",
    desc: "โครงการเบี่ยงเบนคดีก่อนยื่นฟ้อง มุ่งเน้นการฟื้นฟูและการแก้ไขสำหรับผู้กระทำผิดรายแรก",
  },
  {
    name: "Special Prosecutions Bureau",
    type: "Special Operations",
    desc: "ดำเนินคดีอาชญากรรมพิเศษ เช่น คดีทุจริต คดีอาชญากรรมองค์กร และคดีที่มีความซับซ้อนสูง",
  },
  {
    name: "Administrative Services Bureau",
    type: "Support",
    desc: "ให้บริการด้านการบริหาร บุคลากร การเงิน และโครงสร้างพื้นฐานของสำนักงาน",
  },
  {
    name: "Justice System Integrity Division (JSID)",
    type: "Special Division",
    desc: "ดูแลความซื่อสัตย์ในกระบวนการยุติธรรม สืบสวนคดีเบิกความเท็จ (Perjury) และการทุจริตในระบบยุติธรรม",
  },
  {
    name: "Gang Injunction Division",
    type: "Special Division",
    desc: "จัดการคดีและคำสั่งห้ามที่เกี่ยวข้องกับแก๊งอาชญากรรมในเขตลอสแซนโตสเคาน์ตี้",
  },
  {
    name: "Bureau of Investigation",
    type: "Investigations",
    desc: "ฝ่ายสืบสวนของสำนักงาน DA Investigators มีสถานะ Peace Officer และดำเนินการสืบสวนอิสระเพื่อสนับสนุนการดำเนินคดี",
  },
];

const typeColors: Record<string, string> = {
  "Line Operations": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Special Operations": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Support": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Special Division": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Investigations": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function OrgStructure() {
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-16">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Organizational Structure</span>
          </nav>
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Organization</Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">โครงสร้างองค์กร</h1>
          <p className="text-white/70 max-w-2xl text-lg">
            สำนักงานอัยการเขตลอสแซนโตสเคาน์ตี้มีโครงสร้างการบังคับบัญชาที่ชัดเจน
            ประกอบด้วยฝ่ายอัยการ ฝ่ายสืบสวน และฝ่ายสนับสนุน เพื่อให้การดำเนินคดีเป็นไปอย่างมีประสิทธิภาพ
          </p>
        </div>
      </section>

      {/* Executive Administration */}
      <section className="py-14 bg-background">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">Executive Administration</Badge>
            <h2 className="font-serif text-3xl font-bold">ผู้บริหารระดับสูง</h2>
          </div>
          <div className="flex flex-col items-center gap-3">
            {executiveRanks.map((r, i) => (
              <div key={r.rank} className="w-full max-w-xl">
                <Card className={`border-2 ${i === 0 ? "border-accent/50 bg-accent/5" : "border-border/60"}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? "bg-accent text-navy-900" : "bg-muted text-muted-foreground"}`}>
                      {r.abbr ?? r.rank.split(" ").map(w => w[0]).join("").slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{r.rank}</div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
                    </div>
                  </CardContent>
                </Card>
                {i < executiveRanks.length - 1 && <div className="flex justify-center my-1"><div className="w-px h-4 bg-border" /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bureau Command & Prosecutor Ranks */}
      <section className="py-14 bg-muted/40">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="font-serif text-2xl font-bold mb-6 text-foreground">Bureau Command Staff</h2>
              <div className="space-y-3">
                {bureauCommandRanks.map((r) => (
                  <Card key={r.rank} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="font-semibold text-foreground text-sm">{r.rank}</div>
                      <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold mb-6 text-foreground">Supervisory Prosecutors</h2>
              <div className="space-y-3">
                {prosecutorRanks.map((r) => (
                  <Card key={r.rank} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="font-semibold text-foreground text-sm">{r.rank}</div>
                      <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DA Investigators */}
      <section className="py-14 bg-background">
        <div className="container max-w-5xl">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">Bureau of Investigation</Badge>
            <h2 className="font-serif text-3xl font-bold">ลำดับชั้น DA Investigator</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm">
              DA Investigators มีสถานะ Peace Officer ภายใต้กฎหมายรัฐซานแอนเดรียส มีอำนาจจับกุม ค้น และสืบสวนอิสระ
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {investigatorRanks.map((r) => (
              <Card key={r.rank} className="border-border/60 card-hover">
                <CardContent className="p-4">
                  <div className="font-semibold text-foreground text-sm">{r.rank}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bureaus & Divisions */}
      <section className="py-14 bg-muted/40">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">Bureaus & Divisions</Badge>
            <h2 className="font-serif text-3xl font-bold">หน่วยงานและแผนก</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {bureaus.map((b) => (
              <Card key={b.name} className="border-border/60 card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-foreground text-sm leading-snug">{b.name}</h3>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[b.type]}`}>{b.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
