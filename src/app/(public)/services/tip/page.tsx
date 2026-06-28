'use client';

import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SubmitTip() {
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", subject: "", description: "" });
  const submitTip = trpc.open.submitTip.useMutation({
    onSuccess: () => { setSubmitted(true); },
    onError: (e) => toast.error(e.message),
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.description) { toast.error("Please fill in all required fields"); return; }
    submitTip.mutate({ isAnonymous, name: isAnonymous ? undefined : form.name, contact: isAnonymous ? undefined : form.contact, subject: form.subject, description: form.description });
  };
  return (
    <PublicLayout>
      <section className="bg-navy-gradient text-white py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Public Service</Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Submit a Tip</h1>
          <p className="text-white/70 max-w-2xl">Report criminal activity to the District Attorney's Office. You may submit anonymously.</p>
        </div>
      </section>
      <section className="py-12 bg-background">
        <div className="container max-w-2xl">
          {submitted ? (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h2 className="font-serif text-2xl font-bold mb-2">Tip Submitted</h2>
                <p className="text-muted-foreground">Thank you for your cooperation. Your tip has been received and will be reviewed by our team.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60">
              <CardContent className="p-6">
                <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">For emergencies, call 911. This form is for non-emergency tips only.</AlertDescription>
                </Alert>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div>
                      <Label className="font-medium">Submit Anonymously</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Your identity will not be recorded</p>
                    </div>
                    <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                  </div>
                  {!isAnonymous && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label>Your Name</Label><Input placeholder="Full name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
                      <div className="space-y-1.5"><Label>Contact Information</Label><Input placeholder="Phone or email" value={form.contact} onChange={e => setForm(f => ({...f, contact: e.target.value}))} /></div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Subject <span className="text-destructive">*</span></Label>
                    <Input placeholder="Brief description of the tip" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Details <span className="text-destructive">*</span></Label>
                    <Textarea placeholder="Provide as much detail as possible..." rows={6} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required />
                  </div>
                  <Button type="submit" className="w-full bg-navy-gradient text-white" disabled={submitTip.isPending}>
                    {submitTip.isPending ? "Submitting..." : "Submit Tip"}
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
