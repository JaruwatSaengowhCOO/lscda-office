import PublicLayout from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, ExternalLink } from "lucide-react";

const contacts = [
  { title: "Main Office", phone: "(213) 974-3512", email: "da@lscda.gov", address: "210 W Temple St, Suite 1800, Los Santos, SA 90012", hours: "Mon–Fri 8:00 AM – 5:00 PM" },
  { title: "Victim Services", phone: "(213) 974-3514", email: "victims@lscda.gov", address: "210 W Temple St, Suite 1700, Los Santos, SA 90012", hours: "Mon–Fri 8:00 AM – 5:00 PM" },
  { title: "Press & Media", phone: "(213) 974-3516", email: "press@lscda.gov", address: "210 W Temple St, Suite 1800, Los Santos, SA 90012", hours: "Mon–Fri 9:00 AM – 4:00 PM" },
];

export default function Contact() {
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Contact</Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-white/70 max-w-2xl">Reach out to the Los Santos County District Attorney's Office. For emergencies, always call 911.</p>
        </div>
      </section>
      <section className="py-12 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {contacts.map(c => (
              <Card key={c.title} className="card-hover border-border/60">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4 text-foreground">{c.title}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-accent shrink-0" /><a href={`tel:${c.phone}`} className="hover:text-accent transition-colors">{c.phone}</a></div>
                    <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-accent shrink-0" /><a href={`mailto:${c.email}`} className="hover:text-accent transition-colors">{c.email}</a></div>
                    <div className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" /><span className="text-muted-foreground">{c.address}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-accent shrink-0" /><span className="text-muted-foreground">{c.hours}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Emergency</h3>
                <p className="text-muted-foreground">If you are in immediate danger or witnessing a crime in progress, please call <strong className="text-foreground">911</strong> immediately. Do not contact this office for emergencies.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
