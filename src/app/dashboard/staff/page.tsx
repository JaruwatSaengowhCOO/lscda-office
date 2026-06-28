'use client';

import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Search, UserPlus, Edit, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { DA_ROLE_LABELS, DA_ROLE_ORDER, getPermissions } from "../../../../shared/permissions";
import type { DaRole } from "../../../../shared/permissions";
import { useAuth } from "@/_core/hooks/useAuth";

const DA_ROLES = DA_ROLE_ORDER;

type User = {
  id: number;
  name: string | null;
  email: string | null;
  username: string | null;
  role: "user" | "admin";
  daRole: string | null;
  department: string | null;
  badgeNumber: string | null;
  phone: string | null;
  isActive: boolean;
};

function UserFormDialog({
  open,
  onClose,
  user,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  onSaved: () => void;
}) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    username: user?.username ?? "",
    password: "",
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: (user?.role ?? "user") as "user" | "admin",
    daRole: (user?.daRole ?? "intern") as DaRole,
    department: user?.department ?? "",
    badgeNumber: user?.badgeNumber ?? "",
    phone: user?.phone ?? "",
  });

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => { toast.success("สร้างผู้ใช้สำเร็จ"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => { toast.success("บันทึกสำเร็จ"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateMutation.mutate({
        userId: user!.id,
        name: form.name,
        email: form.email || undefined,
        role: form.role,
        daRole: form.daRole,
        department: form.department || undefined,
        badgeNumber: form.badgeNumber || undefined,
        phone: form.phone || undefined,
      });
    } else {
      createMutation.mutate({
        username: form.username,
        password: form.password,
        name: form.name,
        email: form.email || undefined,
        role: form.role,
        daRole: form.daRole,
        department: form.department || undefined,
        badgeNumber: form.badgeNumber || undefined,
        phone: form.phone || undefined,
      });
    }
  };

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "แก้ไขผู้ใช้" : "สร้างผู้ใช้ใหม่"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ชื่อผู้ใช้ *</Label>
                <Input value={form.username} onChange={e => set("username")(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>รหัสผ่าน *</Label>
                <Input type="password" value={form.password} onChange={e => set("password")(e.target.value)} required minLength={6} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ชื่อ-นามสกุล *</Label>
              <Input value={form.name} onChange={e => set("name")(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล</Label>
              <Input type="email" value={form.email} onChange={e => set("email")(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ตำแหน่ง (DA Role)</Label>
              <Select value={form.daRole} onValueChange={v => set("daRole")(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DA_ROLES.map(r => <SelectItem key={r} value={r}>{DA_ROLE_LABELS[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>System Role</Label>
              <Select value={form.role} onValueChange={v => set("role")(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>แผนก</Label>
              <Input value={form.department} onChange={e => set("department")(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>รหัสประจำตัว</Label>
              <Input value={form.badgeNumber} onChange={e => set("badgeNumber")(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>โทรศัพท์</Label>
              <Input value={form.phone} onChange={e => set("phone")(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const mutation = trpc.users.resetPassword.useMutation({
    onSuccess: () => { toast.success("รีเซ็ตรหัสผ่านสำเร็จ"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>รีเซ็ตรหัสผ่าน: {user.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label>รหัสผ่านใหม่</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => mutation.mutate({ userId: user.id, newPassword: password })} disabled={mutation.isPending || password.length < 6}>
              {mutation.isPending ? "กำลังบันทึก..." : "รีเซ็ต"}
            </Button>
            <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PermissionsDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const perms = getPermissions(user.daRole as DaRole | null);
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>สิทธิ์การใช้งาน: {user.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <p className="text-sm text-muted-foreground mb-3">
            ตำแหน่ง: <span className="font-medium text-foreground">{user.daRole ? DA_ROLE_LABELS[user.daRole as DaRole] : "—"}</span>
          </p>
          {perms.length === 0 ? (
            <p className="text-sm text-muted-foreground">ไม่มีสิทธิ์</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
              {perms.map(p => (
                <Badge key={p} variant="secondary" className="text-xs font-mono">{p}</Badge>
              ))}
            </div>
          )}
        </div>
        <Button variant="outline" className="mt-2 w-full" onClick={onClose}>ปิด</Button>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffManagement() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [permUser, setPermUser] = useState<User | null>(null);

  const { data, isLoading, refetch } = trpc.users.list.useQuery();
  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => { toast.success("บันทึกสำเร็จ"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const isAdmin = currentUser?.role === "admin";

  const filtered = (data ?? []).filter(u =>
    (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.username ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const activeUsers = filtered.filter(u => u.isActive);
  const inactiveUsers = filtered.filter(u => !u.isActive);

  const UserTable = ({ users }: { users: typeof filtered }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ชื่อ / ชื่อผู้ใช้</TableHead>
          <TableHead>อีเมล</TableHead>
          <TableHead>ตำแหน่ง</TableHead>
          <TableHead>System Role</TableHead>
          <TableHead>สถานะ</TableHead>
          <TableHead className="text-right">จัดการ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? [1, 2, 3].map(i => (
              <TableRow key={i}>
                {[1, 2, 3, 4, 5, 6].map(j => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))
          : users.length === 0
          ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                  ไม่พบผู้ใช้
                </TableCell>
              </TableRow>
            )
          : users.map(u => (
              <TableRow key={u.id} className={!u.isActive ? "opacity-50" : ""}>
                <TableCell>
                  <div className="font-medium">{u.name ?? "—"}</div>
                  {u.username && <div className="text-xs text-muted-foreground">@{u.username}</div>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email ?? "—"}</TableCell>
                <TableCell>
                  {u.daRole
                    ? <Badge variant="secondary" className="text-xs">{DA_ROLE_LABELS[u.daRole as DaRole] ?? u.daRole}</Badge>
                    : <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={u.role === "admin" ? "default" : "outline"} className="text-xs capitalize">{u.role}</Badge>
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Switch
                      checked={u.isActive}
                      onCheckedChange={v => updateMutation.mutate({ userId: u.id, isActive: v })}
                      disabled={u.id === currentUser?.id}
                    />
                  ) : (
                    <Badge variant={u.isActive ? "outline" : "secondary"} className="text-xs">
                      {u.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="ดูสิทธิ์" onClick={() => setPermUser(u as User)}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="แก้ไข" onClick={() => setEditUser(u as User)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="รีเซ็ตรหัสผ่าน" onClick={() => setResetUser(u as User)}>
                          <KeyRound className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );

  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">จัดการผู้ใช้งาน</h1>
            <p className="text-sm text-muted-foreground mt-0.5">บริหารจัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />สร้างผู้ใช้ใหม่
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="ค้นหาชื่อ, ชื่อผู้ใช้, อีเมล..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">ใช้งาน ({activeUsers.length})</TabsTrigger>
            <TabsTrigger value="inactive">ปิดใช้งาน ({inactiveUsers.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-3 border rounded-lg overflow-hidden">
            <UserTable users={activeUsers} />
          </TabsContent>
          <TabsContent value="inactive" className="mt-3 border rounded-lg overflow-hidden">
            <UserTable users={inactiveUsers} />
          </TabsContent>
        </Tabs>
      </div>

      <UserFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={refetch}
      />
      {editUser && (
        <UserFormDialog
          open
          onClose={() => setEditUser(null)}
          user={editUser}
          onSaved={refetch}
        />
      )}
      {resetUser && <ResetPasswordDialog user={resetUser} onClose={() => setResetUser(null)} />}
      {permUser && <PermissionsDialog user={permUser} onClose={() => setPermUser(null)} />}
    </InternalLayout>
  );
}
