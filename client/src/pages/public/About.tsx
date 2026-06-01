import PublicLayout from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Target, Eye, Heart, Shield, Award } from "lucide-react";

const values = [
  { icon: Scale, title: "Justice", desc: "We pursue fair and impartial justice for all, regardless of background or circumstance." },
  { icon: Shield, title: "Integrity", desc: "We uphold the highest ethical standards in all our prosecutorial decisions." },
  { icon: Eye, title: "Transparency", desc: "We maintain open communication with the public and those we serve." },
  { icon: Heart, title: "Compassion", desc: "We treat victims with dignity, respect, and sensitivity throughout the legal process." },
  { icon: Target, title: "Excellence", desc: "We strive for excellence in every case we prosecute and every service we provide." },
  { icon: Award, title: "Accountability", desc: "We hold ourselves to the same standards we expect of others." },
];

export default function About() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-navy-gradient text-white py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">About Us</Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">About the District Attorney's Office</h1>
          <p className="text-white/70 max-w-2xl text-lg">
            Serving the residents of Los Santos County with integrity, dedication, and an unwavering commitment to justice since 1950.
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-6">Our Office</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  The Los Santos County District Attorney's Office is the largest prosecutorial office in the state, responsible for prosecuting all criminal violations of state law occurring within Los Santos County.
                </p>
                <p>
                  Led by the District Attorney, our office employs over 240 dedicated professionals including prosecutors, investigators, victim advocates, and support staff who work together to ensure justice is served.
                </p>
                <p>
                  We are committed to a balanced approach to criminal justice — one that holds offenders accountable while treating all individuals with fairness and dignity, and that prioritizes the needs of crime victims throughout the legal process.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <Card className="border-border/60">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3">District Attorney</h3>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-navy-gradient flex items-center justify-center shrink-0">
                      <Scale className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Hon. Michael A. Torres</div>
                      <div className="text-sm text-muted-foreground">District Attorney, Los Santos County</div>
                      <p className="text-sm text-muted-foreground mt-2">
                        DA Torres has served the county for over 20 years, bringing extensive experience in complex criminal prosecutions and a deep commitment to community safety.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 gap-4">
                {[{ label: "Prosecutors", value: "120+" }, { label: "Investigators", value: "45+" }, { label: "Support Staff", value: "75+" }, { label: "Annual Cases", value: "8,000+" }].map(s => (
                  <Card key={s.label} className="border-border/60">
                    <CardContent className="p-4 text-center">
                      <div className="font-serif text-2xl font-bold text-accent">{s.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-muted/40">
        <div className="container">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">Our Values</Badge>
            <h2 className="font-serif text-3xl font-bold">What We Stand For</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <Card key={v.title} className="card-hover border-border/60">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Divisions */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">Our Divisions</Badge>
            <h2 className="font-serif text-3xl font-bold">Specialized Units</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: "Major Crimes Division", desc: "Handles homicides, serious violent crimes, and high-profile cases." },
              { title: "Narcotics Division", desc: "Prosecutes drug trafficking, manufacturing, and distribution offenses." },
              { title: "Fraud & Corruption Unit", desc: "Investigates white-collar crime, public corruption, and financial fraud." },
              { title: "Domestic Violence Unit", desc: "Specializes in domestic violence, sexual assault, and stalking cases." },
              { title: "Juvenile Division", desc: "Handles cases involving juvenile offenders with a focus on rehabilitation." },
              { title: "Victim Services Bureau", desc: "Provides comprehensive support and advocacy for crime victims." },
            ].map((div) => (
              <Card key={div.title} className="card-hover border-border/60">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-2">{div.title}</h3>
                  <p className="text-sm text-muted-foreground">{div.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
