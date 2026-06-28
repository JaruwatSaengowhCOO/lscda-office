'use client';

import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, FileSearch, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const WARRANT_STATUSES = ["draft","pending_approval","issued","executed","expired"];
const WARRANT_TYPES: Array<"search_warrant" | "arrest_warrant" | "subpoena"> = ["arrest_warrant","search_warrant","subpoena"];
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700", pending_approval: "bg-amber-100 text-amber-700",
  issued: "bg-blue-100 text-blue-700", executed: "bg-green-100 text-green-700", expired: "bg-red-100 text-red-700",
};

export default function WarrantsList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ caseId: "", type: "arrest_warrant" as "search_warrant" | "arrest_warrant" | "subpoena", subject: "", description: "" });
  const { data, isLoading, refetch } = trpc.warrants.list.useQuery({ status: statusFilter === "all" ? undefined : statusFilter as any });
  const { data: cases } = trpc.cases.list.useQuery({ status: undefined });
  const createWarrant = trpc.warrants.create.useMutation({
    onSuccess: () => { toast.success("Warrant created"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const filtered = (data ?? []).filter(w =>
    (w.warrantNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (w.subject ?? "").toLowerCase().includes(search.toLowerCase())
  );
  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Warrant Tracking</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data?.length ?? 0} warrants</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-gradient text-white"><Plus className="w-4 h-4 mr-2" />New Warrant</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create New Warrant</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createWarrant.mutate({ type: form.type as any, caseId: parseInt(form.caseId) || undefined, subject: form.subject, description: form.description }); }} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Case *</Label>
                  <Select value={form.caseId} onValueChange={v => setForm(f => ({...f, caseId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select case..." /></SelectTrigger>
                    <SelectContent>{(cases ?? []).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.caseNumber} — {c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Warrant Type *</Label>
                    <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v as any}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{WARRANT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value="draft" onValueChange={() => {}}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{WARRANT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Target Name</Label><Input placeholder="Name of target" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="bg-navy-gradient text-white flex-1" disabled={createWarrant.isPending || !form.caseId}>{createWarrant.isPending ? "Creating..." : "Create Warrant"}</Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by warrant number or target..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {WARRANT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warrant #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map(i => <TableRow key={i}>{[1,2,3,4,5,6].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
              ) : !filtered.length ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><FileSearch className="w-8 h-8 mx-auto mb-2 opacity-30" />No warrants found</TableCell></TableRow>
              ) : (
                filtered.map(w => (
                  <TableRow key={w.id}>
                    <TableCell className="font-mono text-xs">{w.warrantNumber ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{w.type}</Badge></TableCell>
                    <TableCell className="font-medium text-sm">{w.subject ?? "—"}</TableCell>
                    <TableCell><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[w.status] ?? ""}`}>{w.status.replace("_"," ")}</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{w.issuedAt ? format(new Date(w.issuedAt), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{w.expiresAt ? format(new Date(w.expiresAt), "MMM d, yyyy") : "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </InternalLayout>
  );
}
