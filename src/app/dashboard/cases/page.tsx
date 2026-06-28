'use client';

import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Scale, Filter } from "lucide-react";
import { format } from "date-fns";
import { CASE_STATUS_LABELS } from "../../../../drizzle/schema";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  ...Object.entries(CASE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export default function CasesList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data, isLoading } = trpc.cases.list.useQuery({ status: statusFilter === "all" ? undefined : statusFilter as any });

  const filtered = (data ?? []).filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.caseNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Cases</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data?.length ?? 0} total cases</p>
          </div>
          <Button asChild className="bg-navy-gradient text-white">
            <Link href="/dashboard/cases/new"><Plus className="w-4 h-4 mr-2" />New Case</Link>
          </Button>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by title or case number..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44"><Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Court</TableHead>
                <TableHead>Filed</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i}>
                    {[1,2,3,4,5,6].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Scale className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No cases found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{c.caseNumber}</TableCell>
                    <TableCell className="font-medium max-w-48 truncate">{c.title}</TableCell>
                    <TableCell><Badge className={`status-${c.status} text-xs`}>{c.status.replace("_"," ")}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.court ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.filedDate ? format(new Date(c.filedDate), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm" className="text-accent">
                        <Link href={`/dashboard/cases/${c.id}`}>View</Link>
                      </Button>
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
