"use client";

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ArrowRightLeft, PackageSearch, FileUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const EVIDENCE_TYPES = [
  "document",
  "image",
  "video",
  "audio",
  "physical",
  "digital",
  "other",
] as const;

type EvidenceType = (typeof EVIDENCE_TYPES)[number];

const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  document: "Document",
  image: "Image",
  video: "Video",
  audio: "Audio",
  physical: "Physical",
  digital: "Digital",
  other: "Other",
};

const EVIDENCE_TYPE_COLORS: Record<EvidenceType, string> = {
  document: "bg-blue-100 text-blue-800 border-blue-200",
  image: "bg-purple-100 text-purple-800 border-purple-200",
  video: "bg-pink-100 text-pink-800 border-pink-200",
  audio: "bg-indigo-100 text-indigo-800 border-indigo-200",
  physical: "bg-amber-100 text-amber-800 border-amber-200",
  digital: "bg-cyan-100 text-cyan-800 border-cyan-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PhysicalForm {
  type: EvidenceType | "";
  description: string;
  submittedByName: string;
  dateCollected: string;
  locationCollected: string;
}

interface FileForm {
  type: EvidenceType | "";
  description: string;
  submittedByName: string;
  dateCollected: string;
  file: File | null;
}

interface TransferForm {
  receivingParty: string;
  notes: string;
}

interface EvidenceTabProps {
  caseId: number;
  permissions: string[];
}

