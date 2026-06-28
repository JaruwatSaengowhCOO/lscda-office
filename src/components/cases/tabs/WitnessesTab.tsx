"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Pencil, Trash2, Users, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type WitnessType = "eyewitness" | "expert" | "character" | "law_enforcement" | "other";

const WITNESS_TYPE_LABELS: Record<WitnessType, string> = {
  eyewitness: "Eyewitness",
  expert: "Expert",
  character: "Character",
  law_enforcement: "Law Enforcement",
  other: "Other",
};

const WITNESS_TYPE_COLORS: Record<WitnessType, string> = {
  eyewitness: "bg-blue-100 text-blue-800 border-blue-200",
  expert: "bg-purple-100 text-purple-800 border-purple-200",
  character: "bg-green-100 text-green-800 border-green-200",
  law_enforcement: "bg-orange-100 text-orange-800 border-orange-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

type WitnessRow = {
  id: number;
  caseId: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  witnessType: WitnessType;
  statement: string | null;
  isProtected: boolean;
  notes: string | null;
  createdBy: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type WitnessFormState = {
  name: string;
  witnessType: WitnessType | "";
  phone: string;
  email: string;
  address: string;
  statement: string;
  isProtected: boolean;
  notes: string;
};

const EMPTY_FORM: WitnessFormState = {
  name: "",
  witnessType: "",
  phone: "",
  email: "",
  address: "",
  statement: "",
  isProtected: false,
  notes: "",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface WitnessesTabProps {
  caseId: number;
  permissions: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isContactRedacted(w: WitnessRow): boolean {
  return w.isProtected && w.phone === null && w.email === null && w.address === null;
}

function truncate(text: string | null | undefined, maxLen = 120): string {
  if (!text) return "—";
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WitnessesTab({ caseId, permissions }: WitnessesTabProps) {
  const canManage = permissions.includes("manage_witnesses");

  const utils = trpc.useUtils();

  // ── Dialogs state
  const [addOpen, setAddOpen] = useState(false);
  const [editWitness, setEditWitness] = useState<WitnessRow | null>(null);
  const [deleteWitness, setDeleteWitness] = useState<WitnessRow | null>(null);

  // ── Form state
  const [form, setForm] = useState<WitnessFormState>(EMPTY_FORM);

  // ── Data
  const { data: witnesses, isLoading } = trpc.witnesses.listByCase.useQuery(
    { caseId },
    { enabled: !!caseId }
  );

  // ── Mutations
  const createMutation = trpc.witnesses.create.useMutation({
    onSuccess: () => {
      toast.success("Witness added");
      utils.witnesses.listByCase.invalidate({ caseId });
      setAddOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.witnesses.update.useMutation({
    onSuccess: () => {
      toast.success("Witness updated");
      utils.witnesses.listByCase.invalidate({ caseId });
      setEditWitness(null);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.witnesses.delete.useMutation({
    onSuccess: () => {
      toast.success("Witness deleted");
      utils.witnesses.listByCase.invalidate({ caseId });
      setDeleteWitness(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Handlers
  function openAdd() {
    setForm(EMPTY_FORM);
    setAddOpen(true);
  }

  function openEdit(w: WitnessRow) {
    setForm({
      name: w.name,
      witnessType: w.witnessType,
      phone: w.phone ?? "",
      email: w.email ?? "",
      address: w.address ?? "",
      statement: w.statement ?? "",
      isProtected: w.isProtected,
      notes: w.notes ?? "",
    });
    setEditWitness(w);
  }

  function handleAdd() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    createMutation.mutate({
      caseId,
      name: form.name.trim(),
      witnessType: (form.witnessType || "other") as WitnessType,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      statement: form.statement.trim() || undefined,
      isProtected: form.isProtected,
      notes: form.notes.trim() || undefined,
    });
  }

  function handleEdit() {
    if (!editWitness) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    updateMutation.mutate({
      id: editWitness.id,
      name: form.name.trim(),
      witnessType: (form.witnessType || "other") as WitnessType,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      statement: form.statement.trim() || undefined,
      isProtected: form.isProtected,
      notes: form.notes.trim() || undefined,
    });
  }

  function handleDelete() {
    if (!deleteWitness) return;
    deleteMutation.mutate({ id: deleteWitness.id });
  }

  // ── Render
  return (
    <div className="space-y-5">
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              Witnesses
            </CardTitle>
            {canManage && (
              <Button size="sm" variant="outline" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Witness
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
          ) : !witnesses?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No witnesses added yet
            </div>
          ) : (
            <div className="rounded-md border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead className="w-[140px]">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Statement</TableHead>
                    <TableHead className="hidden lg:table-cell w-[200px]">Contact</TableHead>
                    {canManage && (
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(witnesses as WitnessRow[]).map((w) => {
                    const redacted = isContactRedacted(w);
                    return (
                      <TableRow key={w.id}>
                        {/* Name */}
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1.5">
                            {w.name}
                            {w.isProtected && (
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                          </div>
                        </TableCell>

                        {/* Type badge */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${WITNESS_TYPE_COLORS[w.witnessType] ?? ""}`}
                          >
                            {WITNESS_TYPE_LABELS[w.witnessType] ?? w.witnessType}
                          </Badge>
                        </TableCell>

                        {/* Statement (truncated) */}
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs">
                          {truncate(w.statement)}
                        </TableCell>

                        {/* Contact */}
                        <TableCell className="hidden lg:table-cell text-sm">
                          {redacted ? (
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                            >
                              Protected
                            </Badge>
                          ) : (
                            <div className="space-y-0.5 text-muted-foreground">
                              {w.phone && <div>{w.phone}</div>}
                              {w.email && <div>{w.email}</div>}
                              {w.address && (
                                <div className="truncate max-w-[180px]">{w.address}</div>
                              )}
                              {!w.phone && !w.email && !w.address && <span>—</span>}
                            </div>
                          )}
                        </TableCell>

                        {/* Actions */}
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEdit(w)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteWitness(w)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Witness Dialog ──────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Witness</DialogTitle>
          </DialogHeader>
          <WitnessForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Witness"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Witness Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!editWitness} onOpenChange={(open) => { if (!open) setEditWitness(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Witness</DialogTitle>
          </DialogHeader>
          <WitnessForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditWitness(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ───────────────────────────────────────────── */}
      <Dialog open={!!deleteWitness} onOpenChange={(open) => { if (!open) setDeleteWitness(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Witness</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{deleteWitness?.name}</span>?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteWitness(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Witness Form (shared between add/edit) ───────────────────────────────────

interface WitnessFormProps {
  form: WitnessFormState;
  onChange: React.Dispatch<React.SetStateAction<WitnessFormState>>;
}

function WitnessForm({ form, onChange }: WitnessFormProps) {
  function set<K extends keyof WitnessFormState>(key: K, value: WitnessFormState[K]) {
    onChange((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-4 py-2">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="witness-name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="witness-name"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      {/* Witness Type */}
      <div className="space-y-1.5">
        <Label htmlFor="witness-type">Witness Type</Label>
        <Select
          value={form.witnessType}
          onValueChange={(v) => set("witnessType", v as WitnessType)}
        >
          <SelectTrigger id="witness-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eyewitness">Eyewitness</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
            <SelectItem value="character">Character</SelectItem>
            <SelectItem value="law_enforcement">Law Enforcement</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Phone + Email */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="witness-phone">Phone</Label>
          <Input
            id="witness-phone"
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="witness-email">Email</Label>
          <Input
            id="witness-email"
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="witness-address">Address</Label>
        <Input
          id="witness-address"
          placeholder="Street, City, State ZIP"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />
      </div>

      {/* Statement */}
      <div className="space-y-1.5">
        <Label htmlFor="witness-statement">Statement</Label>
        <Textarea
          id="witness-statement"
          placeholder="Witness statement…"
          rows={3}
          value={form.statement}
          onChange={(e) => set("statement", e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="witness-notes">Notes</Label>
        <Textarea
          id="witness-notes"
          placeholder="Internal notes…"
          rows={2}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {/* Protected checkbox */}
      <div className="flex items-center gap-2 pt-1">
        <Checkbox
          id="witness-protected"
          checked={form.isProtected}
          onCheckedChange={(checked) => set("isProtected", !!checked)}
        />
        <Label htmlFor="witness-protected" className="font-normal cursor-pointer">
          Protected witness — hide contact info from users without{" "}
          <code className="text-xs bg-muted px-1 rounded">manage_witnesses</code>
        </Label>
      </div>
    </div>
  );
}
