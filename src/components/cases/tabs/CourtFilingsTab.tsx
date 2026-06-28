"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { Plus, Calendar, Clock, MapPin, User, Pencil, Gavel } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CourtFilingsTabProps {
  caseId: number;
  permissions: string[];
}

type HearingStatus = "scheduled" | "completed" | "continued" | "cancelled";

type Hearing = {
  id: number;
  caseId: number;
  hearingType: string;
  scheduledAt: Date | string;
  courtroom?: string | null;
  judge?: string | null;
  status: HearingStatus;
  notes?: string | null;
  createdBy?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const HEARING_TYPES = [
  { value: "arraignment", label: "Arraignment" },
  { value: "preliminary_hearing", label: "Preliminary Hearing" },
  { value: "pre_trial", label: "Pre-Trial" },
  { value: "trial", label: "Trial" },
  { value: "sentencing", label: "Sentencing" },
  { value: "appeal", label: "Appeal" },
  { value: "motion_hearing", label: "Motion Hearing" },
  { value: "other", label: "Other" },
] as const;

const HEARING_STATUS_LABELS: Record<HearingStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  continued: "Continued",
  cancelled: "Cancelled",
};

const HEARING_STATUS_COLORS: Record<HearingStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  continued: "bg-yellow-100 text-yellow-800 border-yellow-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const HEARING_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  HEARING_TYPES.map(({ value, label }) => [value, label])
);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toDatetimeLocalValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  // Format as YYYY-MM-DDTHH:mm (local time)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isUpcoming(hearing: Hearing): boolean {
  return (
    hearing.status === "scheduled" &&
    new Date(hearing.scheduledAt) > new Date()
  );
}

