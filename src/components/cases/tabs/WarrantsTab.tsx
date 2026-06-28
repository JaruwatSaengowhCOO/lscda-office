"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { WarrantDisplayStatus } from "../../../../server/routers/warrants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WarrantsTabProps {
  caseId: number;
  permissions: string[];
}

type WarrantType =
  | "arrest_warrant"
  | "search_warrant"
  | "bench_warrant"
  | "subpoena";

interface NewWarrantForm {
  warrantNumber: string;
  type: WarrantType | "";
  requestedBy: string;
  approvedBy: string;
  dateRequested: string;
  dateApproved: string;
  expiresAt: string;
  subject: string;
}

// ─── Display Maps ─────────────────────────────────────────────────────────────

const WARRANT_TYPE_LABELS: Record<WarrantType, string> = {
  arrest_warrant: "Arrest Warrant",
  search_warrant: "Search Warrant",
  bench_warrant: "Bench Warrant",
  subpoena: "Subpoena",
};

const WARRANT_TYPE_COLORS: Record<WarrantType, string> = {
  arrest_warrant: "bg-red-100 text-red-800 border-red-200",
  search_warrant: "bg-blue-100 text-blue-800 border-blue-200",
  bench_warrant: "bg-orange-100 text-orange-800 border-orange-200",
  subpoena: "bg-purple-100 text-purple-800 border-purple-200",
};

const DISPLAY_STATUS_LABELS: Record<WarrantDisplayStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  denied: "Denied",
  executed: "Executed",
  expired: "Expired",
};

const DISPLAY_STATUS_COLORS: Record<WarrantDisplayStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  pending_approval: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  denied: "bg-gray-100 text-gray-600 border-gray-200",
  executed: "bg-blue-100 text-blue-800 border-blue-200",
  expired: "bg-red-100 text-red-800 border-red-200",
};

// ─── Approve Dialog ───────────────────────────────────────────────────────────

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (approvedBy: string, dateApproved: number) => void;
  isPending: boolean;
}

