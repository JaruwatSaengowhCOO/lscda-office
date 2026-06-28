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
import { AlertTriangle, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const COMPLAINT_TYPES = ["citizen_complaint","officer_misconduct","prosecutor_misconduct","administrative_complaint"];
const COMPLAINT_STATUSES = ["open","under_review","resolved","dismissed"];
const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  under_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  dismissed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function ComplaintsList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ complainantName: "", complainantContact: "", type: "citizen_complaint" as any, subject: "", description: "" });
  const { data, isLoading, refetch } = trpc.complaints.list.useQuery({ status: statusFilter === "all" ? undefined : statusFilter as any });
  const createComplaint = trpc.complaints.submitPublic.useMutation({
    onSuccess: () => { toast.success("Complaint recorded"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateStatus = trpc.complaints.update.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const filtered = (data ?? []).filter(c =>
    (c.subject ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.complainantName ?? "").toLowerCase().includes(search.toLowerCase())
  );
  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Complaints & Internal Affairs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data?.length ?? 0} complaints</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-gradient text-white"><AlertTriangle className="w-4 h-4 mr-2" />Record Complaint</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Record New Complaint</DialogTitle></DialogHeader>
              <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); createComplaint.mutate(form); }} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Complainant Name</Label><Input value={form.complainantName} onChange={e => setForm(f => ({...f, complainantName: e.target.value}))} /></div>
                  <div className="space-y-1.5"><Label>Contact</Label><Input placeholder="Phone or email" value={form.complainantContact} onChange={e => setForm(f => ({...f, complainantContact: e.target.value}))} /></div>
                </div>
                <div className="space-y-1.5">
                  <Label>Complaint Type *</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({...f, complaintType: v as any}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COMPLAINT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Subject *</Label><Input placeholder="Brief subject" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} required /></div>
                <div className="space-y-1.5"><Label>Description *</Label><Textarea rows={4} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required /></div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="bg-navy-gradient text-white flex-1" disabled={createComplaint.isPending}>{createComplaint.isPending ? "Recording..." : "Record Complaint"}</Button>
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
              <Input placeholder="Search complaints..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {COMPLAINT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Complainant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map(i => <TableRow key={i}>{[1,2,3,4,5,6].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
              ) : !filtered.length ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />No complaints found</TableCell></TableRow>
              ) : (
                filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-40 truncate">{c.subject}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{c.type?.replace(/_/g," ")}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.complainantName ?? "Anonymous"}</TableCell>
                    <TableCell><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? ""}`}>{c.status.replace("_"," ")}</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell>
                      <Select value={c.status} onValueChange={v => updateStatus.mutate({ id: c.id, status: v as any })}>
                        <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{COMPLAINT_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_"," ")}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
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
