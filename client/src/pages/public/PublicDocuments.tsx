import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, File } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  form: "Forms", policy: "Policies", template: "Templates", report: "Reports", other: "Other",
};

export default function PublicDocuments() {
  const { data, isLoading } = trpc.public.documents.useQuery();
  const downloadDoc = trpc.public.downloadDocument.useMutation({
    onSuccess: (result) => {
      if (result?.url) { window.open(result.url, "_blank"); }
    },
    onError: (e) => toast.error(e.message),
  });
  const grouped = (data ?? []).reduce((acc, doc) => {
    const cat = doc.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {} as Record<string, typeof data>);
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Resources</Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Public Documents</h1>
          <p className="text-white/70 max-w-2xl">Download public forms, policies, and documents from the District Attorney's Office.</p>
        </div>
      </section>
      <section className="py-12 bg-background">
        <div className="container max-w-4xl">
          {isLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : !data?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No public documents available.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([cat, docs]) => (
                <div key={cat}>
                  <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <File className="w-5 h-5 text-accent" />{CATEGORY_LABELS[cat] ?? cat}
                  </h2>
                  <div className="space-y-2">
                    {(docs ?? []).map(doc => (
                      <Card key={doc.id} className="border-border/60">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">{doc.title}</div>
                            {doc.description && <div className="text-sm text-muted-foreground truncate">{doc.description}</div>}
                          </div>
                          <Button size="sm" variant="outline" onClick={() => downloadDoc.mutate({ id: doc.id })} disabled={downloadDoc.isPending} className="shrink-0">
                            <Download className="w-4 h-4 mr-1" />Download
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