function isPast(hearing: Hearing): boolean {
  return (
    hearing.status === "completed" ||
    hearing.status === "cancelled" ||
    hearing.status === "continued" ||
    new Date(hearing.scheduledAt) <= new Date()
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function HearingRow({
  hearing,
  onUpdate,
}: {
  hearing: Hearing;
  onUpdate: (h: Hearing) => void;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/40">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm">
            {HEARING_TYPE_LABELS[hearing.hearingType] ?? hearing.hearingType}
          </span>
          <Badge
            variant="outline"
            className={`text-xs ${HEARING_STATUS_COLORS[hearing.status] ?? ""}`}
          >
            {HEARING_STATUS_LABELS[hearing.status] ?? hearing.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(hearing.scheduledAt), "MMMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(hearing.scheduledAt), "h:mm a")}
          </span>
          {hearing.courtroom && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {hearing.courtroom}
            </span>
          )}
          {hearing.judge && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {hearing.judge}
            </span>
          )}
        </div>
        {hearing.notes && (
          <p className="text-xs text-muted-foreground mt-1 italic">{hearing.notes}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0"
        onClick={() => onUpdate(hearing)}
      >
        <Pencil className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CourtFilingsTab({ caseId, permissions }: CourtFilingsTabProps) {
  const canCreate = permissions.includes("create_hearing");

  // ── Schedule dialog state ─────────────────────────────────────────────────
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    hearingType: "",
    scheduledAt: "",
    courtroom: "",
    judge: "",
    notes: "",
  });

  // ── Update dialog state ───────────────────────────────────────────────────
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
  const [updateForm, setUpdateForm] = useState({
    status: "" as HearingStatus | "",
    notes: "",
  });

  const utils = trpc.useUtils();

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: hearings, isLoading } = trpc.hearings.list.useQuery(
    { caseId },
    { enabled: !!caseId }
  );

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createHearing = trpc.hearings.create.useMutation({
    onSuccess: () => {
      toast.success("Hearing scheduled");
      utils.hearings.list.invalidate({ caseId });
      setScheduleOpen(false);
      setScheduleForm({ hearingType: "", scheduledAt: "", courtroom: "", judge: "", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateHearing = trpc.hearings.update.useMutation({
    onSuccess: () => {
      toast.success("Hearing updated");
      utils.hearings.list.invalidate({ caseId });
      setUpdateOpen(false);
      setSelectedHearing(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSchedule = () => {
    if (!scheduleForm.hearingType) {
      toast.error("Hearing type is required");
      return;
    }
    if (!scheduleForm.scheduledAt) {
      toast.error("Date and time are required");
      return;
    }
    createHearing.mutate({
      caseId,
      hearingType: scheduleForm.hearingType,
      scheduledAt: new Date(scheduleForm.scheduledAt).getTime(),
      courtroom: scheduleForm.courtroom.trim() || undefined,
      judge: scheduleForm.judge.trim() || undefined,
      notes: scheduleForm.notes.trim() || undefined,
    });
  };

  const handleOpenUpdate = (hearing: Hearing) => {
    setSelectedHearing(hearing);
    setUpdateForm({
      status: hearing.status,
      notes: hearing.notes ?? "",
    });
    setUpdateOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedHearing) return;
    updateHearing.mutate({
      id: selectedHearing.id,
      status: updateForm.status || undefined,
      notes: updateForm.notes.trim() || undefined,
    });
  };

  // ── Split hearings ─────────────────────────────────────────────────────────
  const upcoming = (hearings ?? [])
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const past = (hearings ?? [])
    .filter(isPast)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Upcoming Hearings */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Gavel className="w-4 h-4 text-accent" />
              Upcoming Hearings
            </CardTitle>
            {canCreate && (
              <Button size="sm" variant="outline" onClick={() => setScheduleOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Schedule Hearing
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !upcoming.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No upcoming hearings scheduled
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((h) => (
                <HearingRow key={h.id} hearing={h as Hearing} onUpdate={handleOpenUpdate} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Past Hearings */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            Past Hearings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !past.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No past hearings
            </div>
          ) : (
            <div className="space-y-2">
              {past.map((h) => (
                <HearingRow key={h.id} hearing={h as Hearing} onUpdate={handleOpenUpdate} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Hearing Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Hearing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="hearingType">
                Hearing Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={scheduleForm.hearingType}
                onValueChange={(v) =>
                  setScheduleForm((f) => ({ ...f, hearingType: v }))
                }
              >
                <SelectTrigger id="hearingType">
                  <SelectValue placeholder="Select hearing type" />
                </SelectTrigger>
                <SelectContent>
                  {HEARING_TYPES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scheduledAt">
                Date &amp; Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduleForm.scheduledAt}
                onChange={(e) =>
                  setScheduleForm((f) => ({ ...f, scheduledAt: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="courtroom">Courtroom</Label>
                <Input
                  id="courtroom"
                  placeholder="e.g. Courtroom 4B"
                  value={scheduleForm.courtroom}
                  onChange={(e) =>
                    setScheduleForm((f) => ({ ...f, courtroom: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="judge">Judge</Label>
                <Input
                  id="judge"
                  placeholder="e.g. Hon. Smith"
                  value={scheduleForm.judge}
                  onChange={(e) =>
                    setScheduleForm((f) => ({ ...f, judge: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                rows={3}
                value={scheduleForm.notes}
                onChange={(e) =>
                  setScheduleForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={createHearing.isPending}>
              {createHearing.isPending ? "Scheduling..." : "Schedule Hearing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Hearing Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Hearing
              {selectedHearing && (
                <span className="font-normal text-muted-foreground text-sm ml-2">
                  — {HEARING_TYPE_LABELS[selectedHearing.hearingType] ?? selectedHearing.hearingType}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedHearing && (
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2">
                Scheduled:{" "}
                {format(new Date(selectedHearing.scheduledAt), "MMMM d, yyyy 'at' h:mm a")}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="updateStatus">Status</Label>
              <Select
                value={updateForm.status}
                onValueChange={(v) =>
                  setUpdateForm((f) => ({ ...f, status: v as HearingStatus }))
                }
              >
                <SelectTrigger id="updateStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="continued">Continued</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="updateNotes">Notes</Label>
              <Textarea
                id="updateNotes"
                placeholder="Any additional notes..."
                rows={3}
                value={updateForm.notes}
                onChange={(e) =>
                  setUpdateForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateHearing.isPending}>
              {updateHearing.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
