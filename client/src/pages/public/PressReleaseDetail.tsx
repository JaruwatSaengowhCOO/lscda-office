import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function PressReleaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: pr, isLoading } = trpc.public.pressReleaseById.useQuery({ id: parseInt(id ?? "0") });
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-12">
        <div className="container max-w-4xl">
          <Button asChild variant="ghost" className="text-white/70 hover:text-white mb-4 -ml-2">
            <Link href="/press-releases"><ArrowLeft className="w-4 h-4 mr-2" />Back to Press Releases</Link>
          </Button>
          {isLoading ? <Skeleton className="h-10 w-3/4 bg-white/20" /> : (
            <h1 className="font-serif text-3xl md:text-4xl font-bold">{pr?.title}</h1>
          )}
        </div>
      </section>
      <section className="py-12 bg-background">
        <div className="container max-w-4xl">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-5 w-full" />)}</div>
          ) : !pr ? (
            <div className="text-center py-16 text-muted-foreground">Press release not found.</div>
          ) : (
            <article className="prose prose-lg max-w-none dark:prose-invert">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 not-prose">
                <Calendar className="w-4 h-4" />
                {pr.publishedAt ? format(new Date(pr.publishedAt), "MMMM d, yyyy") : ""}
                {pr.tags && <Badge variant="secondary" className="ml-2">{pr.tags}</Badge>}
              </div>
              {pr.summary && <p className="text-lg text-muted-foreground font-medium mb-6 not-prose">{pr.summary}</p>}
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">{pr.content}</div>
            </article>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
