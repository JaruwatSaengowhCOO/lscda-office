import { Link } from "wouter";
import { ChevronRight, Shield, Eye, Lock, UserCheck, Bell, Mail } from "lucide-react";

const sections = [
  {
    id: "collection",
    icon: Eye,
    title: "ข้อมูลที่เราเก็บรวบรวม",
    subtitle: "Information We Collect",
    content: [
      {
        heading: "ข้อมูลที่คุณให้โดยตรง",
        text: "เมื่อคุณส่งคำร้อง แจ้งเบาะแส หรือติดต่อสำนักงาน เราจะเก็บข้อมูลที่คุณให้ไว้ เช่น ชื่อ ที่อยู่อีเมล หมายเลขโทรศัพท์ และรายละเอียดที่เกี่ยวข้องกับคำร้องของคุณ",
      },
      {
        heading: "ข้อมูลการใช้งานเว็บไซต์",
        text: "เราเก็บข้อมูลการเข้าชมเว็บไซต์โดยอัตโนมัติ ได้แก่ ที่อยู่ IP ประเภทเบราว์เซอร์ หน้าที่เข้าชม และเวลาที่เข้าชม เพื่อปรับปรุงประสิทธิภาพของบริการ",
      },
      {
        heading: "ข้อมูลจากการแจ้งเบาะแส",
        text: "การแจ้งเบาะแสสามารถทำได้โดยไม่เปิดเผยตัวตน หากคุณเลือกระบุข้อมูลส่วนตัว ข้อมูลดังกล่าวจะถูกเก็บรักษาเป็นความลับตามกฎหมายคุ้มครองผู้แจ้งเบาะแส",
      },
    ],
  },
  {
    id: "usage",
    icon: UserCheck,
    title: "วัตถุประสงค์การใช้ข้อมูล",
    subtitle: "How We Use Your Information",
    content: [
      {
        heading: "การดำเนินงานของสำนักงาน",
        text: "ข้อมูลของคุณถูกใช้เพื่อดำเนินการตามคำร้อง ติดตามสถานะคดี ประสานงานกับหน่วยงานที่เกี่ยวข้อง และให้บริการแก่ผู้เสียหายและพยาน",
      },
      {
        heading: "การปรับปรุงบริการ",
        text: "เราวิเคราะห์ข้อมูลการใช้งานในภาพรวม (ไม่ระบุตัวตน) เพื่อพัฒนาคุณภาพการให้บริการและปรับปรุงเว็บไซต์ให้ใช้งานได้ดียิ่งขึ้น",
      },
      {
        heading: "การปฏิบัติตามกฎหมาย",
        text: "สำนักงานอาจเปิดเผยข้อมูลเมื่อจำเป็นตามกฎหมาย คำสั่งศาล หรือในกรณีที่จำเป็นเพื่อป้องกันอันตรายต่อบุคคลหรือสาธารณะ",
      },
    ],
  },
  {
    id: "protection",
    icon: Lock,
    title: "การคุ้มครองข้อมูล",
    subtitle: "Data Protection & Security",
    content: [
      {
        heading: "มาตรการรักษาความปลอดภัย",
        text: "ข้อมูลทั้งหมดถูกเข้ารหัสด้วยมาตรฐาน SSL/TLS และจัดเก็บในระบบที่ได้รับการป้องกันตามมาตรฐานความปลอดภัยของหน่วยงานรัฐบาล",
      },
      {
        heading: "การควบคุมการเข้าถึง",
        text: "เฉพาะเจ้าหน้าที่ที่ได้รับอนุญาตเท่านั้นที่สามารถเข้าถึงข้อมูลส่วนบุคคล โดยมีระบบบันทึกการเข้าถึงทุกครั้ง",
      },
      {
        heading: "ระยะเวลาการเก็บข้อมูล",
        text: "ข้อมูลที่เกี่ยวข้องกับคดีจะถูกเก็บรักษาตามระยะเวลาที่กฎหมายกำหนด ข้อมูลที่ไม่จำเป็นจะถูกลบออกอย่างปลอดภัยตามนโยบายการจัดการเอกสาร",
      },
    ],
  },
  {
    id: "rights",
    icon: Shield,
    title: "สิทธิ์ของคุณ",
    subtitle: "Your Rights",
    content: [
      {
        heading: "สิทธิ์ในการเข้าถึงข้อมูล",
        text: "คุณมีสิทธิ์ขอดูข้อมูลส่วนบุคคลที่สำนักงานเก็บไว้เกี่ยวกับคุณ โดยยื่นคำร้องเป็นลายลักษณ์อักษรตาม San Andreas Public Records Act",
      },
      {
        heading: "สิทธิ์ในการแก้ไขข้อมูล",
        text: "หากข้อมูลของคุณไม่ถูกต้อง คุณสามารถขอแก้ไขได้โดยติดต่อสำนักงานพร้อมหลักฐานประกอบ",
      },
      {
        heading: "สิทธิ์ของผู้เสียหาย",
        text: "ผู้เสียหายในคดีอาญามีสิทธิ์พิเศษเพิ่มเติมตาม San Andreas Victims' Bill of Rights รวมถึงสิทธิ์ในการรับทราบข้อมูลคดีและการคุ้มครองความเป็นส่วนตัว",
      },
    ],
  },
  {
    id: "cookies",
    icon: Bell,
    title: "คุกกี้และการติดตาม",
    subtitle: "Cookies & Tracking",
    content: [
      {
        heading: "การใช้คุกกี้",
        text: "เว็บไซต์ใช้คุกกี้ที่จำเป็นสำหรับการทำงานของระบบ (Session Cookies) และคุกกี้วิเคราะห์ข้อมูลการใช้งาน (Analytics Cookies) เพื่อปรับปรุงประสบการณ์ผู้ใช้",
      },
      {
        heading: "การปฏิเสธคุกกี้",
        text: "คุณสามารถตั้งค่าเบราว์เซอร์ให้ปฏิเสธคุกกี้ได้ อย่างไรก็ตาม บางฟีเจอร์ของเว็บไซต์อาจทำงานไม่สมบูรณ์หากปิดการใช้งานคุกกี้",
      },
      {
        heading: "บุคคลที่สาม",
        text: "เราไม่แบ่งปันข้อมูลส่วนบุคคลกับบุคคลที่สามเพื่อวัตถุประสงค์ทางการตลาด ข้อมูลจะถูกแบ่งปันเฉพาะกับหน่วยงานรัฐบาลที่เกี่ยวข้องตามกฎหมายเท่านั้น",
      },
    ],
  },
  {
    id: "contact",
    icon: Mail,
    title: "ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล",
    subtitle: "Contact Data Protection Officer",
    content: [
      {
        heading: "Privacy Officer",
        text: "หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวหรือต้องการใช้สิทธิ์ของคุณ ติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลได้ที่ privacy@lscda.gov หรือโทร (213) 974-3512 ต่อ 200",
      },
      {
        heading: "ระยะเวลาการตอบกลับ",
        text: "สำนักงานจะตอบกลับคำร้องที่เกี่ยวกับข้อมูลส่วนบุคคลภายใน 30 วันทำการ นับจากวันที่ได้รับคำร้อง",
      },
      {
        heading: "การร้องเรียน",
        text: "หากคุณไม่พอใจกับการจัดการข้อมูลของสำนักงาน คุณมีสิทธิ์ยื่นเรื่องร้องเรียนต่อ San Andreas Privacy Protection Agency (SAPPA)",
      },
    ],
  },
];

