import { Link } from "wouter";
import { ChevronRight, ShieldCheck, FileText, Users, AlertTriangle, BookOpen, Clock } from "lucide-react";

const sections = [
  {
    id: "code-of-conduct",
    icon: ShieldCheck,
    title: "จรรยาบรรณและมาตรฐานวิชาชีพ",
    subtitle: "Code of Professional Conduct",
    items: [
      "เจ้าหน้าที่ทุกคนต้องปฏิบัติตามประมวลจริยธรรมของสมาคมทนายความแห่งรัฐซานแอนเดรียส (State Bar of San Andreas Rules of Professional Conduct)",
      "ห้ามเปิดเผยข้อมูลคดีหรือหลักฐานที่เป็นความลับแก่บุคคลภายนอกโดยไม่ได้รับอนุญาต",
      "ห้ามมีผลประโยชน์ทับซ้อนในคดีที่รับผิดชอบ และต้องแจ้งให้ผู้บังคับบัญชาทราบทันทีหากพบว่ามีความขัดแย้งทางผลประโยชน์",
      "ต้องปฏิบัติต่อจำเลย พยาน และผู้เสียหายด้วยความเคารพและให้เกียรติโดยไม่เลือกปฏิบัติ",
      "ห้ามรับสิ่งของมีค่า ของขวัญ หรือผลประโยชน์ใด ๆ จากคู่ความหรือบุคคลที่เกี่ยวข้องกับคดี",
    ],
  },
  {
    id: "case-management",
    icon: FileText,
    title: "ระเบียบการจัดการคดี",
    subtitle: "Case Management Procedures",
    items: [
      "อัยการผู้รับผิดชอบต้องบันทึกความคืบหน้าคดีในระบบทุกครั้งที่มีการดำเนินการ ภายใน 24 ชั่วโมงหลังจากเหตุการณ์",
      "การเปลี่ยนแปลงสถานะคดีต้องได้รับอนุมัติจากหัวหน้าแผนกหรือผู้ที่ได้รับมอบหมาย",
      "หลักฐานทั้งหมดต้องถูกบันทึกและจัดเก็บตามระเบียบ Chain of Custody อย่างเคร่งครัด",
      "การนัดหมายศาลต้องแจ้งให้ผู้เสียหายและพยานทราบล่วงหน้าอย่างน้อย 7 วันทำการ",
      "คดีที่มีโทษจำคุกเกิน 10 ปีต้องได้รับการทบทวนโดยคณะกรรมการพิเศษก่อนดำเนินการฟ้อง",
    ],
  },
  {
    id: "staff-conduct",
    icon: Users,
    title: "ระเบียบปฏิบัติของเจ้าหน้าที่",
    subtitle: "Staff Conduct & Workplace Rules",
    items: [
      "เวลาทำการปกติ: วันจันทร์–ศุกร์ เวลา 08:00–17:00 น. เจ้าหน้าที่ต้องแจ้งล่วงหน้าหากไม่สามารถมาปฏิบัติงานได้",
      "การแต่งกายต้องสุภาพเรียบร้อยตามมาตรฐานสำนักงานราชการ เมื่อปรากฏตัวในศาลต้องสวมชุดทางการ",
      "ห้ามใช้อุปกรณ์หรือทรัพยากรของสำนักงานเพื่อประโยชน์ส่วนตัว",
      "การสื่อสารกับสื่อมวลชนต้องผ่านการอนุมัติจากฝ่ายประชาสัมพันธ์เท่านั้น",
      "เจ้าหน้าที่ต้องผ่านการอบรมด้านจริยธรรมและกฎหมายประจำปีตามที่สำนักงานกำหนด",
    ],
  },
  {
    id: "evidence",
    icon: AlertTriangle,
    title: "ระเบียบการจัดการหลักฐาน",
    subtitle: "Evidence Handling Procedures",
    items: [
      "หลักฐานทางกายภาพทั้งหมดต้องถูกบรรจุ ติดฉลาก และจัดเก็บในห้องเก็บหลักฐานที่ได้มาตรฐาน",
      "การเข้าถึงหลักฐานต้องมีการบันทึกในระบบทุกครั้ง พร้อมระบุวัตถุประสงค์และผู้รับผิดชอบ",
      "หลักฐานดิจิทัลต้องผ่านกระบวนการ Forensic Imaging ก่อนการวิเคราะห์เพื่อรักษาความสมบูรณ์ของข้อมูล",
      "ห้ามนำหลักฐานออกนอกสำนักงานโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร",
      "หลักฐานที่ไม่จำเป็นแล้วต้องถูกทำลายตามขั้นตอนที่กฎหมายกำหนดและบันทึกเป็นหลักฐาน",
    ],
  },
  {
    id: "public-service",
    icon: BookOpen,
    title: "มาตรฐานการให้บริการประชาชน",
    subtitle: "Public Service Standards",
    items: [
      "ต้องตอบสนองต่อคำร้องของประชาชนภายใน 5 วันทำการ นับจากวันที่ได้รับคำร้อง",
      "ข้อมูลที่ประชาชนสามารถเข้าถึงได้ต้องเผยแพร่บนเว็บไซต์สำนักงานและอัปเดตอย่างสม่ำเสมอ",
      "ผู้เสียหายมีสิทธิ์ได้รับการแจ้งความคืบหน้าคดีที่ตนเกี่ยวข้องทุกระยะ",
      "การรับเรื่องร้องเรียนต้องดำเนินการอย่างเป็นกลางและโปร่งใส พร้อมแจ้งผลให้ผู้ร้องทราบ",
      "บริการล่ามภาษาต้องจัดให้แก่ผู้ที่ไม่สามารถสื่อสารเป็นภาษาอังกฤษได้โดยไม่มีค่าใช้จ่าย",
    ],
  },
  {
    id: "discipline",
    icon: Clock,
    title: "บทลงโทษและกระบวนการทางวินัย",
    subtitle: "Disciplinary Procedures",
    items: [
      "การละเมิดจรรยาบรรณเล็กน้อยจะได้รับการตักเตือนเป็นลายลักษณ์อักษรและบันทึกในแฟ้มประวัติ",
      "การละเมิดซ้ำหรือกรณีร้ายแรงอาจนำไปสู่การพักงาน ลดตำแหน่ง หรือการเลิกจ้าง",
      "เจ้าหน้าที่มีสิทธิ์ยื่นอุทธรณ์คำสั่งทางวินัยต่อคณะกรรมการอุทธรณ์ภายใน 30 วัน",
      "การกระทำที่เป็นความผิดทางอาญาจะถูกส่งเรื่องต่อหน่วยงานที่มีอำนาจดำเนินคดีโดยทันที",
      "กระบวนการสอบสวนทางวินัยต้องดำเนินการอย่างเป็นธรรมและให้โอกาสผู้ถูกกล่าวหาชี้แจง",
    ],
  },
];

export default function Rules() {
  return (
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
              สำนักงานอัยการเขตลอสแซนโตสเคาน์ตี้ดำเนินงานภายใต้กรอบกฎหมาย จริยธรรม
              และระเบียบปฏิบัติที่เข้มงวดเพื่อรับประกันความยุติธรรมและความโปร่งใสในทุกกระบวนการ
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

        {/* Disclaimer */}
        <div className="bg-muted/50 rounded-xl border border-border p-6 text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-2">หมายเหตุสำคัญ</p>
          <p>
            กฎระเบียบและมาตรฐานการปฏิบัติงานนี้เป็นสรุปสำหรับประชาชนทั่วไป
            เจ้าหน้าที่สำนักงานต้องศึกษาและปฏิบัติตามคู่มือปฏิบัติงานฉบับเต็มและกฎหมายที่เกี่ยวข้อง
            หากมีข้อสงสัยหรือต้องการข้อมูลเพิ่มเติม กรุณาติดต่อฝ่ายกฎหมายและจริยธรรมของสำนักงาน
          </p>
          <p className="mt-2">
            อัปเดตล่าสุด: มกราคม 2026 | เวอร์ชัน 3.2
          </p>
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
  );
}
