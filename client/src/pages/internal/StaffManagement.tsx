import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Edit } from "lucide-react";
import { toast } from "sonner";
import { DA_ROLE_LABELS } from "../../../../shared/permissions";
import type { DaRole } from "../../../../shared/permissions";

export default function StaffManagement() {
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<any>(null);
  const [editRole, setEditRole] = useState<string>("");
  const { data, isLoading, refetch } = trpc.users.list.useQuery();
  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); setEditUser(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const filtered = (data ?? []).filter(u => (u.name ?? "").toLowerCase().includes(search.toLowerCase()) || (u.email ?? "").toLowerCase().includes(search.toLowerCase()));
  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Staff Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage staff roles and permissions</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search staff..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Card className="border-border/60">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>DA Role</TableHead><TableHead>System Role</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? [1,2,3].map(i => <TableRow key={i}>{[1,2,3,4,5].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>) :
              !filtered.length ? <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground"><Users className="w-8 h-8 mx-auto mb-2 opacity-30" />No staff found</TableCell></TableRow> :
              filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email ?? "—"}</TableCell>
                  <TableCell>{(u as any).daRole ? <Badge variant="secondary" className="text-xs">{DA_ROLE_LABELS[(u as any).daRole as DaRole] ?? (u as any).daRole}</Badge> : <span className="text-muted-foreground text-sm">—</span>}</TableCell>
                  <TableCell><Badge variant={u.role === "admin" ? "default" : "outline"} className="text-xs capitalize">{u.role}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { setEditUser(u); setEditRole((u as any).daRole ?? ""); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <Dialog open={!!editUser} onOpenChange={v => !v && setEditUser(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Edit Role: {editUser?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>DA Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {Object.entries(DA_ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button className="bg-navy-gradient text-white flex-1" onClick={() => updateRole.mutate({ userId: editUser.id, daRole: editRole as DaRole || undefined })} disabled={updateRole.isPending}>{updateRole.isPending ? "Saving..." : "Save"}</Button>
                <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </InternalLayout>
  );
}
