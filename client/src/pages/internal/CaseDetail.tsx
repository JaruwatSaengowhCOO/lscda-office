import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Scale, Calendar, FileText, Users, Upload, Edit } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRef, useState } from "react";

const STATUS_OPTIONS = ["investigation","case_review","filed","arraignment","preliminary_hearing","trial","sentencing","closed","dismissed"];

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const caseId = parseInt(id ?? "0");
  const { data: caseData, isLoading, refetch } = trpc.cases.get.useQuery({ id: caseId });
  // hearings and evidence come from caseData
  
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const updateStatus = trpc.cases.update.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const uploadEvidence = trpc.evidence.upload.useMutation({
    onSuccess: () => { toast.success("Evidence uploaded"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1] ?? "";
        await uploadEvidence.mutateAsync({ caseId, fileName: file.name, fileBase64: base64, mimeType: file.type, fileSize: file.size, type: "document" });
      };
      reader.readAsDataURL(file);
    } catch (err: any) { toast.error(err.message ?? "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <Button asChild variant="ghost" className="-ml-2">
          <Link href="/dashboard/cases"><ArrowLeft className="w-4 h-4 mr-2" />Back to Cases</Link>
        </Button>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : !caseData ? (
          <div className="text-center py-16 text-muted-foreground">Case not found.</div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="w-5 h-5 text-accent" />
                  <span className="font-mono text-sm text-muted-foreground">{caseData.caseNumber}</span>
                  <Badge className={`status-${caseData.status} text-xs`}>{caseData.status.replace("_"," ")}</Badge>
                </div>
                <h1 className="font-serif text-2xl font-bold text-foreground">{caseData.title}</h1>
              </div>
              <div className="flex gap-2 shrink-0">
                <Select value={caseData.status} onValueChange={v => updateStatus.mutate({ id: caseId, status: v as any })}>
                  <SelectTrigger className="w-44 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Court", value: caseData.court ?? "—" },
                { label: "Arresting Agency", value: caseData.arrestingAgency ?? "—" },
                { label: "Filed", value: caseData.filedDate ? format(new Date(caseData.filedDate), "MMM d, yyyy") : "—" },
              ].map(item => (
                <Card key={item.label} className="border-border/60">
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</div>
                    <div className="font-medium text-sm">{item.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {caseData.description && (
              <Card className="border-border/60">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{caseData.description}</p>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="hearings">
              <TabsList>
                <TabsTrigger value="hearings"><Calendar className="w-3.5 h-3.5 mr-1.5" />Hearings ({(caseData as any)?.hearings?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="evidence"><FileText className="w-3.5 h-3.5 mr-1.5" />Evidence ({(caseData as any)?.evidence?.length ?? 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="hearings" className="mt-4">
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    {!(caseData as any)?.hearings?.length ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">No hearings scheduled</div>
                    ) : (
                      <div className="space-y-3">
                        {(caseData as any)?.hearings?.map((h: any) => (
                          <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Calendar className="w-4 h-4 text-green-600 shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{h.hearingType}</div>
                              <div className="text-xs text-muted-foreground">{format(new Date(h.scheduledAt), "MMMM d, yyyy 'at' h:mm a")}{h.courtroom ? ` · ${h.courtroom}` : ""}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">{h.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evidence" className="mt-4">
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex justify-end mb-3">
                      <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
                      <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                        <Upload className="w-4 h-4 mr-1.5" />{uploading ? "Uploading..." : "Upload Evidence"}
                      </Button>
                    </div>
                    {!(caseData as any)?.evidence?.length ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">No evidence attached</div>
                    ) : (
                      <div className="space-y-2">
                        {(caseData as any)?.evidence?.map((ev: any) => (
                          <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <FileText className="w-4 h-4 text-accent shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{ev.fileName}</div>
                              <div className="text-xs text-muted-foreground font-mono">{ev.referenceNumber}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">{ev.type}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </InternalLayout>
  );
}
