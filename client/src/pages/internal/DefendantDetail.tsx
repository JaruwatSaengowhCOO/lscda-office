import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Scale, User, MapPin, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function DefendantDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: defendant, isLoading } = trpc.defendants.get.useQuery({ id: parseInt(id ?? "0") });
  const { data: cases } = trpc.cases.list.useQuery({ search: undefined });
  return (
    <InternalLayout>
      <div className="p-6 space-y-5 max-w-4xl">
        <Button asChild variant="ghost" className="-ml-2">
          <Link href="/dashboard/defendants"><ArrowLeft className="w-4 h-4 mr-2" />Back to Defendants</Link>
        </Button>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : !defendant ? (
          <div className="text-center py-16 text-muted-foreground">Defendant not found.</div>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold">{defendant.firstName} {defendant.lastName}</h1>
                {defendant.gangAffiliation && <Badge variant="destructive" className="mt-1">{defendant.gangAffiliation}</Badge>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-border/60">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Personal Information</h3>
                  {defendant.dob && <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-accent" /><span>DOB: {format(new Date(defendant.dob), "MMMM d, yyyy")}</span></div>}
                  {defendant.address && <div className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 text-accent mt-0.5" /><span>{defendant.address}</span></div>}
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3">Criminal History</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{defendant.criminalHistory ?? "No prior criminal history recorded."}</p>
                </CardContent>
              </Card>
            </div>

            {defendant.notes && (
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                <CardContent className="p-4 flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">Notes</div>
                    <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-wrap">{defendant.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <h2 className="font-semibold text-lg mb-3">Associated Cases</h2>
              {!cases?.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm bg-muted/30 rounded-lg">No associated cases</div>
              ) : (
                <div className="space-y-2">
                  {(cases ?? []).filter((c: any) => true).map((c: any) => (
                    <Link key={c.id} href={`/dashboard/cases/${c.id}`}>
                      <Card className="card-hover cursor-pointer border-border/60">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Scale className="w-4 h-4 text-accent shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{c.title}</div>
                            <div className="text-xs text-muted-foreground font-mono">{c.caseNumber}</div>
                          </div>
                          <Badge className={`status-${c.status} text-xs`}>{c.status.replace("_"," ")}</Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </InternalLayout>
  );
}
