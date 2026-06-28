'use client';

import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CASE_STATUSES, CASE_STATUS_LABELS } from "../../../../../drizzle/schema";
import type { CaseStatus } from "../../../../../drizzle/schema";

export default function NewCasePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    caseNumber: "",
    title: "",
    description: "",
    status: "investigation" as CaseStatus,
    priority: "medium" as "low" | "medium" | "high" | "critical",
    defendantName: "",
    leadProsecutorId: "" as string | "",
    assignedJudge: "",
    investigatingAgency: "",
    filingDate: "",
    court: "",
  });

  const { data: users } = trpc.users.listForAssignment.useQuery();

  const createCase = trpc.cases.create.useMutation({
    onSuccess: (data) => {
      toast.success("Case created successfully");
      router.push(`/dashboard/cases/${data.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.caseNumber) {
      toast.error("Case number and title are required");
      return;
    }

    createCase.mutate({
      caseNumber: form.caseNumber,
      title: form.title,
      description: form.description || undefined,
      status: form.status,
      priority: form.priority,
      defendantName: form.defendantName || undefined,
      leadProsecutorId: form.leadProsecutorId ? Number(form.leadProsecutorId) : undefined,
      assignedJudge: form.assignedJudge || undefined,
      investigatingAgency: form.investigatingAgency || undefined,
      filingDate: form.filingDate ? new Date(form.filingDate) : undefined,
      court: form.court || undefined,
    });
  };

  return (
    <InternalLayout>
      <div className="p-6 max-w-3xl">
        <Button asChild variant="ghost" className="mb-4 -ml-2">
          <Link href="/dashboard/cases">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Cases
          </Link>
        </Button>
        <h1 className="font-serif text-2xl font-bold mb-6">Create New Case</h1>
        <Card className="border-border/60">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Case Number + Status */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="caseNumber">
                    Case Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="caseNumber"
                    placeholder="LSCDA-2026-XXXXXX"
                    value={form.caseNumber}
                    onChange={e => setForm(f => ({ ...f, caseNumber: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={v => setForm(f => ({ ...f, status: v as CaseStatus }))}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CASE_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>
                          {CASE_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Case Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title">
                  Case Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="People v. [Defendant Name]"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              {/* Priority + Filing Date */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={form.priority}
                    onValueChange={v => setForm(f => ({ ...f, priority: v as typeof form.priority }))}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="filingDate">Filing Date</Label>
                  <Input
                    id="filingDate"
                    type="date"
                    value={form.filingDate}
                    onChange={e => setForm(f => ({ ...f, filingDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Defendant Name + Assigned Prosecutor */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="defendantName">Defendant Name</Label>
                  <Input
                    id="defendantName"
                    placeholder="Full legal name"
                    value={form.defendantName}
                    onChange={e => setForm(f => ({ ...f, defendantName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="leadProsecutorId">Assigned Prosecutor</Label>
                  <Select
                    value={form.leadProsecutorId}
                    onValueChange={v => setForm(f => ({ ...f, leadProsecutorId: v }))}
                  >
                    <SelectTrigger id="leadProsecutorId">
                      <SelectValue placeholder="Select prosecutor" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.name ?? u.username ?? `User #${u.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assigned Judge + Investigating Agency */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="assignedJudge">Assigned Judge</Label>
                  <Input
                    id="assignedJudge"
                    placeholder="Judge's name"
                    value={form.assignedJudge}
                    onChange={e => setForm(f => ({ ...f, assignedJudge: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="investigatingAgency">Investigating Agency</Label>
                  <Input
                    id="investigatingAgency"
                    placeholder="e.g. LSPD, LSSD"
                    value={form.investigatingAgency}
                    onChange={e => setForm(f => ({ ...f, investigatingAgency: e.target.value }))}
                  />
                </div>
              </div>

              {/* Court */}
              <div className="space-y-1.5">
                <Label htmlFor="court">Court</Label>
                <Input
                  id="court"
                  placeholder="e.g. Los Santos Superior Court"
                  value={form.court}
                  onChange={e => setForm(f => ({ ...f, court: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief case description..."
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="bg-navy-gradient text-white"
                  disabled={createCase.isPending}
                >
                  {createCase.isPending ? "Creating..." : "Create Case"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/cases">Cancel</Link>
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </InternalLayout>
  );
}
