'use client';

import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Upload, FileText, Image, Film, Music, File, Download, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";

const EVIDENCE_TYPES = ["document","image","video","audio","physical","digital","other"] as const;
const CUSTODY_STATUSES = ["collected","in_storage","checked_out","submitted_to_court","destroyed","returned"];
const FILE_ICONS: Record<string, any> = { "application/pdf": FileText, "image/jpeg": Image, "image/png": Image, "video/mp4": Film, "audio/mpeg": Music };

function FileIcon({ mimeType }: { mimeType?: string | null }) {
  const Icon = mimeType ? (FILE_ICONS[mimeType] ?? File) : File;
  return <Icon className="w-4 h-4 text-accent" />;
}

export default function EvidenceList() {
  const [search, setSearch] = useState("");
  const [custodyFilter, setCustodyFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ caseId: "", type: "document" as typeof EVIDENCE_TYPES[number], description: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { data: cases, isLoading } = trpc.cases.list.useQuery({ status: undefined });
  const uploadEvidence = trpc.evidence.upload.useMutation({
    onSuccess: () => { toast.success("Evidence uploaded"); setOpen(false); setSelectedFile(null); },
    onError: (e) => toast.error(e.message),
  });
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !form.caseId) { toast.error("Please select a case and file"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1] ?? "";
        await uploadEvidence.mutateAsync({ caseId: parseInt(form.caseId), type: form.type, fileName: selectedFile!.name, fileBase64: base64, mimeType: selectedFile!.type, fileSize: selectedFile!.size, description: form.description || undefined });
        setUploading(false);
      };
      reader.onerror = () => { toast.error("File read failed"); setUploading(false); };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) { toast.error(err.message ?? "Upload failed"); setUploading(false); }
  };
  const filtered = (cases ?? []).filter(c =>
    c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Evidence Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{cases?.length ?? 0} cases with evidence</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-gradient text-white"><Plus className="w-4 h-4 mr-2" />Upload Evidence</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Upload Evidence</DialogTitle></DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4 mt-2">
                <div className="space-y-1.5"><Label>Case *</Label>
                  <select className="w-full border rounded px-3 py-2 text-sm" value={form.caseId} onChange={e => setForm(f => ({...f, caseId: e.target.value}))}>
                    <option value="">Select case...</option>
                    {(cases ?? []).map(c => <option key={c.id} value={String(c.id)}>{c.caseNumber} — {c.title}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><Label>Type *</Label>
                  <select className="w-full border rounded px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as typeof EVIDENCE_TYPES[number]}))}>  
                    {EVIDENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
                <div className="space-y-1.5"><Label>File *</Label>
                  <input ref={fileRef} type="file" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
                  <button type="button" className="w-full border rounded px-3 py-2 text-sm flex items-center gap-2" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" />{selectedFile ? selectedFile.name : "Choose File"}</button>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="bg-navy-gradient text-white flex-1" disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by filename or evidence number..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={custodyFilter} onValueChange={setCustodyFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EVIDENCE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case Number</TableHead>
                <TableHead>Case Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prosecutor</TableHead>
                <TableHead>Filed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map(i => <TableRow key={i}>{[1,2,3,4,5,6].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
              ) : !filtered.length ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />No cases found</TableCell></TableRow>
              ) : (
                filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.caseNumber}</TableCell>
                    <TableCell className="font-medium text-sm max-w-64 truncate">{c.title}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{c.status.replace("_"," ")}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{(c as any).leadProsecutorName ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.filedDate ? format(new Date(c.filedDate), "MMM d, yyyy") : "—"}</TableCell>
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
