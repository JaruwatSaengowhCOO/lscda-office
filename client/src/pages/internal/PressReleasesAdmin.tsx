import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Newspaper, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PressReleasesAdmin() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", summary: "", content: "", tags: "", isPublished: false });
  const { data, isLoading, refetch } = trpc.content.pressReleases.useQuery();
  const create = trpc.content.createPressRelease.useMutation({
    onSuccess: () => { toast.success("Press release created"); setOpen(false); setForm({ title: "", summary: "", content: "", tags: "", isPublished: false }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.content.updatePressRelease.useMutation({
    onSuccess: () => { toast.success("Deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const filtered = (data ?? []).filter(pr => pr.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-foreground">Press Releases (Admin)</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-gradient text-white"><Plus className="w-4 h-4 mr-2" />New Press Release</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create Press Release</DialogTitle></DialogHeader>
              <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); create.mutate(form); }} className="space-y-4 mt-2">
                <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required /></div>
                <div className="space-y-1.5"><Label>Summary</Label><Input placeholder="Brief summary" value={form.summary} onChange={e => setForm(f => ({...f, summary: e.target.value}))} /></div>
                <div className="space-y-1.5"><Label>Content *</Label><Textarea rows={8} value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} required /></div>
                <div className="space-y-1.5"><Label>Tags</Label><Input placeholder="Comma-separated" value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} /></div>
                <div className="flex items-center gap-3"><Switch checked={form.isPublished} onCheckedChange={v => setForm(f => ({...f, isPublished: v}))} /><Label>Publish immediately</Label></div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="bg-navy-gradient text-white flex-1" disabled={create.isPending}>{create.isPending ? "Creating..." : "Create"}</Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Card className="border-border/60">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Published</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? [1,2,3].map(i => <TableRow key={i}>{[1,2,3,4].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>) :
              !filtered.length ? <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground"><Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />No press releases</TableCell></TableRow> :
              filtered.map((pr: any) => (
                <TableRow key={pr.id}>
                  <TableCell className="font-medium max-w-64 truncate">{pr.title}</TableCell>
                  <TableCell><Badge variant={pr.isPublished ? "default" : "secondary"} className="text-xs">{pr.isPublished ? "Published" : "Draft"}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{pr.publishedAt ? format(new Date(pr.publishedAt), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" className="text-destructive" onClick={() => del.mutate({ id: pr.id })}><Trash2 className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </InternalLayout>
  );
}