function ApproveDialog({ open, onOpenChange, onConfirm, isPending }: ApproveDialogProps) {
  const [approvedBy, setApprovedBy] = useState("");
  const [dateApproved, setDateApproved] = useState(
    () => new Date().toISOString().slice(0, 16)
  );

  const handleConfirm = () => {
    if (!approvedBy.trim()) {
      toast.error("Approved by is required");
      return;
    }
    onConfirm(approvedBy.trim(), new Date(dateApproved).getTime());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Warrant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="approvedByField">
              Approved By <span className="text-destructive">*</span>
            </Label>
            <Input
              id="approvedByField"
              placeholder="e.g. Judge Maria Santos"
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dateApprovedField">Date Approved</Label>
            <Input
              id="dateApprovedField"
              type="datetime-local"
              value={dateApproved}
              onChange={(e) => setDateApproved(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const EMPTY_FORM: NewWarrantForm = {
  warrantNumber: "",
  type: "",
  requestedBy: "",
  approvedBy: "",
  dateRequested: "",
  dateApproved: "",
  expiresAt: "",
  subject: "",
};

export function WarrantsTab({ caseId, permissions }: WarrantsTabProps) {
  const [newWarrantOpen, setNewWarrantOpen] = useState(false);
  const [form, setForm] = useState<NewWarrantForm>(EMPTY_FORM);

  // Approve dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [pendingApproveId, setPendingApproveId] = useState<number | null>(null);

  const canCreateWarrant = permissions.includes("create_warrant");
  const canApproveWarrant = permissions.includes("approve_warrant");

  const utils = trpc.useUtils();

  const { data: warrantsData, isLoading } = trpc.warrants.listByCase.useQuery(
    { caseId },
    { enabled: !!caseId }
  );

  const createMutation = trpc.warrants.create.useMutation({
    onSuccess: () => {
      toast.success("Warrant created");
      utils.warrants.listByCase.invalidate({ caseId });
      setNewWarrantOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const submitMutation = trpc.warrants.submit.useMutation({
    onSuccess: () => {
      toast.success("Warrant submitted for approval");
      utils.warrants.listByCase.invalidate({ caseId });
    },
    onError: (e) => toast.error(e.message),
  });

  const approveMutation = trpc.warrants.approve.useMutation({
    onSuccess: () => {
      toast.success("Warrant approved");
      utils.warrants.listByCase.invalidate({ caseId });
      setApproveDialogOpen(false);
      setPendingApproveId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const denyMutation = trpc.warrants.deny.useMutation({
    onSuccess: () => {
      toast.success("Warrant denied");
      utils.warrants.listByCase.invalidate({ caseId });
    },
    onError: (e) => toast.error(e.message),
  });

  const executeMutation = trpc.warrants.execute.useMutation({
    onSuccess: () => {
      toast.success("Warrant marked as executed");
      utils.warrants.listByCase.invalidate({ caseId });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.warrantNumber.trim()) {
      toast.error("Warrant number is required");
      return;
    }
    if (!form.type) {
      toast.error("Warrant type is required");
      return;
    }
    createMutation.mutate({
      caseId,
      type: form.type as WarrantType,
      subject: form.requestedBy.trim() || undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : undefined,
    });
  };

  const handleApproveClick = (id: number) => {
    setPendingApproveId(id);
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = (approvedBy: string, dateApproved: number) => {
    if (!pendingApproveId) return;
    approveMutation.mutate({ id: pendingApproveId, approvedBy, dateApproved });
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-accent" />
              Warrants
            </CardTitle>
            {canCreateWarrant && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNewWarrantOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Warrant
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !warrantsData?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No warrants on record for this case
            </div>
          ) : (
            <div className="rounded-md border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-medium uppercase tracking-wide">
                      Warrant #
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide">
                      Type
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide">
                      Subject / Requested By
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide">
                      Expires
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warrantsData.map((warrant) => {
                    const displayStatus = warrant.displayStatus as WarrantDisplayStatus;
                    const warrantType = warrant.type as WarrantType;
                    const subject = warrant.requestedBy ?? warrant.subject ?? "—";

                    return (
                      <TableRow key={warrant.id} className="hover:bg-muted/20">
                        <TableCell className="font-mono text-sm font-medium">
                          {warrant.warrantNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${WARRANT_TYPE_COLORS[warrantType] ?? ""}`}
                          >
                            {WARRANT_TYPE_LABELS[warrantType] ?? warrant.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${DISPLAY_STATUS_COLORS[displayStatus] ?? ""}`}
                          >
                            {DISPLAY_STATUS_LABELS[displayStatus] ?? displayStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {subject}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {warrant.expiresAt
                            ? format(new Date(warrant.expiresAt), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* draft → submit (create_warrant) */}
                            {displayStatus === "draft" && canCreateWarrant && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  submitMutation.mutate({ id: warrant.id })
                                }
                                disabled={submitMutation.isPending}
                              >
                                Submit
                              </Button>
                            )}

                            {/* pending_approval → approve / deny (approve_warrant) */}
                            {displayStatus === "pending_approval" &&
                              canApproveWarrant && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-green-300 text-green-700 hover:bg-green-50"
                                    onClick={() =>
                                      handleApproveClick(warrant.id)
                                    }
                                    disabled={approveMutation.isPending}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                    onClick={() =>
                                      denyMutation.mutate({ id: warrant.id })
                                    }
                                    disabled={denyMutation.isPending}
                                  >
                                    Deny
                                  </Button>
                                </>
                              )}

                            {/* approved → execute (create_warrant) */}
                            {displayStatus === "approved" && canCreateWarrant && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                onClick={() =>
                                  executeMutation.mutate({ id: warrant.id })
                                }
                                disabled={executeMutation.isPending}
                              >
                                Execute
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Warrant Dialog */}
      <Dialog open={newWarrantOpen} onOpenChange={setNewWarrantOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Warrant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="warrantNumber">
                Warrant Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="warrantNumber"
                placeholder="e.g. WRT-2024-ABC123"
                value={form.warrantNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, warrantNumber: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="warrantType">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as WarrantType }))
                }
              >
                <SelectTrigger id="warrantType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arrest_warrant">Arrest Warrant</SelectItem>
                  <SelectItem value="search_warrant">Search Warrant</SelectItem>
                  <SelectItem value="bench_warrant">Bench Warrant</SelectItem>
                  <SelectItem value="subpoena">Subpoena</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g. John Doe"
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="requestedBy">Requested By</Label>
                <Input
                  id="requestedBy"
                  placeholder="e.g. Det. Rodriguez"
                  value={form.requestedBy}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, requestedBy: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="approvedBy">Approved By</Label>
                <Input
                  id="approvedBy"
                  placeholder="e.g. Judge Santos"
                  value={form.approvedBy}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, approvedBy: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dateRequested">Date Requested</Label>
                <Input
                  id="dateRequested"
                  type="date"
                  value={form.dateRequested}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dateRequested: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dateApproved">Date Approved</Label>
                <Input
                  id="dateApproved"
                  type="date"
                  value={form.dateApproved}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dateApproved: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiresAt">Expires At</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewWarrantOpen(false);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Warrant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <ApproveDialog
        open={approveDialogOpen}
        onOpenChange={(open) => {
          setApproveDialogOpen(open);
          if (!open) setPendingApproveId(null);
        }}
        onConfirm={handleApproveConfirm}
        isPending={approveMutation.isPending}
      />
    </div>
  );
}
