import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Upload, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DocumentsAdmin() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "form" as any, isPublic: true });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, refetch } = trpc.content.documents.useQuery();
  const create = trpc.content.uploadDocument.useMutation({
    onSuccess: () => { toast.success("Document uploaded"); setOpen(false); setForm({ title: "", description: "", category: "form" as any, isPublic: true }); setSelectedFile(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.content.uploadDocument.useMutation({
    onSuccess: () => { toast.success("Deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { toast.error("Please select a file"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1] ?? "";
        await create.mutateAsync({ ...form, fileName: selectedFile!.name, fileBase64: base64, mimeType: selectedFile!.type, fileSize: selectedFile!.size });
        setUploading(false);
      };
      reader.onerror = () => { toast.error("File read failed"); setUploading(false); };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) { toast.error(err.message ?? "Upload failed"); setUploading(false); }
  };
  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-foreground">Documents (Admin)</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-gradient text-white"><Plus className="w-4 h-4 mr-2" />Upload Document</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required /></div>
                <div className="space-y-1.5"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v as any}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["form","policy","template","report","other"].map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <div className="flex items-center gap-2"><Switch checked={form.isPublic} onCheckedChange={v => setForm(f => ({...f, isPublic: v}))} /><Label>Public</Label></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>File *</Label>
                  <input ref={fileRef} type="file" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
                  <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />{selectedFile ? selectedFile.name : "Choose File"}
                  </Button>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="bg-navy-gradient text-white flex-1" disabled={uploading || create.isPending}>{uploading ? "Uploading..." : "Upload"}</Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Card className="border-border/60">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Visibility</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? [1,2,3].map(i => <TableRow key={i}>{[1,2,3,4].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>) :
              !data?.length ? <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />No documents</TableCell></TableRow> :
              data.map((doc: any) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium max-w-64 truncate">{doc.title}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{doc.category}</Badge></TableCell>
                  <TableCell><Badge variant={doc.isPublic ? "default" : "secondary"} className="text-xs">{doc.isPublic ? "Public" : "Internal"}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm" className="text-destructive" onClick={() => toast.info('Delete feature coming soon')}><Trash2 className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </InternalLayout>
  );
}
