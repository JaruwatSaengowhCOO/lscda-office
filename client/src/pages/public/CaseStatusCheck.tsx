import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Search, AlertCircle } from "lucide-react";
import { useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  investigation: "Under Investigation", case_review: "Case Review", filed: "Filed",
  arraignment: "Arraignment", preliminary_hearing: "Preliminary Hearing",
  trial: "Trial", sentencing: "Sentencing", closed: "Closed", dismissed: "Dismissed",
};

export default function CaseStatusCheck() {
  const [caseNumber, setCaseNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, refetch } = trpc.public.checkCaseStatus.useQuery(
    { caseNumber: searchQuery },
    { enabled: !!searchQuery }
  );
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (caseNumber.trim()) setSearchQuery(caseNumber.trim());
  };
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Public Service</Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Check Case Status</h1>
          <p className="text-white/70 max-w-2xl">Look up the status of a publicly accessible case using the case number.</p>
        </div>
      </section>
      <section className="py-12 bg-background">
        <div className="container max-w-2xl">
          <Card className="border-border/60 mb-6">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Case Number</Label>
                  <Input placeholder="e.g. LSCDA-2026-XXXXXX" value={caseNumber} onChange={e => setCaseNumber(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Enter the full case number as provided by the court or our office.</p>
                </div>
                <Button type="submit" className="w-full bg-navy-gradient text-white" disabled={isLoading || !caseNumber.trim()}>
                  <Search className="w-4 h-4 mr-2" />{isLoading ? "Searching..." : "Search"}
                </Button>
              </form>
            </CardContent>
          </Card>
          {searchQuery && !isLoading && (
            data ? (
              <Card className="border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0"><Scale className="w-5 h-5 text-accent" /></div>
                    <div>
                      <div className="text-sm text-muted-foreground">Case Number</div>
                      <div className="font-mono font-semibold text-foreground">{data.caseNumber}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div><div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Case Title</div><div className="font-medium">{data.title}</div></div>
                    <div><div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Current Status</div><Badge className={`status-${data.status}`}>{STATUS_LABELS[data.status] ?? data.status}</Badge></div>
                    {data.court && <div><div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Court</div><div className="text-sm">{data.court}</div></div>}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Case Not Found</p>
                  <p className="text-sm text-muted-foreground mt-1">No public case found with that number. Please verify the case number and try again.</p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
