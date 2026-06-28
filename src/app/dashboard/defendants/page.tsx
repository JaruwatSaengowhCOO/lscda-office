'use client';

import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DefendantsList() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", dateOfBirth: "", address: "", gangAffiliation: "", notes: "" });
  const { data, isLoading, refetch } = trpc.defendants.list.useQuery({ search: search || undefined });
  const createDefendant = trpc.defendants.create.useMutation({
    onSuccess: () => { toast.success("Defendant added"); setOpen(false); setForm({ firstName: "", lastName: "", dateOfBirth: "", address: "", gangAffiliation: "", notes: "" }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Defendant Database</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data?.length ?? 0} records</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-gradient text-white"><Plus className="w-4 h-4 mr-2" />Add Defendant</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add New Defendant</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createDefendant.mutate(form); }} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} required /></div>
                  <div className="space-y-1.5"><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} required /></div>
                </div>
                <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({...f, dateOfBirth: e.target.value}))} /></div>
                <div className="space-y-1.5"><Label>Address</Label><Input placeholder="Current address" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} /></div>
                <div className="space-y-1.5"><Label>Gang Affiliation</Label><Input placeholder="If applicable" value={form.gangAffiliation} onChange={e => setForm(f => ({...f, gangAffiliation: e.target.value}))} /></div>
                <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="bg-navy-gradient text-white flex-1" disabled={createDefendant.isPending}>{createDefendant.isPending ? "Adding..." : "Add Defendant"}</Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Gang Affiliation</TableHead>
                <TableHead>Address</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map(i => <TableRow key={i}>{[1,2,3,4,5].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
              ) : !data?.length ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground"><Users className="w-8 h-8 mx-auto mb-2 opacity-30" />No defendants found</TableCell></TableRow>
              ) : (
                data.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.firstName} {d.lastName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.dob ? format(new Date(d.dob), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell>{d.gangAffiliation ? <Badge variant="destructive" className="text-xs">{d.gangAffiliation}</Badge> : <span className="text-muted-foreground text-sm">—</span>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-40 truncate">{d.address ?? "—"}</TableCell>
                    <TableCell><Button asChild variant="ghost" size="sm" className="text-accent"><Link href={`/dashboard/defendants/${d.id}`}>View</Link></Button></TableCell>
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
