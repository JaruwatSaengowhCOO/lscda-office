import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function Careers() {
  const { data, isLoading } = trpc.public.careers.useQuery();
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Join Our Team</Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Career Opportunities</h1>
          <p className="text-white/70 max-w-2xl">Join the Los Santos County District Attorney's Office and make a difference in your community.</p>
        </div>
      </section>
      <section className="py-12 bg-background">
        <div className="container max-w-4xl">
          {isLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
          ) : !data?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No open positions at this time.</p>
              <p className="text-sm mt-2">Please check back later or contact us for more information.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.map(job => (
                <Link key={job.id} href={`/careers/${job.id}`}>
                  <Card className="card-hover cursor-pointer border-border/60">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h2 className="font-semibold text-foreground mb-2">{job.title}</h2>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {job.department && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{job.department}</span>}
                            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
                            {job.type && <Badge variant="secondary" className="text-xs capitalize">{job.type.replace("_"," ")}</Badge>}
                          </div>
                          {job.salary && <p className="text-sm text-accent font-medium mt-2">{job.salary}</p>}
                          {job.closingDate && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />Closes: {format(new Date(job.closingDate), "MMMM d, yyyy")}</p>}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
