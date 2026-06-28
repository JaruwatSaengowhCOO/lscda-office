'use client';

import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Briefcase, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CareersAdmin() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", department: "", location: "", type: "full_time" as any, salary: "", description: "", requirements: "", closingDate: "", isActive: true });
  const { data, isLoading, refetch } = trpc.content.careers.useQuery();
  const create = trpc.content.createCareer.useMutation({
    onSuccess: () => { toast.success("Position posted"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.content.createCareer.useMutation({
    onSuccess: () => { toast.success("Deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-foreground">Career Postings (Admin)</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-gradient text-white"><Plus className="w-4 h-4 mr-2" />Post Position</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Post New Position</DialogTitle></DialogHeader>
              <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); create.mutate({ ...form, closingDate: form.closingDate ? new Date(form.closingDate).getTime() : undefined }); }} className="space-y-4 mt-2">
                <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Department</Label><Input value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} /></div>
                  <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v as any}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Salary</Label><Input placeholder="e.g. $80,000 - $100,000" value={form.salary} onChange={e => setForm(f => ({...f, salary: e.target.value}))} /></div>
                </div>
                <div className="space-y-1.5"><Label>Closing Date</Label><Input type="date" value={form.closingDate} onChange={e => setForm(f => ({...f, closingDate: e.target.value}))} /></div>
                <div className="space-y-1.5"><Label>Description *</Label><Textarea rows={4} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required /></div>
                <div className="space-y-1.5"><Label>Requirements</Label><Textarea rows={3} value={form.requirements} onChange={e => setForm(f => ({...f, requirements: e.target.value}))} /></div>
                <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({...f, isActive: v}))} /><Label>Active Posting</Label></div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="bg-navy-gradient text-white flex-1" disabled={create.isPending}>{create.isPending ? "Posting..." : "Post Position"}</Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Card className="border-border/60">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Department</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Closes</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? [1,2,3].map(i => <TableRow key={i}>{[1,2,3,4,5,6].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>) :
              !data?.length ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />No positions posted</TableCell></TableRow> :
              data.map((job: any) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{job.department ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{job.type?.replace("_"," ")}</Badge></TableCell>
                  <TableCell><Badge variant={job.isActive ? "default" : "secondary"} className="text-xs">{job.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{job.closingDate ? format(new Date(job.closingDate), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" className="text-destructive" onClick={() => toast.info('Delete feature coming soon')}><Trash2 className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </InternalLayout>
  );
}
