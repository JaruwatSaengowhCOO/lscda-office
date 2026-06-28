'use client';

import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Shield } from "lucide-react";
import { useState } from "react";
import { DA_ROLE_LABELS } from "../../../../shared/permissions";
import type { DaRole } from "../../../../shared/permissions";

export default function ProsecutorsList() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { data, isLoading } = trpc.users.list.useQuery();
  const filtered = (data ?? []).filter(u =>
    (u.name ?? "").toLowerCase().includes(search.toLowerCase()) &&
    (roleFilter === "all" || (u as any).daRole === roleFilter)
  );
  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Prosecutors</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data?.length ?? 0} Prosecutors members</p>
          </div>
        </div>
        <Card className="border-border/60">
          <CardContent className="p-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search staff..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(DA_ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>DA Role</TableHead>
                <TableHead>System Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map(i => <TableRow key={i}>{[1,2,3,4].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
              ) : !filtered.length ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground"><Users className="w-8 h-8 mx-auto mb-2 opacity-30" />No staff found</TableCell></TableRow>
              ) : (
                filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email ?? "—"}</TableCell>
                    <TableCell>
                      {(u as any).daRole ? (
                        <Badge variant="secondary" className="text-xs">{DA_ROLE_LABELS[(u as any).daRole as DaRole] ?? (u as any).daRole}</Badge>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "outline"} className="text-xs capitalize">{u.role}</Badge>
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
