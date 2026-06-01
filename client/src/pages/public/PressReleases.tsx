import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Calendar, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function PressReleases() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = trpc.public.pressReleases.useQuery();
  const filtered = (data ?? []).filter(pr =>
    pr.title.toLowerCase().includes(search.toLowerCase()) ||
    (pr.summary ?? "").toLowerCase().includes(search.toLowerCase())
  );
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">News</Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Press Releases</h1>
          <p className="text-white/70 max-w-2xl">Official announcements from the Los Santos County District Attorney's Office.</p>
        </div>
      </section>
      <section className="py-12 bg-background">
        <div className="container max-w-4xl">
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search press releases..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {isLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><p className="text-lg">No press releases found.</p></div>
          ) : (
            <div className="space-y-4">
              {filtered.map(pr => (
                <Link key={pr.id} href={`/press-releases/${pr.id}`}>
                  <Card className="card-hover cursor-pointer border-border/60">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Calendar className="w-3.5 h-3.5" />
                            {pr.publishedAt ? format(new Date(pr.publishedAt), "MMMM d, yyyy") : ""}
                          </div>
                          <h2 className="font-semibold text-foreground mb-1 line-clamp-2">{pr.title}</h2>
                          {pr.summary && <p className="text-sm text-muted-foreground line-clamp-2">{pr.summary}</p>}
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
