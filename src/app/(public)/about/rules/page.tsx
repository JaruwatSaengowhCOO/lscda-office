import PublicLayout from "@/components/PublicLayout";
import Link from "next/link";
import { ChevronRight, ShieldCheck, FileText, Users, AlertTriangle, BookOpen, Clock, Scale, Eye } from "lucide-react";

const sections = [
  {
    id: "integrity-ethics",
    icon: ShieldCheck,
    title: "ความซื่อสัตย์และจริยธรรม",
    subtitle: "Integrity and Ethics",
    items: [
      "เจ้าหน้าที่ทุกคนต้องยึดมั่นในหลักจริยธรรมวิชาชีพสูงสุด และปฏิบัติตามประมวลจรรยาบรรณของรัฐซานแอนเดรียส",
      "ห้ามใช้ตำแหน่งหน้าที่เพื่อประโยชน์ส่วนตัวหรือบุคคลอื่น ไม่ว่าทางตรงหรือทางอ้อม",
      "ต้องรายงานทันทีหากพบเหตุการณ์ที่อาจขัดต่อจริยธรรมหรือกฎหมายต่อผู้บังคับบัญชาหรือ JSID",
    ],
  },
  {
    id: "professional-conduct",
    icon: Scale,
    title: "การประพฤติตนในวิชาชีพ",
    subtitle: "Professional Conduct",
    items: [
      `ปฏิบัติหน้าที่ด้วยความเป็นกลาง ปราศจากอคติทางการเมือง เชื้อชาติ ศาสนา หรือสถานะทางสังคม`,
      `ห้ามเปิดเผยข้อมูลคดี หลักฐาน หรือข้อมูลที่เป็นความลับแก่บุคคลภายนอกโดยไม่ได้รับอนุญาต (Confidentiality)`,
      `ต้องแจ้ง Conflict of Interest ต่อผู้บังคับบัญชาทันที หากพบว่าตนมีผลประโยชน์เกี่ยวข้องกับคดีที่รับผิดชอบ (Impartiality)`,
      `เคารพในหลักนิติธรรม (Rule of Law) และดำเนินคดีภายใต้กฎหมายอย่างเคร่งครัด ไม่แสวงหาการตัดสินลงโทษโดยไม่คำนึงถึงความจริง`,
      `รับผิดชอบต่อประชาชน (Public Trust) — หน้าที่ของอัยการคือ "แสวงหาความยุติธรรม ไม่ใช่เพียงแค่ชนะคดี"`,
    ],
  },
  {
    id: "courtroom-conduct",
    icon: BookOpen,
    title: "ระเบียบปฏิบัติในห้องพิจารณาคดี",
    subtitle: "Courtroom Conduct",
    items: [
      "การเตรียมคดี (Case Review and Preparation): ต้องศึกษาพยานหลักฐานและข้อกฎหมายอย่างละเอียดก่อนทุกการพิจารณา",
      "การดำเนินการในชั้น Arraignment: แจ้งข้อกล่าวหาต่อจำเลยอย่างชัดเจน ครบถ้วน และเป็นธรรม",
      "การเจรจาข้อตกลง (Plea Negotiations): ต้องดำเนินการอย่างโปร่งใสและบันทึกไว้เป็นลายลักษณ์อักษรทุกครั้ง",
      "การพิจารณา Motion: เตรียมข้อกฎหมายและคำโต้เถียงอย่างละเอียดรอบคอบ",
      "การพิจารณาคดี (Trial Proceedings) และการพิพากษา (Sentencing): ปฏิบัติตามขั้นตอนศาลอย่างเคร่งครัด รักษาความสุภาพและเคารพศาลตลอดเวลา",
    ],
  },
  {
    id: "case-management",
    icon: FileText,
    title: "ระเบียบการจัดการคดี",
    subtitle: "Case Management Procedures",
    items: [
      "บันทึกความคืบหน้าคดีในระบบทุกครั้งที่มีการดำเนินการ ภายใน 24 ชั่วโมงหลังเหตุการณ์",
      "การเปลี่ยนแปลงสถานะคดีต้องได้รับอนุมัติตามลำดับชั้น (Chain of Command)",
      "หลักฐานทั้งหมดต้องถูกบันทึกและจัดเก็บตามระเบียบ Chain of Custody อย่างเคร่งครัด",
      "การนัดหมายศาลต้องแจ้งผู้เสียหายและพยานล่วงหน้าอย่างน้อย 7 วันทำการ",
      "คดีโทษจำคุกเกิน 10 ปีต้องผ่านการทบทวนโดยคณะกรรมการพิเศษก่อนฟ้อง",
    ],
  },
  {
    id: "evidence-handling",
    icon: AlertTriangle,
    title: "ระเบียบการจัดการหลักฐาน",
    subtitle: "Evidence Handling Procedures",
    items: [
      "หลักฐานทางกายภาพทั้งหมดต้องบรรจุ ติดฉลาก และจัดเก็บตามมาตรฐาน Chain of Custody",
      "การเข้าถึงหลักฐานต้องบันทึกในระบบทุกครั้ง พร้อมระบุวัตถุประสงค์และผู้รับผิดชอบ",
      "หลักฐานดิจิทัลต้องผ่าน Forensic Imaging ก่อนวิเคราะห์ เพื่อรักษา Write-Protection",
      "ห้ามนำหลักฐานออกนอกสำนักงานโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร",
      "การทำลายหลักฐานต้องทำตามขั้นตอนกฎหมายและบันทึกเป็นหลักฐานการทำลาย",
    ],
  },
  {
    id: "staff-conduct",
    icon: Users,
    title: "ระเบียบปฏิบัติของเจ้าหน้าที่",
    subtitle: "Staff Conduct & Uniform",
    items: [
      "เวลาทำการ: วันจันทร์–ศุกร์ 08:00–17:00 น. ต้องแจ้งล่วงหน้าหากไม่สามารถมาปฏิบัติงานได้",
      "Courtroom Attire: สวมชุดทางการทุกครั้งที่ปรากฏในศาล — เป็นตัวแทนของสำนักงานและกระบวนการยุติธรรม",
      "Office Uniform และ Field Operations: แต่งกายตามระเบียบ Grooming Standards ที่กำหนด ห้ามสวมเสื้อผ้าที่ Prohibited Attire",
      "ห้ามใช้ทรัพยากรสำนักงานเพื่อประโยชน์ส่วนตัว",
      "การสื่อสารกับสื่อมวลชนต้องผ่านการอนุมัติจากฝ่ายประชาสัมพันธ์เท่านั้น",
      "เจ้าหน้าที่ต้องผ่านการอบรมด้านจริยธรรม กฎหมาย และการพัฒนาวิชาชีพ (Training and Professional Development) ประจำปี",
    ],
  },
  {
    id: "interagency",
    icon: Eye,
    title: "ความสัมพันธ์กับหน่วยงานอื่น",
    subtitle: "Interagency Relations",
    items: [
      "ประสานงานกับ Law Enforcement Agencies (LSPD, LSSD, SAHP) ด้วยความเป็นมืออาชีพและความเคารพ",
      "เคารพในความเป็นอิสระของ Judicial Branch และไม่แทรกแซงกระบวนการตุลาการ",
      "ประสานงานกับ Government Agencies และ Community Partners เพื่อประโยชน์ของประชาชน",
      "Professional Cooperation — ความร่วมมือระหว่างหน่วยงานต้องอยู่บนพื้นฐานของกฎหมายและจริยธรรมเท่านั้น",
    ],
  },
  {
    id: "discipline",
    icon: Clock,
    title: "บทลงโทษและกระบวนการทางวินัย",
    subtitle: "Disciplinary Procedures",
    items: [
      "Grounds for Disciplinary Action: การละเมิดจรรยาบรรณ, การประพฤติมิชอบ, การละเว้นการปฏิบัติหน้าที่",
      "กระบวนการลงโทษตามลำดับ: Counseling → Verbal Warning → Written Warning → Suspension → Demotion → Termination",
      "เจ้าหน้าที่มีสิทธิ์อุทธรณ์คำสั่งทางวินัยต่อคณะกรรมการอุทธรณ์ภายใน 30 วัน",
      "การกระทำที่เป็นความผิดทางอาญาจะถูกส่งต่อหน่วยงานที่มีอำนาจดำเนินคดีทันที",
      "กระบวนการสอบสวนต้องเป็นธรรม โปร่งใส และให้โอกาสผู้ถูกกล่าวหาชี้แจงอย่างเต็มที่",
    ],
  },
];

