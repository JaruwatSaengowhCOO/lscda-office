import PublicLayout from "@/components/PublicLayout";
import Link from "next/link";
import {
  ChevronRight, Search, FileText, Gavel, Scale, Shield, Users,
  ArrowRight, CheckCircle, AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const prosecutionSteps = [
  {
    step: 1,
    icon: Search,
    title: "การสืบสวนและรวบรวมหลักฐาน",
    subtitle: "Investigation & Evidence Gathering",
    desc: "DA Investigators ซึ่งมีสถานะ Peace Officer ทำการสืบสวนอิสระ ประสานงานกับตำรวจ (LSPD/LSSD/SAHP) รวบรวมพยานหลักฐาน สัมภาษณ์พยาน และจัดทำรายงานการสืบสวน",
    details: [
      "Crime Scene Coordination — เจ้าหน้าที่ DA ประสานงาน ณ ที่เกิดเหตุ",
      "Evidence Handling — หลักฐานทุกชิ้นถูกบันทึกตาม Chain of Custody",
      "Interviews & Interrogations — สัมภาษณ์ผู้ต้องสงสัยโดยแจ้ง Miranda Rights ก่อนเสมอ",
      "Digital Forensics — วิเคราะห์หลักฐานดิจิทัลผ่านกระบวนการ Forensic Imaging",
    ],
    color: "blue",
  },
  {
    step: 2,
    icon: FileText,
    title: "การทบทวนและตัดสินใจฟ้อง",
    subtitle: "Case Review & Filing Decision",
    desc: "อัยการทบทวนหลักฐานและข้อเท็จจริงอย่างละเอียด เพื่อพิจารณาว่ามีหลักฐานเพียงพอที่จะดำเนินคดีหรือไม่ โดยยึดหลัก \"แสวงหาความยุติธรรม ไม่ใช่เพียงแค่ชนะคดี\"",
    details: [
      "Preliminary Review — ตรวจสอบเบื้องต้นว่าคดีมีมูลหรือไม่",
      "คดีโทษสูงต้องผ่านการทบทวนโดยคณะกรรมการพิเศษก่อนยื่นฟ้อง",
      "Pre-Filing Diversion — คดีที่เหมาะสมอาจถูกเบี่ยงไปยังโครงการฟื้นฟูแทนการฟ้อง",
      "อัยการบันทึกเหตุผลทุกการตัดสินใจในระบบเพื่อความโปร่งใส",
    ],
    color: "amber",
  },
  {
    step: 3,
    icon: Gavel,
    title: "การยื่นฟ้องและ Arraignment",
    subtitle: "Filing & Arraignment",
    desc: "เมื่อตัดสินใจฟ้อง อัยการยื่นฟ้องต่อศาล และดำเนินการ Arraignment — การอ่านข้อกล่าวหาให้จำเลยฟังอย่างเป็นทางการ จำเลยมีสิทธิ์รับหรือปฏิเสธข้อกล่าวหา",
    details: [
      "แจ้งข้อกล่าวหาอย่างชัดเจน ครบถ้วน และเป็นธรรมแก่จำเลย",
      "จำเลยมีสิทธิ์ได้รับการแต่งตั้งทนายความ (Public Defender) หากไม่มีทุนจ้าง",
      "พิจารณาเรื่องการประกันตัวและเงื่อนไขการปล่อยตัวชั่วคราว",
      "กำหนดวันนัดหมายการพิจารณาคดีขั้นต่อไป",
    ],
    color: "purple",
  },
  {
    step: 4,
    icon: Scale,
    title: "การเจรจาและ Motion Hearings",
    subtitle: "Plea Negotiations & Motions",
    desc: "อัยการและทนายฝ่ายจำเลยอาจเจรจา Plea Deal เพื่อประโยชน์ของทุกฝ่าย การเจรจาต้องโปร่งใสและบันทึกเป็นลายลักษณ์อักษร ขณะเดียวกัน Motion Hearings จัดการข้อกฎหมายก่อนขึ้นศาล",
    details: [
      "Plea Negotiations — การเจรจาข้อตกลงต้องได้รับการอนุมัติตามลำดับชั้น",
      "Motion to Suppress — พิจารณาคำร้องขอตัดพยานหลักฐานที่ได้มาโดยไม่ชอบด้วยกฎหมาย",
      "Motion Hearings — อัยการเตรียมข้อกฎหมายและโต้เถียงอย่างรอบคอบ",
      "Preliminary Hearing — ศาลพิจารณาว่ามีหลักฐานเพียงพอที่จะนำคดีขึ้นศาลหรือไม่",
    ],
    color: "indigo",
  },
  {
    step: 5,
    icon: Gavel,
    title: "การพิจารณาคดีในศาล",
    subtitle: "Trial Proceedings",
    desc: "การพิจารณาคดีต่อหน้าผู้พิพากษา (และคณะลูกขุน ถ้ามี) อัยการนำเสนอหลักฐานและพยาน ซักถามพยาน และโต้เถียงข้อกฎหมาย ภายใต้หลักการพิสูจน์ความผิดเกินข้อสงสัยสมเหตุสมผล",
    details: [
      "Opening Statement — อัยการแสดงภาพรวมของคดีต่อศาล",
      "Examination of Witnesses — ซักถามและค้านพยานอย่างเป็นธรรม",
      "Presentation of Evidence — นำเสนอหลักฐานตาม Chain of Custody",
      "Closing Argument — สรุปข้อเท็จจริงและข้อกฎหมายให้ศาลพิจารณา",
    ],
    color: "red",
  },
  {
    step: 6,
    icon: Scale,
    title: "การพิพากษาโทษ",
    subtitle: "Sentencing",
    desc: "เมื่อจำเลยถูกพิพากษาว่าผิด ศาลจะกำหนดโทษโดยอัยการมีบทบาทในการเสนอแนะโทษที่เหมาะสม คำนึงถึงความร้ายแรงของคดี ประวัติของจำเลย และผลกระทบต่อผู้เสียหายและสังคม",
    details: [
      "Victim Impact Statement — ผู้เสียหายมีสิทธิ์แถลงผลกระทบต่อศาล",
      "อัยการเสนอคำขอโทษที่เป็นธรรมและสมเหตุสมผล",
      "พิจารณาโปรแกรมฟื้นฟูหรือการรับใช้ชุมชนในกรณีที่เหมาะสม",
      "บันทึกผลคดีในระบบเพื่อสถิติและการตรวจสอบ",
    ],
    color: "green",
  },
];

const colorMap: Record<string, { bg: string; icon: string; badge: string; border: string }> = {
  blue:   { bg: "bg-blue-50 dark:bg-blue-900/20",   icon: "text-blue-600",   badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",   border: "border-blue-200 dark:border-blue-800" },
  amber:  { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-600",  badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  purple: { bg: "bg-purple-50 dark:bg-purple-900/20", icon: "text-purple-600", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/20", icon: "text-indigo-600", badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
  red:    { bg: "bg-red-50 dark:bg-red-900/20",     icon: "text-red-600",    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",     border: "border-red-200 dark:border-red-800" },
  green:  { bg: "bg-green-50 dark:bg-green-900/20", icon: "text-green-600",  badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
};

const rights = [
  { icon: CheckCircle, title: "สิทธิ์รับทราบข้อมูลคดี", desc: "ผู้เสียหายมีสิทธิ์ได้รับการแจ้งความคืบหน้าของคดีที่ตนเกี่ยวข้องในทุกระยะ" },
  { icon: CheckCircle, title: "สิทธิ์แถลงผลกระทบ", desc: "ผู้เสียหายสามารถยื่น Victim Impact Statement ต่อศาลในชั้นพิพากษาโทษ" },
  { icon: CheckCircle, title: "สิทธิ์ขอการคุ้มครอง", desc: "ผู้เสียหายสามารถขอคำสั่งคุ้มครอง (Protection Order) ผ่านสำนักงานได้" },
  { icon: CheckCircle, title: "บริการผู้เสียหาย", desc: "Victim Advocate ของสำนักงานให้การสนับสนุนด้านจิตใจ กฎหมาย และสังคมตลอดกระบวนการ" },
  { icon: AlertCircle, title: "การชดเชย", desc: "อาจมีการพิจารณาค่าชดเชยให้ผู้เสียหาย (Compensation) ตามระเบียบของรัฐ" },
  { icon: AlertCircle, title: "ล่ามภาษา", desc: "บริการล่ามภาษาจัดให้โดยไม่มีค่าใช้จ่ายสำหรับผู้ที่ไม่สามารถสื่อสารภาษาอังกฤษได้" },
];

export default function HowWeWork() {
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-16">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">How We Work</span>
          </nav>
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Prosecution Process</Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            กระบวนการทำงานของ<br />สำนักงานอัยการเขต
          </h1>
          <p className="text-white/70 max-w-2xl text-lg leading-relaxed">
            ตั้งแต่การสืบสวนจนถึงการพิพากษา — ทำความเข้าใจว่าสำนักงานอัยการเขต
            ลอสแซนโตสเคาน์ตี้ดำเนินคดีเพื่อความยุติธรรมแก่ประชาชนอย่างไร
          </p>
          <blockquote className="mt-6 pl-4 border-l-2 border-accent text-white/60 italic text-sm">
            "The duty of the prosecutor is to seek justice, not merely to convict."
          </blockquote>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 bg-background">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">Criminal Justice Process</Badge>
            <h2 className="font-serif text-3xl font-bold">6 ขั้นตอนสู่ความยุติธรรม</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              กระบวนการดำเนินคดีอาญาของ LSCDA ออกแบบมาเพื่อความยุติธรรม ความโปร่งใส และการคุ้มครองสิทธิ์ทุกฝ่าย
            </p>
          </div>

          <div className="space-y-6">
            {prosecutionSteps.map((step, idx) => {
              const Icon = step.icon;
              const c = colorMap[step.color];
              return (
                <div key={step.step} className="relative">
                  {/* Connector line */}
                  {idx < prosecutionSteps.length - 1 && (
                    <div className="absolute left-6 top-16 bottom-0 w-px bg-border -mb-6 z-0" />
                  )}
                  <Card className={`border ${c.border} relative z-10`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`shrink-0 w-12 h-12 rounded-full ${c.bg} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${c.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                              ขั้นตอนที่ {step.step}
                            </span>
                            <span className="text-xs text-muted-foreground">{step.subtitle}</span>
                          </div>
                          <h3 className="font-serif font-bold text-lg text-foreground mb-2">{step.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.desc}</p>
                          <ul className="space-y-1.5">
                            {step.details.map((d, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-foreground/70">
                                <ArrowRight className={`w-3 h-3 mt-0.5 shrink-0 ${c.icon}`} />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Victim Rights */}
      <section className="py-16 bg-muted/40">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">Victim Rights</Badge>
            <h2 className="font-serif text-3xl font-bold">สิทธิ์ของผู้เสียหาย</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm">
              สำนักงานอัยการเขตให้ความสำคัญสูงสุดกับการคุ้มครองและสนับสนุนผู้เสียหายตลอดกระบวนการ
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {rights.map((r) => {
              const Icon = r.icon;
              const isCheck = r.icon === CheckCircle;
              return (
                <Card key={r.title} className="border-border/60">
                  <CardContent className="p-5 flex items-start gap-3">
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isCheck ? "text-green-600" : "text-amber-600"}`} />
                    <div>
                      <div className="font-semibold text-sm text-foreground">{r.title}</div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who does what */}
      <section className="py-16 bg-background">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">Our Teams</Badge>
            <h2 className="font-serif text-3xl font-bold">ใครทำอะไรบ้าง?</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Gavel, title: "Deputy District Attorney", role: "อัยการ", desc: "ดำเนินคดีในศาล ตั้งแต่การยื่นฟ้องจนถึงการพิพากษา เป็นตัวแทนของรัฐและประชาชนในกระบวนการยุติธรรม", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
              { icon: Search, title: "DA Investigator", role: "นักสืบ DA", desc: "Peace Officer ที่มีอำนาจจับกุมและสืบสวนอิสระ ประสานงานกับ LSPD/LSSD/SAHP รวบรวมหลักฐาน สนับสนุนการดำเนินคดี", color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
              { icon: Users, title: "Victim Advocate", role: "เจ้าหน้าที่ผู้เสียหาย", desc: "ให้การสนับสนุนด้านจิตใจ กฎหมาย และสังคมแก่ผู้เสียหายและพยาน ตลอดทุกขั้นตอนของกระบวนการยุติธรรม", color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-border/60 card-hover">
                  <CardContent className="p-5 text-center">
                    <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center mx-auto mb-3`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{item.role}</div>
                    <h3 className="font-semibold text-sm text-foreground mb-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-gradient text-white py-14">
        <div className="container text-center">
          <h2 className="font-serif text-2xl font-bold mb-3">มีคำถามหรือต้องการความช่วยเหลือ?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto text-sm">
            หากคุณเป็นผู้เสียหาย พยาน หรือมีข้อมูลเกี่ยวกับคดี สามารถติดต่อสำนักงานหรือรายงานผ่านช่องทางออนไลน์ได้
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/services/tip" className="px-5 py-2.5 bg-accent text-navy-900 font-semibold rounded-lg hover:bg-accent/90 transition-colors text-sm">
              แจ้งเบาะแส
            </Link>
            <Link href="/services/case-status" className="px-5 py-2.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors text-sm">
              ตรวจสอบสถานะคดี
            </Link>
            <Link href="/contact" className="px-5 py-2.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors text-sm">
              ติดต่อสำนักงาน
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
