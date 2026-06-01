import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function PublicNotices() {
  const { data, isLoading } = trpc.public.notices.useQuery();
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Notices</Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Public Notices</h1>
          <p className="text-white/70 max-w-2xl">Official public notices from the Los Santos County District Attorney's Office.</p>
        </div>
      </section>
      <section className="py-12 bg-background">
        <div className="container max-w-4xl">
          {isLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
          ) : !data?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No public notices at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.map(notice => (
                <Card key={notice.id} className="border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {notice.publishedAt ? format(new Date(notice.publishedAt), "MMMM d, yyyy") : ""}
                      {notice.noticeType && <Badge variant="outline" className="text-xs">{notice.noticeType}</Badge>}
                    </div>
                    <h2 className="font-semibold text-foreground mb-2">{notice.title}</h2>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
                    {notice.expiresAt && (
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Expires: {format(new Date(notice.expiresAt), "MMMM d, yyyy")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
