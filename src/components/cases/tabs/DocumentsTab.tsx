"use client";

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Upload, History } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  CASE_DOCUMENT_TYPES,
  CASE_DOCUMENT_TYPE_LABELS,
} from "../../../../drizzle/schema";
import type { CaseDocumentType } from "../../../../drizzle/schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data-url prefix so we get only the base64 payload
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentsTabProps {
  caseId: number;
  permissions: string[];
}

// ─── Upload Document Dialog ───────────────────────────────────────────────────

interface UploadDocumentDialogProps {
  caseId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function UploadDocumentDialog({
  caseId,
  open,
  onOpenChange,
  onSuccess,
}: UploadDocumentDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    documentType: "" as CaseDocumentType | "",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createDocument = trpc.caseDocuments.create.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      onSuccess();
      handleClose();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleClose() {
    onOpenChange(false);
    setForm({ title: "", documentType: "", notes: "" });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.documentType) {
      toast.error("Document type is required");
      return;
    }

    let filePayload: {
      fileKey?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    } = {};

    if (selectedFile) {
      const base64 = await readFileAsBase64(selectedFile);
      // Store base64 as the fileKey for server-side handling
      filePayload = {
        fileKey: base64,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
      };
    }

    createDocument.mutate({
      caseId,
      title: form.title.trim(),
      documentType: form.documentType as CaseDocumentType,
      notes: form.notes.trim() || undefined,
      ...filePayload,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="doc-title"
              placeholder="e.g. Criminal Complaint – People v. Smith"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-type">
              Document Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.documentType}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, documentType: v as CaseDocumentType }))
              }
            >
              <SelectTrigger id="doc-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {CASE_DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {CASE_DOCUMENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-file">File (optional)</Label>
            <Input
              id="doc-file"
              type="file"
              ref={fileInputRef}
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="cursor-pointer"
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-notes">Notes</Label>
            <Textarea
              id="doc-notes"
              placeholder="Optional notes about this document…"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createDocument.isPending}>
            {createDocument.isPending ? "Uploading…" : "Upload Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Upload Version Dialog ────────────────────────────────────────────────────

interface UploadVersionDialogProps {
  documentId: number;
  documentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function UploadVersionDialog({
  documentId,
  documentTitle,
  open,
  onOpenChange,
  onSuccess,
}: UploadVersionDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const uploadVersion = trpc.caseDocuments.uploadVersion.useMutation({
    onSuccess: () => {
      toast.success("New version uploaded successfully");
      onSuccess();
      handleClose();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleClose() {
    onOpenChange(false);
    setSelectedFile(null);
    setNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    const base64 = await readFileAsBase64(selectedFile);

    uploadVersion.mutate({
      id: documentId,
      fileKey: base64,
      fileUrl: "",
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      mimeType: selectedFile.type,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload New Version</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Uploading a new version for: <span className="font-medium text-foreground">{documentTitle}</span>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="version-file">
              File <span className="text-destructive">*</span>
            </Label>
            <Input
              id="version-file"
              type="file"
              ref={fileInputRef}
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="cursor-pointer"
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="version-notes">Notes</Label>
            <Textarea
              id="version-notes"
              placeholder="What changed in this version?"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploadVersion.isPending}>
            {uploadVersion.isPending ? "Uploading…" : "Upload Version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Version History Sheet ────────────────────────────────────────────────────

interface VersionHistorySheetProps {
  documentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VersionHistorySheet({
  documentId,
  open,
  onOpenChange,
}: VersionHistorySheetProps) {
  const { data: doc, isLoading } = trpc.caseDocuments.get.useQuery(
    { id: documentId! },
    { enabled: open && documentId != null }
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <History className="w-4 h-4 text-accent" />
            Version History
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !doc ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Document not found.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Current version */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Current
              </p>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{doc.title}</span>
                  <Badge variant="outline" className="text-xs">
                    v{doc.version}
                  </Badge>
                </div>
                {doc.fileName && (
                  <p className="text-xs text-muted-foreground">
                    {doc.fileName} ({formatFileSize(doc.fileSize)})
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Uploaded{" "}
                  {doc.updatedAt
                    ? format(new Date(doc.updatedAt), "MMM d, yyyy 'at' h:mm a")
                    : "—"}
                </p>
                {doc.notes && (
                  <p className="text-xs text-foreground/80 italic">{doc.notes}</p>
                )}
              </div>
            </div>

            {/* Historical versions */}
            {doc.versions && doc.versions.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  History ({doc.versions.length})
                </p>
                <div className="space-y-2">
                  {[...doc.versions]
                    .sort((a, b) => b.version - a.version)
                    .map((v) => (
                      <div
                        key={v.id}
                        className="rounded-lg border border-border/40 bg-background p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Version {v.version}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            v{v.version}
                          </Badge>
                        </div>
                        {v.fileName && (
                          <p className="text-xs text-muted-foreground">
                            {v.fileName} ({formatFileSize(v.fileSize)})
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {v.createdAt
                            ? format(new Date(v.createdAt), "MMM d, yyyy 'at' h:mm a")
                            : "—"}
                        </p>
                        {v.notes && (
                          <p className="text-xs text-foreground/80 italic">{v.notes}</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No previous versions
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DocumentsTab({ caseId, permissions }: DocumentsTabProps) {
  const canManage = permissions.includes("manage_case_documents");

  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [uploadVersionTarget, setUploadVersionTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [historyDocId, setHistoryDocId] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const utils = trpc.useUtils();

  const { data: documents, isLoading } = trpc.caseDocuments.listByCase.useQuery(
    { caseId },
    { enabled: !!caseId }
  );

  function handleUploadSuccess() {
    utils.caseDocuments.listByCase.invalidate({ caseId });
  }

  function openVersionHistory(docId: number) {
    setHistoryDocId(docId);
    setHistoryOpen(true);
  }

  return (
    <div className="space-y-5">
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              Case Documents
            </CardTitle>
            {canManage && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUploadDocOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Upload Document
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
          ) : !documents?.length ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No documents uploaded yet
            </div>
          ) : (
            <div className="rounded-md border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Version</TableHead>
                    <TableHead className="hidden md:table-cell">File</TableHead>
                    <TableHead className="hidden lg:table-cell">Size</TableHead>
                    <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">
                        {doc.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {CASE_DOCUMENT_TYPE_LABELS[doc.documentType as CaseDocumentType] ??
                            doc.documentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        v{doc.version}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[160px] truncate">
                        {doc.fileName ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                        {doc.createdAt
                          ? format(new Date(doc.createdAt), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canManage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                setUploadVersionTarget({
                                  id: doc.id,
                                  title: doc.title,
                                })
                              }
                            >
                              <Upload className="w-3.5 h-3.5 mr-1" />
                              <span className="hidden sm:inline">Version</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => openVersionHistory(doc.id)}
                          >
                            <History className="w-3.5 h-3.5 mr-1" />
                            <span className="hidden sm:inline">History</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <UploadDocumentDialog
        caseId={caseId}
        open={uploadDocOpen}
        onOpenChange={setUploadDocOpen}
        onSuccess={handleUploadSuccess}
      />

      {/* Upload Version Dialog */}
      <UploadVersionDialog
        documentId={uploadVersionTarget?.id ?? 0}
        documentTitle={uploadVersionTarget?.title ?? ""}
        open={uploadVersionTarget != null}
        onOpenChange={(open) => {
          if (!open) setUploadVersionTarget(null);
        }}
        onSuccess={handleUploadSuccess}
      />

      {/* Version History Sheet */}
      <VersionHistorySheet
        documentId={historyDocId}
        open={historyOpen}
        onOpenChange={(open) => {
          setHistoryOpen(open);
          if (!open) setHistoryDocId(null);
        }}
      />
    </div>
  );
}
