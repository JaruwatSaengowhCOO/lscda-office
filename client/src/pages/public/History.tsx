import { Link } from "wouter";
import { ChevronRight, Scale, Award, BookOpen, Users } from "lucide-react";

const LOGO_URL = "/uploads/DAOCoLS.webp";

const timeline = [
  {
    year: "1972",
    title: "ก่อตั้งสำนักงาน",
    description:
      "สำนักงานอัยการเขตลอสแซนโตสเคาน์ตี้ก่อตั้งขึ้นอย่างเป็นทางการโดยมติของสภาเทศมณฑล เพื่อทำหน้าที่ดำเนินคดีอาญาในนามของรัฐและปกป้องสิทธิของประชาชน",
  },
  {
    year: "1985",
    title: "ขยายแผนกคดีพิเศษ",
    description:
      "จัดตั้งแผนกคดีพิเศษสำหรับอาชญากรรมที่มีความซับซ้อน ได้แก่ คดีอาชญากรรมองค์กร คดีทุจริต และคดีที่เกี่ยวข้องกับยาเสพติดรายใหญ่",
  },
  {
    year: "1993",
    title: "หน่วยบริการผู้เสียหาย",
    description:
      "เปิดตัวหน่วยบริการผู้เสียหายและพยาน (Victim & Witness Assistance Unit) เพื่อให้การสนับสนุนด้านจิตใจ กฎหมาย และสังคมแก่ผู้ที่ได้รับผลกระทบจากอาชญากรรม",
  },
  {
    year: "2005",
    title: "ระบบจัดการคดีดิจิทัล",
    description:
      "นำระบบจัดการคดีอิเล็กทรอนิกส์มาใช้เป็นครั้งแรก ช่วยเพิ่มประสิทธิภาพการติดตามคดี การจัดเก็บหลักฐาน และการประสานงานกับหน่วยงานบังคับใช้กฎหมาย",
  },
  {
    year: "2015",
    title: "โครงการยุติธรรมชุมชน",
    description:
      "เปิดตัวโครงการ Community Justice Initiative มุ่งเน้นการป้องกันอาชญากรรมเชิงรุก การฟื้นฟูผู้กระทำผิดรายแรก และการเสริมสร้างความสัมพันธ์ระหว่างสำนักงานกับชุมชน",
  },
  {
    year: "2023",
    title: "ยุคดิจิทัลสมบูรณ์แบบ",
    description:
      "เปิดตัวระบบบริหารจัดการคดีและบริการประชาชนออนไลน์ครบวงจร พร้อมพอร์ทัลสำหรับเจ้าหน้าที่และระบบแจ้งเบาะแสออนไลน์ที่ปลอดภัย",
  },
];

const stats = [
  { icon: Scale, value: "50+", label: "ปีแห่งการให้บริการ" },
  { icon: Award, value: "87%", label: "อัตราชนะคดี" },
  { icon: Users, value: "240+", label: "เจ้าหน้าที่และอัยการ" },
  { icon: BookOpen, value: "12,400+", label: "คดีที่ดำเนินการแล้ว" },
];

export default function History() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-navy-gradient text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,.05) 40px, rgba(255,255,255,.05) 80px)" }} />
        </div>
        <div className="container relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">History</span>
          </nav>

          <div className="flex flex-col md:flex-row items-center gap-10">
            <img src={LOGO_URL} alt="DA Office Seal" className="w-28 h-28 rounded-full object-cover shadow-2xl border-4 border-accent/40 shrink-0" />
            <div>
              <p className="text-accent font-medium tracking-widest uppercase text-sm mb-2">ความเป็นมา</p>
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 leading-tight">
                ประวัติสำนักงาน<br />อัยการเขต
              </h1>
              <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
                กว่าห้าทศวรรษแห่งการอุทิศตนเพื่อความยุติธรรม ความซื่อสัตย์ และการคุ้มครองสิทธิของประชาชนในเขตลอสแซนโตสเคาน์ตี้
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-navy-900 border-b border-border">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <div className="font-serif text-3xl font-bold text-foreground">{value}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="container py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-bold mb-6 text-foreground">พันธกิจของเรา</h2>
          <blockquote className="text-xl text-muted-foreground leading-relaxed italic border-l-4 border-accent pl-6 text-left">
            "สำนักงานอัยการเขตลอสแซนโตสเคาน์ตี้มุ่งมั่นที่จะแสวงหาความยุติธรรมอย่างเที่ยงธรรม
            ปกป้องผู้บริสุทธิ์ ดำเนินคดีกับผู้กระทำผิด และรับใช้ประชาชนทุกคนด้วยความซื่อสัตย์
            โปร่งใส และความเคารพในศักดิ์ศรีความเป็นมนุษย์"
          </blockquote>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <h2 className="font-serif text-3xl font-bold text-center mb-12 text-foreground">เส้นทางประวัติศาสตร์</h2>
          <div className="relative max-w-3xl mx-auto">
            {/* Vertical line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />

            <div className="space-y-10">
              {timeline.map((item, idx) => (
                <div key={item.year} className={`relative flex gap-6 md:gap-0 ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                  {/* Content */}
                  <div className={`flex-1 md:w-1/2 ${idx % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"} pl-16 md:pl-0`}>
                    <div className="bg-white dark:bg-navy-800 rounded-xl p-5 shadow-sm border border-border">
                      <span className="text-accent font-bold text-lg font-serif">{item.year}</span>
                      <h3 className="font-semibold text-foreground mt-1 mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  {/* Dot */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 top-5 w-4 h-4 rounded-full bg-accent border-4 border-background shadow" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="container py-16">
        <h2 className="font-serif text-3xl font-bold text-center mb-10 text-foreground">ค่านิยมหลัก</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              title: "ความยุติธรรม",
              subtitle: "Justice",
              desc: "ดำเนินคดีด้วยความเที่ยงธรรม ปราศจากอคติ และมุ่งหาความจริงเพื่อประโยชน์สูงสุดของสังคม",
            },
            {
              title: "ความซื่อสัตย์",
              subtitle: "Integrity",
              desc: "ปฏิบัติหน้าที่ด้วยความโปร่งใส ตรวจสอบได้ และยึดมั่นในจริยธรรมวิชาชีพกฎหมายอย่างเคร่งครัด",
            },
            {
              title: "การรับใช้ชุมชน",
              subtitle: "Community Service",
              desc: "ทำงานร่วมกับชุมชน หน่วยงานบังคับใช้กฎหมาย และองค์กรภาคประชาสังคมเพื่อสร้างสังคมที่ปลอดภัย",
            },
          ].map((v) => (
            <div key={v.title} className="bg-white dark:bg-navy-800 rounded-xl p-6 border border-border shadow-sm text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Scale className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-serif font-bold text-lg text-foreground">{v.title}</h3>
              <p className="text-accent text-sm font-medium mb-3">{v.subtitle}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-gradient text-white py-14">
        <div className="container text-center">
          <h2 className="font-serif text-2xl font-bold mb-3">เรียนรู้เพิ่มเติมเกี่ยวกับสำนักงาน</h2>
          <p className="text-white/70 mb-6">ดูโครงสร้างองค์กร กฎระเบียบ และนโยบายการทำงานของเรา</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/about/org-structure" className="px-5 py-2.5 bg-accent text-navy-900 font-semibold rounded-lg hover:bg-accent/90 transition-colors text-sm">
              โครงสร้างองค์กร
            </Link>
            <Link href="/about/rules" className="px-5 py-2.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors text-sm">
              กฎระเบียบการทำงาน
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
