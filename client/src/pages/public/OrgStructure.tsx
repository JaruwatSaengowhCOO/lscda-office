import PublicLayout from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const orgChart = [
  {
    role: "District Attorney",
    name: "Hon. Michael A. Torres",
    level: 0,
    children: [
      {
        role: "Chief Deputy DA",
        name: "Sarah J. Williams",
        level: 1,
        children: [
          { role: "Division Chief – Major Crimes", name: "Robert Chen", level: 2 },
          { role: "Division Chief – Narcotics", name: "Maria Santos", level: 2 },
          { role: "Division Chief – Fraud & Corruption", name: "James Park", level: 2 },
          { role: "Division Chief – Domestic Violence", name: "Lisa Thompson", level: 2 },
          { role: "Division Chief – Juvenile", name: "David Kim", level: 2 },
        ],
      },
      {
        role: "Chief of Staff",
        name: "Amanda Foster",
        level: 1,
        children: [
          { role: "Director – Victim Services", name: "Patricia Moore", level: 2 },
          { role: "Director – Investigations", name: "Thomas Reed", level: 2 },
          { role: "Director – Administration", name: "Jennifer Lee", level: 2 },
        ],
      },
    ],
  },
];

const staffRoles = [
  { title: "District Attorney", count: 1, desc: "Elected head of the office, responsible for all prosecutorial decisions." },
  { title: "Chief Deputy DA", count: 1, desc: "Second-in-command, oversees all prosecutorial divisions." },
  { title: "Division Chief", count: 5, desc: "Leads a specialized prosecutorial division." },
  { title: "Senior Prosecutor", count: 20, desc: "Handles complex and high-profile cases." },
  { title: "Deputy DA", count: 94, desc: "Prosecutes criminal cases at all levels." },
  { title: "Investigator", count: 45, desc: "Conducts investigations and gathers evidence." },
  { title: "Legal Clerk", count: 40, desc: "Provides administrative and legal support." },
  { title: "Victim Advocate", count: 25, desc: "Supports and assists crime victims throughout the process." },
  { title: "Intern", count: 10, desc: "Law students gaining practical experience." },
];

export default function OrgStructure() {
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Organization</Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Organizational Structure</h1>
          <p className="text-white/70 max-w-2xl text-lg">
            Our office is organized to efficiently serve the residents of Los Santos County with specialized divisions and dedicated teams.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold">Leadership Structure</h2>
          </div>
          {/* Simplified org chart */}
          <div className="max-w-4xl mx-auto">
            {/* DA */}
            <div className="flex justify-center mb-6">
              <Card className="border-accent/30 bg-accent/5 w-72">
                <CardContent className="p-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">District Attorney</div>
                  <div className="font-semibold text-foreground">Hon. Michael A. Torres</div>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-px h-6 bg-border" />
            </div>
            {/* Chief Deputy */}
            <div className="flex justify-center mb-6">
              <Card className="border-primary/20 bg-primary/5 w-72">
                <CardContent className="p-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Chief Deputy DA</div>
                  <div className="font-semibold text-foreground">Sarah J. Williams</div>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-px h-6 bg-border" />
            </div>
            {/* Divisions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {["Major Crimes", "Narcotics", "Fraud & Corruption", "Domestic Violence", "Juvenile", "Victim Services"].map((div) => (
                <Card key={div} className="border-border/60">
                  <CardContent className="p-3 text-center">
                    <div className="text-xs font-medium text-muted-foreground">Division Chief</div>
                    <div className="text-sm font-semibold text-foreground mt-0.5">{div}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/40">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold">Staff Roles & Responsibilities</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {staffRoles.map((role) => (
              <Card key={role.title} className="card-hover border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground text-sm">{role.title}</h3>
                    <Badge variant="secondary" className="text-xs shrink-0 ml-2">{role.count}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{role.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