export function EvidenceTab({ caseId, permissions }: EvidenceTabProps) {
  const canManage = permissions.includes("upload_evidence");

  const utils = trpc.useUtils();

  // ── List ────────────────────────────────────────────────────────────────────
  const { data: evidenceList, isLoading } = trpc.evidence.listByCase.useQuery(
    { caseId },
    { enabled: !!caseId }
  );

  // ── Add Evidence dialog state ────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [addTab, setAddTab] = useState<"physical" | "file">("physical");

  const [physicalForm, setPhysicalForm] = useState<PhysicalForm>({
    type: "",
    description: "",
    submittedByName: "",
    dateCollected: "",
    locationCollected: "",
  });

  const [fileForm, setFileForm] = useState<FileForm>({
    type: "",
    description: "",
    submittedByName: "",
    dateCollected: "",
    file: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Transfer Custody dialog state ────────────────────────────────────────────
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferEvidenceId, setTransferEvidenceId] = useState<number | null>(null);
  const [transferForm, setTransferForm] = useState<TransferForm>({
    receivingParty: "",
    notes: "",
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createEvidence = trpc.evidence.create.useMutation({
    onSuccess: () => {
      toast.success("Evidence added");
      utils.evidence.listByCase.invalidate({ caseId });
      setAddOpen(false);
      resetPhysicalForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadEvidence = trpc.evidence.upload.useMutation({
    onSuccess: () => {
      toast.success("Evidence uploaded");
      utils.evidence.listByCase.invalidate({ caseId });
      setAddOpen(false);
      resetFileForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const transferCustody = trpc.evidence.transferCustody.useMutation({
    onSuccess: () => {
      toast.success("Custody transferred");
      utils.evidence.listByCase.invalidate({ caseId });
      setTransferOpen(false);
      setTransferEvidenceId(null);
      setTransferForm({ receivingParty: "", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function resetPhysicalForm() {
    setPhysicalForm({
      type: "",
      description: "",
      submittedByName: "",
      dateCollected: "",
      locationCollected: "",
    });
  }

  function resetFileForm() {
    setFileForm({
      type: "",
      description: "",
      submittedByName: "",
      dateCollected: "",
      file: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openTransferDialog(evidenceId: number) {
    setTransferEvidenceId(evidenceId);
    setTransferForm({ receivingParty: "", notes: "" });
    setTransferOpen(true);
  }

  // ── Submit handlers ──────────────────────────────────────────────────────────
  function handleAddPhysical() {
    if (!physicalForm.type) {
      toast.error("Evidence type is required");
      return;
    }
    createEvidence.mutate({
      caseId,
      type: physicalForm.type as EvidenceType,
      description: physicalForm.description.trim() || undefined,
      submittedByName: physicalForm.submittedByName.trim() || undefined,
      dateCollected: physicalForm.dateCollected
        ? new Date(physicalForm.dateCollected).getTime()
        : undefined,
      locationCollected: physicalForm.locationCollected.trim() || undefined,
    });
  }

  function handleUploadFile() {
    if (!fileForm.type) {
      toast.error("Evidence type is required");
      return;
    }
    if (!fileForm.file) {
      toast.error("Please select a file");
      return;
    }

    const file = fileForm.file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Full = e.target?.result as string;
      // Strip the data URL prefix (e.g. "data:image/png;base64,") to get raw base64
      const base64 = base64Full.split(",")[1] ?? base64Full;

      uploadEvidence.mutate({
        caseId,
        type: fileForm.type as EvidenceType,
        description: fileForm.description.trim() || undefined,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileBase64: base64,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  }

  function handleTransfer() {
    if (!transferEvidenceId) return;
    if (!transferForm.receivingParty.trim()) {
      toast.error("Receiving party is required");
      return;
    }
    transferCustody.mutate({
      evidenceId: transferEvidenceId,
      receivingParty: transferForm.receivingParty.trim(),
      notes: transferForm.notes.trim() || undefined,
    });
  }

  const isPendingAdd =
    addTab === "physical" ? createEvidence.isPending : uploadEvidence.isPending;

  return (
    <div className="space-y-5">
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <PackageSearch className="w-4 h-4 text-accent" />
              Evidence
            </CardTitle>
            {canManage && (
              <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Evidence
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
          ) : !evidenceList?.length ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No evidence logged yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Reference</TableHead>
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="w-32">Date Collected</TableHead>
                  {canManage && <TableHead className="w-28 text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {evidenceList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">
                      {item.referenceNumber}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${EVIDENCE_TYPE_COLORS[item.type as EvidenceType] ?? ""}`}
                      >
                        {EVIDENCE_TYPE_LABELS[item.type as EvidenceType] ?? item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {item.description ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.fileName ? (
                        <div>
                          <div className="font-medium truncate max-w-[180px]">
                            {item.fileUrl ? (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline text-accent"
                              >
                                {item.fileName}
                              </a>
                            ) : (
                              item.fileName
                            )}
                          </div>
                          {item.fileSize != null && (
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(item.fileSize)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.dateCollected ? (
                        format(new Date(item.dateCollected), "MMM d, yyyy")
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTransferDialog(item.id)}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
                          Transfer
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Add Evidence Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            resetPhysicalForm();
            resetFileForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Evidence</DialogTitle>
          </DialogHeader>

          <Tabs
            value={addTab}
            onValueChange={(v) => setAddTab(v as "physical" | "file")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="physical" className="flex-1">
                Physical Item
              </TabsTrigger>
              <TabsTrigger value="file" className="flex-1">
                <FileUp className="w-3.5 h-3.5 mr-1.5" />
                Upload File
              </TabsTrigger>
            </TabsList>

            {/* Physical Item tab */}
            <TabsContent value="physical" className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={physicalForm.type}
                  onValueChange={(v) =>
                    setPhysicalForm((f) => ({ ...f, type: v as EvidenceType }))
                  }
                >
                  <SelectTrigger id="p-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVIDENCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {EVIDENCE_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-description">Description</Label>
                <Textarea
                  id="p-description"
                  placeholder="Brief description of the item"
                  rows={2}
                  value={physicalForm.description}
                  onChange={(e) =>
                    setPhysicalForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-submitted-by">Submitted By</Label>
                  <Input
                    id="p-submitted-by"
                    placeholder="Officer / agent name"
                    value={physicalForm.submittedByName}
                    onChange={(e) =>
                      setPhysicalForm((f) => ({
                        ...f,
                        submittedByName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-date-collected">Date Collected</Label>
                  <Input
                    id="p-date-collected"
                    type="date"
                    value={physicalForm.dateCollected}
                    onChange={(e) =>
                      setPhysicalForm((f) => ({
                        ...f,
                        dateCollected: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-location">Location Collected</Label>
                <Input
                  id="p-location"
                  placeholder="e.g. 123 Main St, Los Santos"
                  value={physicalForm.locationCollected}
                  onChange={(e) =>
                    setPhysicalForm((f) => ({
                      ...f,
                      locationCollected: e.target.value,
                    }))
                  }
                />
              </div>
            </TabsContent>

            {/* Upload File tab */}
            <TabsContent value="file" className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="f-type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={fileForm.type}
                  onValueChange={(v) =>
                    setFileForm((f) => ({ ...f, type: v as EvidenceType }))
                  }
                >
                  <SelectTrigger id="f-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVIDENCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {EVIDENCE_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f-file">
                  File <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="f-file"
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setFileForm((f) => ({ ...f, file }));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f-description">Description</Label>
                <Textarea
                  id="f-description"
                  placeholder="Brief description of the file"
                  rows={2}
                  value={fileForm.description}
                  onChange={(e) =>
                    setFileForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="f-submitted-by">Submitted By</Label>
                  <Input
                    id="f-submitted-by"
                    placeholder="Officer / agent name"
                    value={fileForm.submittedByName}
                    onChange={(e) =>
                      setFileForm((f) => ({
                        ...f,
                        submittedByName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-date-collected">Date Collected</Label>
                  <Input
                    id="f-date-collected"
                    type="date"
                    value={fileForm.dateCollected}
                    onChange={(e) =>
                      setFileForm((f) => ({
                        ...f,
                        dateCollected: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={isPendingAdd}
            >
              Cancel
            </Button>
            <Button
              onClick={addTab === "physical" ? handleAddPhysical : handleUploadFile}
              disabled={isPendingAdd}
            >
              {isPendingAdd
                ? addTab === "physical"
                  ? "Adding..."
                  : "Uploading..."
                : addTab === "physical"
                  ? "Add Evidence"
                  : "Upload File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Transfer Custody Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={transferOpen}
        onOpenChange={(open) => {
          setTransferOpen(open);
          if (!open) {
            setTransferEvidenceId(null);
            setTransferForm({ receivingParty: "", notes: "" });
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Transfer Custody</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-receiving-party">
                Receiving Party <span className="text-destructive">*</span>
              </Label>
              <Input
                id="t-receiving-party"
                placeholder="Name of person / agency receiving custody"
                value={transferForm.receivingParty}
                onChange={(e) =>
                  setTransferForm((f) => ({
                    ...f,
                    receivingParty: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-notes">Notes</Label>
              <Textarea
                id="t-notes"
                placeholder="Optional transfer notes"
                rows={3}
                value={transferForm.notes}
                onChange={(e) =>
                  setTransferForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransferOpen(false)}
              disabled={transferCustody.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={transferCustody.isPending}
            >
              {transferCustody.isPending ? "Transferring..." : "Transfer Custody"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
