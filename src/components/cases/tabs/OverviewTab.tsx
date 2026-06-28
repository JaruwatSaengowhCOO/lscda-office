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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, User, Building2, Scale, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CASE_STATUS_LABELS } from "../../../../drizzle/schema";
import type { CaseStatus } from "../../../../drizzle/schema";

// The shape returned by trpc.cases.get
type CaseGetOutput = {
  id: number;
  caseNumber: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  court?: string | null;
  filedDate?: Date | string | null;
  filingDate?: Date | string | null;
  defendantName?: string | null;
  defendantId?: number | null;
  leadProsecutorId?: number | null;
  assignedJudge?: string | null;
  investigatingAgency?: string | null;
  arrestingAgency?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

interface OverviewTabProps {
  caseId: number;
  caseData: CaseGetOutput;
}

const SEVERITY_LABELS: Record<string, string> = {
  felony: "Felony",
  misdemeanor: "Misdemeanor",
  infraction: "Infraction",
};

const SEVERITY_COLORS: Record<string, string> = {
  felony: "bg-red-100 text-red-800 border-red-200",
  misdemeanor: "bg-orange-100 text-orange-800 border-orange-200",
  infraction: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value ?? "—"}</span>
    </div>
  );
}

export function OverviewTab({ caseId, caseData }: OverviewTabProps) {
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    chargeDescription: "",
    chargeCode: "",
    severity: "" as "felony" | "misdemeanor" | "infraction" | "",
    statute: "",
  });

  const utils = trpc.useUtils();

  const { data: charges, isLoading: chargesLoading } = trpc.cases.getCharges.useQuery(
    { caseId },
    { enabled: !!caseId }
  );

  const { data: defendants, isLoading: defendantsLoading } =
    trpc.cases.getDefendants.useQuery({ caseId }, { enabled: !!caseId });

  const addCharge = trpc.cases.addCharge.useMutation({
    onSuccess: () => {
      toast.success("Charge added");
      utils.cases.getCharges.invalidate({ caseId });
      setAddChargeOpen(false);
      setChargeForm({ chargeDescription: "", chargeCode: "", severity: "", statute: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCharge = trpc.cases.deleteCharge.useMutation({
    onSuccess: () => {
      toast.success("Charge removed");
      utils.cases.getCharges.invalidate({ caseId });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAddCharge = () => {
    if (!chargeForm.chargeDescription.trim()) {
      toast.error("Charge description is required");
      return;
    }
    addCharge.mutate({
      caseId,
      chargeDescription: chargeForm.chargeDescription.trim(),
      chargeCode: chargeForm.chargeCode.trim() || undefined,
      severity: (chargeForm.severity || undefined) as
        | "felony"
        | "misdemeanor"
        | "infraction"
        | undefined,
      statute: chargeForm.statute.trim() || undefined,
    });
  };

  const filedDate = caseData.filedDate ?? caseData.filingDate;

  return (
    <div className="space-y-5">
      {/* Core Case Fields */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            Case Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <FieldRow label="Case Number" value={caseData.caseNumber} />
            <FieldRow label="Title" value={caseData.title} />
            <FieldRow
              label="Status"
              value={
                <Badge
                  variant="outline"
                  className="text-xs font-medium mt-0.5"
                >
                  {CASE_STATUS_LABELS[caseData.status as CaseStatus] ??
                    caseData.status}
                </Badge>
              }
            />
            <FieldRow
              label="Priority"
              value={
                caseData.priority
                  ? PRIORITY_LABELS[caseData.priority] ?? caseData.priority
                  : null
              }
            />
            <FieldRow label="Court" value={caseData.court} />
            <FieldRow
              label="Filing Date"
              value={
                filedDate
                  ? format(new Date(filedDate), "MMMM d, yyyy")
                  : null
              }
            />
            <FieldRow label="Defendant Name" value={caseData.defendantName} />
            <FieldRow
              label="Defendant ID"
              value={caseData.defendantId ? `#${caseData.defendantId}` : null}
            />
            <FieldRow label="Assigned Judge" value={caseData.assignedJudge} />
            <FieldRow
              label="Investigating Agency"
              value={caseData.investigatingAgency ?? caseData.arrestingAgency}
            />
            <FieldRow
              label="Created Date"
              value={
                caseData.createdAt
                  ? format(new Date(caseData.createdAt), "MMMM d, yyyy")
                  : null
              }
            />
            <FieldRow
              label="Last Updated"
              value={
                caseData.updatedAt
                  ? format(new Date(caseData.updatedAt), "MMMM d, yyyy 'at' h:mm a")
                  : null
              }
            />
          </div>
          {caseData.description && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Description
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {caseData.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charges */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-4 h-4 text-accent" />
              Charges
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddChargeOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Charge
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {chargesLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !charges?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No charges added yet
            </div>
          ) : (
            <div className="space-y-2">
              {charges.map((charge) => (
                <div
                  key={charge.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      {charge.chargeCode && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {charge.chargeCode}
                        </span>
                      )}
                      {charge.severity && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            SEVERITY_COLORS[charge.severity] ?? ""
                          }`}
                        >
                          {SEVERITY_LABELS[charge.severity] ?? charge.severity}
                        </Badge>
                      )}
                      {charge.statute && (
                        <span className="text-xs text-muted-foreground">
                          § {charge.statute}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{charge.chargeDescription}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() =>
                      deleteCharge.mutate({ id: charge.id, caseId })
                    }
                    disabled={deleteCharge.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Defendants / Personnel */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Defendants */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-accent" />
              Defendants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {defendantsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : !defendants?.length ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No defendants linked
              </div>
            ) : (
              <div className="space-y-2">
                {defendants.map(({ cd, d }) => (
                  <div
                    key={cd.id}
                    className="p-3 rounded-lg bg-muted/40 border border-border/40"
                  >
                    <div className="font-medium text-sm">
                      {d.firstName} {d.lastName}
                    </div>
                    {cd.role && (
                      <div className="text-xs text-muted-foreground capitalize">
                        {cd.role}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personnel */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-accent" />
              Assigned Personnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {caseData.leadProsecutorId ? (
                <FieldRow
                  label="Prosecutor ID"
                  value={`#${caseData.leadProsecutorId}`}
                />
              ) : (
                <FieldRow label="Assigned Prosecutor" value={null} />
              )}
              <FieldRow label="Assigned Judge" value={caseData.assignedJudge} />
              <FieldRow
                label="Investigating Agency"
                value={caseData.investigatingAgency ?? caseData.arrestingAgency}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Charge Dialog */}
      <Dialog open={addChargeOpen} onOpenChange={setAddChargeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="chargeDescription">
                Charge Description{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="chargeDescription"
                placeholder="e.g. Assault with a deadly weapon"
                value={chargeForm.chargeDescription}
                onChange={(e) =>
                  setChargeForm((f) => ({
                    ...f,
                    chargeDescription: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="chargeCode">Charge Code</Label>
                <Input
                  id="chargeCode"
                  placeholder="e.g. PC 245(a)(1)"
                  value={chargeForm.chargeCode}
                  onChange={(e) =>
                    setChargeForm((f) => ({
                      ...f,
                      chargeCode: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="statute">Statute</Label>
                <Input
                  id="statute"
                  placeholder="e.g. 245"
                  value={chargeForm.statute}
                  onChange={(e) =>
                    setChargeForm((f) => ({ ...f, statute: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={chargeForm.severity}
                onValueChange={(v) =>
                  setChargeForm((f) => ({
                    ...f,
                    severity: v as typeof chargeForm.severity,
                  }))
                }
              >
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="felony">Felony</SelectItem>
                  <SelectItem value="misdemeanor">Misdemeanor</SelectItem>
                  <SelectItem value="infraction">Infraction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddChargeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCharge}
              disabled={addCharge.isPending}
            >
              {addCharge.isPending ? "Adding..." : "Add Charge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
