import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Scale, Shield, Users, FileText, Phone, AlertTriangle, ChevronRight, BookOpen } from "lucide-react";
import { format } from "date-fns";

const stats = [
  { label: "Cases Prosecuted", value: "12,400+", icon: Scale },
  { label: "Conviction Rate", value: "87%", icon: Shield },
  { label: "Staff Members", value: "240+", icon: Users },
  { label: "Years of Service", value: "75+", icon: BookOpen },
];

const services = [
  { icon: AlertTriangle, label: "Submit a Tip", desc: "Report criminal activity anonymously", href: "/services/tip", color: "text-amber-600" },
  { icon: FileText, label: "Submit a Request", desc: "Request documents or case information", href: "/services/request", color: "text-blue-600" },
  { icon: Scale, label: "Check Case Status", desc: "Track the status of a public case", href: "/services/case-status", color: "text-green-600" },
  { icon: BookOpen, label: "Download Documents", desc: "Access public forms and documents", href: "/services/documents", color: "text-purple-600" },
];

export default function Home() {
  const { data: pressReleases } = trpc.public.pressReleases.useQuery();
  const latestNews = pressReleases?.slice(0, 3) ?? [];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-navy-gradient text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 41px)" }} />
        </div>
        <div className="container relative py-24 md:py-32">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 font-medium">
              Los Santos County
            </Badge>
            <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight mb-6">
              District Attorney's
              <span className="block text-gold-gradient">Office</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-8 max-w-2xl">
              Dedicated to pursuing justice, protecting the rights of crime victims, and ensuring the safety and well-being of all residents of Los Santos County.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                <Link href="/about">Learn About Our Office <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                <Link href="/services/tip">Report a Crime</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative scale icon */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 hidden xl:block">
          <Scale className="w-96 h-96" />
        </div>
      </section>

      {/* Stats Bar */}
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

      {/* Mission Statement */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 text-accent border-accent/30">Our Mission</Badge>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Justice for Every Resident of Los Santos
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Los Santos County District Attorney's Office is committed to the fair and impartial administration of justice. We prosecute criminal violations of state law within Los Santos County, while upholding the constitutional rights of all individuals.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our team of dedicated prosecutors, investigators, and support staff work tirelessly to protect victims, hold offenders accountable, and build a safer community for all.
              </p>
              <Button asChild variant="outline" className="border-primary/30 hover:bg-primary/5">
                <Link href="/about">About Our Office <ChevronRight className="ml-1 w-4 h-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "Victim-Centered", desc: "We prioritize the needs and rights of crime victims throughout the legal process." },
                { title: "Transparency", desc: "We maintain open communication with the public about our work and decisions." },
                { title: "Accountability", desc: "We hold ourselves to the highest standards of professional conduct." },
                { title: "Community Safety", desc: "We work to prevent crime and protect all residents of Los Santos County." },
              ].map((item) => (
                <Card key={item.title} className="card-hover border-border/60">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-2 text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Public Services */}
      <section className="py-16 bg-muted/40">
        <div className="container">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">Public Services</Badge>
            <h2 className="font-serif text-3xl font-bold text-foreground">How We Can Help You</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Access our public services to report crimes, request information, or check the status of a case.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((svc) => {
              const Icon = svc.icon;
              return (
                <Link key={svc.href} href={svc.href}>
                  <Card className="card-hover h-full cursor-pointer border-border/60 hover:border-accent/30">
                    <CardContent className="p-6 flex flex-col items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${svc.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{svc.label}</h3>
                        <p className="text-sm text-muted-foreground">{svc.desc}</p>
                      </div>
                      <div className="mt-auto flex items-center text-sm font-medium text-accent">
                        Get Started <ArrowRight className="ml-1 w-3.5 h-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest News */}
      {latestNews.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Badge variant="outline" className="mb-2 text-accent border-accent/30">Latest News</Badge>
                <h2 className="font-serif text-3xl font-bold text-foreground">Press Releases</h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/press-releases">View All <ArrowRight className="ml-1 w-4 h-4" /></Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {latestNews.map((pr) => (
                <Link key={pr.id} href={`/press-releases/${pr.id}`}>
                  <Card className="card-hover h-full cursor-pointer border-border/60">
                    <CardContent className="p-5">
                      <div className="text-xs text-muted-foreground mb-2">
                        {pr.publishedAt ? format(new Date(pr.publishedAt), "MMMM d, yyyy") : ""}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2 leading-snug">{pr.title}</h3>
                      {pr.summary && <p className="text-sm text-muted-foreground line-clamp-3">{pr.summary}</p>}
                      <div className="mt-3 flex items-center text-sm font-medium text-accent">
                        Read More <ChevronRight className="ml-0.5 w-3.5 h-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Emergency Contact Banner */}
      <section className="bg-destructive/5 border-y border-destructive/20 py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Emergency? Call 911</div>
                <div className="text-sm text-muted-foreground">For non-emergencies, contact our office at (213) 974-3512</div>
              </div>
            </div>
            <Button asChild className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shrink-0">
              <Link href="/contact">Contact Our Office</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
