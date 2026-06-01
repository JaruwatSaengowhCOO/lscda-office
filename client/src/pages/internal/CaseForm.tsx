import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function CaseForm() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({
    title: "", caseNumber: "", description: "", charges: "",
    status: "investigation" as const, court: "", arrestingAgency: "",
  });
  const createCase = trpc.cases.create.useMutation({
    onSuccess: (data) => { toast.success("Case created successfully"); setLocation(`/dashboard/cases/${data.id}`); },
    onError: (e) => toast.error(e.message),
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.caseNumber) { toast.error("Title and case number are required"); return; }
    createCase.mutate(form);
  };
  return (
    <InternalLayout>
      <div className="p-6 max-w-3xl">
        <Button asChild variant="ghost" className="mb-4 -ml-2">
          <Link href="/dashboard/cases"><ArrowLeft className="w-4 h-4 mr-2" />Back to Cases</Link>
        </Button>
        <h1 className="font-serif text-2xl font-bold mb-6">Create New Case</h1>
        <Card className="border-border/60">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Case Number <span className="text-destructive">*</span></Label>
                  <Input placeholder="LSCDA-2026-XXXXXX" value={form.caseNumber} onChange={e => setForm(f => ({...f, caseNumber: e.target.value}))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v as any}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["investigation","case_review","filed","arraignment","preliminary_hearing","trial","sentencing","closed","dismissed"].map(s => (
                        <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Case Title <span className="text-destructive">*</span></Label>
                <Input placeholder="People v. [Defendant Name]" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Charges</Label>
                <Input placeholder="e.g. PC 187 - Murder, PC 211 - Robbery" value={form.charges} onChange={e => setForm(f => ({...f, charges: e.target.value}))} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Court</Label>
                  <Input placeholder="e.g. Los Santos Superior Court" value={form.court} onChange={e => setForm(f => ({...f, court: e.target.value}))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Arresting Agency</Label>
                  <Input placeholder="e.g. LSPD, LSSD" value={form.arrestingAgency} onChange={e => setForm(f => ({...f, arrestingAgency: e.target.value}))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea placeholder="Brief case description..." rows={4} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="bg-navy-gradient text-white" disabled={createCase.isPending}>
                  {createCase.isPending ? "Creating..." : "Create Case"}
                </Button>
                <Button type="button" variant="outline" asChild><Link href="/dashboard/cases">Cancel</Link></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </InternalLayout>
  );
}
