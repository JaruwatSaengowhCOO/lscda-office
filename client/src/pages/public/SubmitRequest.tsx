import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SubmitRequest() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", requestType: "general_inquiry" as any, description: "", caseNumberRef: "" });
  const submitRequest = trpc.public.submitRequest.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => toast.error(e.message),
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.description) { toast.error("Please fill in all required fields"); return; }
    submitRequest.mutate(form);
  };
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Public Service</Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Submit a Request</h1>
          <p className="text-white/70 max-w-2xl">Submit a request for documents, case information, or general inquiries. We will respond within 5-7 business days.</p>
        </div>
      </section>
      <section className="py-12 bg-background">
        <div className="container max-w-2xl">
          {submitted ? (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h2 className="font-serif text-2xl font-bold mb-2">Request Submitted</h2>
                <p className="text-muted-foreground">Your request has been received. We will respond within 5-7 business days.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Full Name <span className="text-destructive">*</span></Label><Input placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required /></div>
                    <div className="space-y-1.5"><Label>Contact <span className="text-destructive">*</span></Label><Input placeholder="Phone or email" value={form.contact} onChange={e => setForm(f => ({...f, contact: e.target.value}))} required /></div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Request Type <span className="text-destructive">*</span></Label>
                    <Select value={form.requestType} onValueChange={v => setForm(f => ({...f, requestType: v as any}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="case_status">Case Status Inquiry</SelectItem>
                        <SelectItem value="document_request">Document Request</SelectItem>
                        <SelectItem value="general_inquiry">General Inquiry</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Case Number (if applicable)</Label><Input placeholder="e.g. LSCDA-2026-XXXXXX" value={form.caseNumberRef} onChange={e => setForm(f => ({...f, caseNumberRef: e.target.value}))} /></div>
                  <div className="space-y-1.5">
                    <Label>Description <span className="text-destructive">*</span></Label>
                    <Textarea placeholder="Describe your request in detail..." rows={5} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required />
                  </div>
                  <Button type="submit" className="w-full bg-navy-gradient text-white" disabled={submitRequest.isPending}>
                    {submitRequest.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
