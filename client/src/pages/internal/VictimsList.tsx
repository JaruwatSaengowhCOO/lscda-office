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
import { Plus, Search, Heart, Shield } from "lucide-react";
import { toast } from "sonner";

export default function VictimsList() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", caseId: "", contactInfo: "", protectionOrderStatus: "none" as any, compensationStatus: "pending" as any, notes: "" });
  const { data, isLoading, refetch } = trpc.victims.list.useQuery();
  const { data: cases } = trpc.cases.list.useQuery({ status: undefined });
  const createVictim = trpc.victims.create.useMutation({
    onSuccess: () => { toast.success("Victim record created"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Victim Services</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data?.length ?? 0} victim records</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-gradient text-white"><Plus className="w-4 h-4 mr-2" />Add Victim Record</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add Victim Record</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createVictim.mutate({ ...form, caseId: parseInt(form.caseId) || 1, firstName: form.firstName, lastName: form.lastName }); }} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} required /></div>
                  <div className="space-y-1.5"><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} required /></div>
                </div>
                <div className="space-y-1.5">
                  <Label>Associated Case</Label>
                  <Select value={form.caseId} onValueChange={v => setForm(f => ({...f, caseId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select case..." /></SelectTrigger>
                    <SelectContent><SelectItem value="">None</SelectItem>{(cases ?? []).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.caseNumber} — {c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Contact Information</Label><Input placeholder="Phone or email" value={form.contactInfo} onChange={e => setForm(f => ({...f, contactInfo: e.target.value}))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Protection Order</Label>
                    <Select value={form.protectionOrderStatus} onValueChange={v => setForm(f => ({...f, protectionOrderStatus: v as any}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Compensation Status</Label>
                    <Select value={form.compensationStatus} onValueChange={v => setForm(f => ({...f, compensationStatus: v as any}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="bg-navy-gradient text-white flex-1" disabled={createVictim.isPending}>{createVictim.isPending ? "Adding..." : "Add Record"}</Button>
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
              <Input placeholder="Search victims..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Protection Order</TableHead>
                <TableHead>Compensation</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map(i => <TableRow key={i}>{[1,2,3,4].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
              ) : !data?.length ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground"><Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />No victim records found</TableCell></TableRow>
              ) : (
                data.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.firstName} {v.lastName}</TableCell>
                    <TableCell>
                      <Badge variant={v.hasProtectionOrder ? "default" : "outline"} className="text-xs">
                        {v.hasProtectionOrder ? "Active" : "None"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.compensationStatus === "paid" ? "default" : "secondary"} className="text-xs capitalize">
                        {v.compensationStatus?.replace("_"," ") ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.phone ?? "—"}</TableCell>
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
