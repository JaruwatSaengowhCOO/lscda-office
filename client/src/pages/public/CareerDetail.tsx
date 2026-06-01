import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Briefcase, MapPin, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function CareerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = trpc.public.careerById.useQuery({ id: parseInt(id ?? "0") });
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-12">
        <div className="container max-w-4xl">
          <Button asChild variant="ghost" className="text-white/70 hover:text-white mb-4 -ml-2">
            <Link href="/careers"><ArrowLeft className="w-4 h-4 mr-2" />Back to Careers</Link>
          </Button>
          {isLoading ? <Skeleton className="h-10 w-3/4 bg-white/20" /> : (
            <h1 className="font-serif text-3xl md:text-4xl font-bold">{job?.title}</h1>
          )}
        </div>
      </section>
      <section className="py-12 bg-background">
        <div className="container max-w-4xl">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-5 w-full" />)}</div>
          ) : !job ? (
            <div className="text-center py-16 text-muted-foreground">Position not found.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h2 className="font-semibold text-lg mb-3">Job Description</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
                </div>
                {job.requirements && (
                  <div>
                    <h2 className="font-semibold text-lg mb-3">Requirements</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
                  </div>
                )}
                <div className="pt-4">
                  <Button asChild className="bg-navy-gradient text-white">
                    <Link href="/contact">Apply Now — Contact Our Office</Link>
                  </Button>
                </div>
              </div>
              <div>
                <Card className="border-border/60">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-semibold">Position Details</h3>
                    {job.department && <div className="flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4 text-accent" /><span>{job.department}</span></div>}
                    {job.location && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-accent" /><span>{job.location}</span></div>}
                    {job.type && <div className="flex items-center gap-2 text-sm"><Badge variant="secondary" className="capitalize">{job.type.replace("_"," ")}</Badge></div>}
                    {job.salary && <div className="flex items-center gap-2 text-sm"><DollarSign className="w-4 h-4 text-accent" /><span>{job.salary}</span></div>}
                    {job.closingDate && <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-accent" /><span>Closes {format(new Date(job.closingDate), "MMM d, yyyy")}</span></div>}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
