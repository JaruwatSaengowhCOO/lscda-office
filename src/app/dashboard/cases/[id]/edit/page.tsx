'use client';

import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CASE_STATUS_LABELS } from "../../../../../../drizzle/schema";
import type { CaseStatus } from "../../../../../../drizzle/schema";

export default function EditCasePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const caseId = parseInt(params?.id ?? "0");

  const [form, setForm] = useState({
    title: "",
    caseNumber: "",
    description: "",
    status: "" as CaseStatus | "",
    priority: "" as "low" | "medium" | "high" | "critical" | "",
    defendantName: "",
    leadProsecutorId: "" as string,
    assignedJudge: "",
    investigatingAgency: "",
    filingDate: "",
    court: "",
  });
  const [initialized, setInitialized] = useState(false);

  const { data: caseData, isLoading: caseLoading } = trpc.cases.get.useQuery(
    { id: caseId },
    { enabled: !isNaN(caseId) }
  );

  const { data: validTransitions, isLoading: transitionsLoading } = trpc.cases.getValidTransitions.useQuery(
    { caseId },
    { enabled: !isNaN(caseId) }
  );

  const { data: users } = trpc.users.listForAssignment.useQuery();

  // Pre-populate form once case data loads
  useEffect(() => {
    if (caseData && !initialized) {
      setForm({
        title: caseData.title ?? "",
        caseNumber: caseData.caseNumber ?? "",
        description: caseData.description ?? "",
        status: (caseData.status as CaseStatus) ?? "",
        priority: (caseData.priority as typeof form.priority) ?? "",
        defendantName: caseData.defendantName ?? "",
        leadProsecutorId: caseData.leadProsecutorId ? String(caseData.leadProsecutorId) : "",
        assignedJudge: caseData.assignedJudge ?? "",
        investigatingAgency: caseData.investigatingAgency ?? "",
        filingDate: caseData.filingDate
          ? new Date(caseData.filingDate).toISOString().split("T")[0]
          : "",
        court: caseData.court ?? "",
      });
      setInitialized(true);
    }
  }, [caseData, initialized]);

  const updateCase = trpc.cases.update.useMutation({
    onSuccess: () => {
      toast.success("Case updated successfully");
      router.push(`/dashboard/cases/${caseId}`);
    },
    onError: (e) => {
      if (e.data?.code === "BAD_REQUEST") {
        try {
          const parsed = JSON.parse(e.message);
          toast.error(
            `Invalid status transition: cannot move from "${CASE_STATUS_LABELS[parsed.currentStatus as CaseStatus] ?? parsed.currentStatus}" to "${CASE_STATUS_LABELS[parsed.targetStatus as CaseStatus] ?? parsed.targetStatus}"`
          );
        } catch {
          toast.error(e.message);
        }
      } else {
        toast.error(e.message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast.error("Case title is required");
      return;
    }

    updateCase.mutate({
      id: caseId,
      title: form.title,
      description: form.description || undefined,
      status: form.status ? (form.status as CaseStatus) : undefined,
      priority: form.priority ? (form.priority as "low" | "medium" | "high" | "critical") : undefined,
      defendantName: form.defendantName || undefined,
      leadProsecutorId: form.leadProsecutorId ? Number(form.leadProsecutorId) : undefined,
      assignedJudge: form.assignedJudge || undefined,
      investigatingAgency: form.investigatingAgency || undefined,
      filingDate: form.filingDate ? new Date(form.filingDate) : undefined,
      court: form.court || undefined,
    });
  };

  const isLoading = caseLoading || transitionsLoading;

  // Build the list of available status options:
  // current status (always selectable as default) + valid transitions
  const statusOptions: CaseStatus[] = caseData
    ? [
        caseData.status as CaseStatus,
        ...(validTransitions ?? []),
      ]
    : [];

  return (
    <InternalLayout>
      <div className="p-6 max-w-3xl">
        <Button asChild variant="ghost" className="mb-4 -ml-2">
          <Link href={`/dashboard/cases/${caseId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Case
          </Link>
        </Button>
        <h1 className="font-serif text-2xl font-bold mb-6">Edit Case</h1>

        {isLoading ? (
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Case Number (read-only) + Status */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="caseNumber">Case Number</Label>
                    <Input
                      id="caseNumber"
                      value={form.caseNumber}
                      disabled
                      className="bg-muted cursor-not-allowed"
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
                        {statusOptions.map(s => (
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
                        <SelectValue placeholder="Select priority" />
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
                    disabled={updateCase.isPending}
                  >
                    {updateCase.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/dashboard/cases/${caseId}`}>Cancel</Link>
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </InternalLayout>
  );
}
