'use client';

import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Search, FileText, Scale, Shield, BookMarked, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORIES = [
  { value: "penal_code", label: "Penal Code", icon: Scale },
  { value: "case_law", label: "Case Law", icon: BookOpen },
  { value: "department_policy", label: "Department Policies", icon: Shield },
  { value: "memorandum", label: "Memorandums", icon: FileText },
  { value: "training_material", label: "Training Material", icon: GraduationCap },
];

export default function LegalResearch() {
  const [activeTab, setActiveTab] = useState("penal_code");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "penal_code" as any, content: "", citation: "", tags: "" });
  const { data, isLoading, refetch } = trpc.content.legalResearch.useQuery({ category: activeTab as any });
  const create = trpc.content.createLegalResearch.useMutation({
    onSuccess: () => { toast.success("Entry added"); setOpen(false); setForm({ title: "", category: "penal_code" as any, content: "", citation: "", tags: "" }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const filtered = (data ?? []).filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    (item.content ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (item.tags ?? "").toLowerCase().includes(search.toLowerCase())
  );
  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Legal Research Center</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Legal database and reference materials</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-gradient text-white"><Plus className="w-4 h-4 mr-2" />Add Entry</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Add Legal Research Entry</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); create.mutate(form); }} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Title *</Label>
                    <Input placeholder="Entry title" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category *</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v as any}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Citation / Code Reference</Label><Input placeholder="e.g. PC 187, People v. Smith (2020)" value={form.citation} onChange={e => setForm(f => ({...f, citation: e.target.value}))} /></div>
                <div className="space-y-1.5"><Label>Content *</Label><Textarea rows={6} placeholder="Full text or summary..." value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} required /></div>
                <div className="space-y-1.5"><Label>Tags</Label><Input placeholder="Comma-separated tags" value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} /></div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="bg-navy-gradient text-white flex-1" disabled={create.isPending}>{create.isPending ? "Adding..." : "Add Entry"}</Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search legal database..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setSearch(""); }}>
          <TabsList className="flex-wrap h-auto gap-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return <TabsTrigger key={cat.value} value={cat.value} className="text-xs"><Icon className="w-3.5 h-3.5 mr-1.5" />{cat.label}</TabsTrigger>;
            })}
          </TabsList>
          {CATEGORIES.map(cat => (
            <TabsContent key={cat.value} value={cat.value} className="mt-4">
              {isLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : !filtered.length ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No entries in {cat.label}</p>
                  <p className="text-sm mt-1">Click "Add Entry" to add the first entry.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(item => (
                    <Card key={item.id} className="card-hover border-border/60">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          {item.tags && <Badge variant="outline" className="text-xs font-mono shrink-0">{item.tags}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{item.content}</p>
                        {item.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.split(",").map(tag => (
                              <Badge key={tag.trim()} variant="secondary" className="text-xs">{tag.trim()}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">{item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy") : ""}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </InternalLayout>
  );
}