export default function Rules() {
  return (
    <PublicLayout>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="bg-navy-gradient text-white py-16">
          <div className="container">
            <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Rules & Regulations</span>
            </nav>
            <div className="max-w-3xl">
              <p className="text-accent font-medium tracking-widest uppercase text-sm mb-2">กฎระเบียบ</p>
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
                กฎระเบียบและมาตรฐาน<br />การปฏิบัติงาน
              </h1>
              <p className="text-white/70 text-lg leading-relaxed">
                สำนักงานอัยการเขตลอสแซนโตสเคาน์ตี้ดำเนินงานภายใต้ DA Manual
                ซึ่งกำหนดมาตรฐานจริยธรรม การปฏิบัติตน และกระบวนการทำงานสำหรับเจ้าหน้าที่ทุกระดับ
              </p>
            </div>
          </div>
        </section>

        {/* Quick Nav */}
        <section className="bg-white dark:bg-navy-900 border-b border-border sticky top-16 z-40">
          <div className="container">
            <div className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="shrink-0 px-4 py-1.5 text-xs font-medium rounded-full border border-border hover:border-accent hover:text-accent transition-colors text-muted-foreground whitespace-nowrap"
                >
                  {s.subtitle}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Sections */}
        <div className="container py-12 space-y-10 max-w-4xl">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id} id={section.id} className="scroll-mt-32">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">{section.title}</h2>
                    <p className="text-muted-foreground text-sm">{section.subtitle}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-navy-800 rounded-xl border border-border shadow-sm overflow-hidden">
                  <ul className="divide-y divide-border">
                    {section.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-4 px-6 py-4">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-foreground/80 leading-relaxed">{item}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}

          {/* Motto */}
          <div className="bg-navy-gradient rounded-xl p-8 text-center">
            <p className="text-accent font-medium text-sm uppercase tracking-widest mb-3">Closing Statement</p>
            <blockquote className="font-serif text-xl text-white font-medium italic leading-relaxed">
              "The duty of the prosecutor is to seek justice, not merely to convict."
            </blockquote>
            <p className="text-white/60 mt-4 text-sm">Los Santos County District Attorney's Office — Justice. Integrity. Public Trust.</p>
          </div>
        </div>

        {/* CTA */}
        <section className="bg-muted/30 border-t border-border py-12">
          <div className="container text-center">
            <h3 className="font-serif text-xl font-bold mb-2 text-foreground">มีคำถามหรือข้อร้องเรียน?</h3>
            <p className="text-muted-foreground mb-5 text-sm">ติดต่อสำนักงานหรือยื่นเรื่องร้องเรียนผ่านช่องทางออนไลน์</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="px-5 py-2.5 bg-accent text-navy-900 font-semibold rounded-lg hover:bg-accent/90 transition-colors text-sm">
                ติดต่อสำนักงาน
              </Link>
              <Link href="/about/privacy-policy" className="px-5 py-2.5 border border-border text-foreground font-semibold rounded-lg hover:bg-muted transition-colors text-sm">
                นโยบายความเป็นส่วนตัว
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