export default function PrivacyPolicy() {
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
            <span className="text-white">Privacy Policy</span>
          </nav>
          <div className="flex items-start gap-5 max-w-3xl">
            <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 mt-1">
              <Shield className="w-8 h-8 text-accent" />
            </div>
            <div>
              <p className="text-accent font-medium tracking-widest uppercase text-sm mb-2">นโยบาย</p>
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
                นโยบายความเป็นส่วนตัว
              </h1>
              <p className="text-white/70 text-lg leading-relaxed">
                สำนักงานอัยการเขตลอสแซนโตสเคาน์ตี้ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของคุณ
                นโยบายนี้อธิบายวิธีการเก็บรวบรวม ใช้ และคุ้มครองข้อมูลของคุณ
              </p>
              <p className="text-white/50 text-sm mt-3">
                มีผลบังคับใช้ตั้งแต่: 1 มกราคม 2026 | อัปเดตล่าสุด: 1 มิถุนายน 2026
              </p>
            </div>
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

      {/* Content */}
      <div className="container py-12 max-w-4xl">
        {/* Intro */}
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 mb-10">
          <p className="text-sm text-foreground/80 leading-relaxed">
            นโยบายความเป็นส่วนตัวนี้ใช้บังคับกับเว็บไซต์และบริการออนไลน์ทั้งหมดของสำนักงานอัยการเขตลอสแซนโตสเคาน์ตี้
            การใช้งานเว็บไซต์ของเราถือว่าคุณยอมรับนโยบายนี้ หากคุณไม่เห็นด้วยกับนโยบายใด ๆ
            กรุณาหยุดใช้งานและติดต่อสำนักงานเพื่อรับบริการผ่านช่องทางอื่น
          </p>
        </div>

        <div className="space-y-10">
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
                  <div className="divide-y divide-border">
                    {section.content.map((item, idx) => (
                      <div key={idx} className="px-6 py-5">
                        <h3 className="font-semibold text-foreground text-sm mb-2">{item.heading}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legal Note */}
        <div className="mt-10 bg-muted/50 rounded-xl border border-border p-6 text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-2">กฎหมายที่เกี่ยวข้อง</p>
          <p>
            นโยบายนี้สอดคล้องกับ San Andreas Consumer Privacy Act (SACPA), San Andreas Privacy Rights Act (SAPRA),
            และกฎหมายความเป็นส่วนตัวของรัฐซานแอนเดรียสที่เกี่ยวข้อง
            สำนักงานสงวนสิทธิ์ในการแก้ไขนโยบายนี้เมื่อจำเป็น และจะแจ้งให้ทราบผ่านเว็บไซต์ล่วงหน้า 30 วัน
          </p>
        </div>
      </div>

      {/* CTA */}
      <section className="bg-muted/30 border-t border-border py-12">
        <div className="container text-center">
          <h3 className="font-serif text-xl font-bold mb-2 text-foreground">ต้องการข้อมูลเพิ่มเติม?</h3>
          <p className="text-muted-foreground mb-5 text-sm">ติดต่อเจ้าหน้าที่คุ้มครองข้อมูลหรือดูกฎระเบียบการทำงาน</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="px-5 py-2.5 bg-accent text-navy-900 font-semibold rounded-lg hover:bg-accent/90 transition-colors text-sm">
              ติดต่อสำนักงาน
            </Link>
            <Link href="/about/rules" className="px-5 py-2.5 border border-border text-foreground font-semibold rounded-lg hover:bg-muted transition-colors text-sm">
              กฎระเบียบการทำงาน
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
