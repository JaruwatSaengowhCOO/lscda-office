'use client';

import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus, Clock, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";

const HEARING_TYPES = ["Arraignment","Preliminary Hearing","Motion Hearing","Trial","Sentencing","Status Conference","Bail Hearing","Other"];

export default function CourtCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ caseId: "", hearingType: "Arraignment", scheduledAt: "", courtroom: "", judge: "", notes: "" });
  const { data: hearings, isLoading, refetch } = trpc.hearings.list.useQuery();
  const createHearing = trpc.hearings.create.useMutation({
    onSuccess: () => { toast.success("Hearing scheduled"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const { data: cases } = trpc.cases.list.useQuery({ status: undefined });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getHearingsForDay = (day: Date) =>
    (hearings ?? []).filter(h => isSameDay(new Date(h.scheduledAt), day));

  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Court Calendar</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{hearings?.length ?? 0} scheduled hearings</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-gradient text-white"><Plus className="w-4 h-4 mr-2" />Schedule Hearing</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Schedule New Hearing</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createHearing.mutate({ ...form, caseId: parseInt(form.caseId), scheduledAt: new Date(form.scheduledAt).getTime() }); }} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Case *</Label>
                  <Select value={form.caseId} onValueChange={v => setForm(f => ({...f, caseId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select case..." /></SelectTrigger>
                    <SelectContent>{(cases ?? []).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.caseNumber} — {c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Hearing Type *</Label>
                    <Select value={form.hearingType} onValueChange={v => setForm(f => ({...f, hearingType: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{HEARING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date & Time *</Label>
                    <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({...f, scheduledAt: e.target.value}))} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Courtroom</Label><Input placeholder="e.g. Dept. 47" value={form.courtroom} onChange={e => setForm(f => ({...f, courtroom: e.target.value}))} /></div>
                  <div className="space-y-1.5"><Label>Judge</Label><Input placeholder="Judge name" value={form.judge} onChange={e => setForm(f => ({...f, judge: e.target.value}))} /></div>
                </div>
                <div className="space-y-1.5"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="bg-navy-gradient text-white flex-1" disabled={createHearing.isPending || !form.caseId || !form.scheduledAt}>{createHearing.isPending ? "Scheduling..." : "Schedule Hearing"}</Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{format(currentDate, "MMMM yyyy")}</CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}>‹</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}>›</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map(day => {
                const dayHearings = getHearingsForDay(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                return (
                  <div key={day.toISOString()} className={`min-h-16 p-1 rounded-lg border text-xs ${isToday(day) ? "border-accent bg-accent/5" : "border-transparent"} ${!isCurrentMonth ? "opacity-30" : ""}`}>
                    <div className={`font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? "bg-accent text-white" : ""}`}>{format(day, "d")}</div>
                    {dayHearings.slice(0, 2).map(h => (
                      <div key={h.id} className="bg-primary/10 text-primary rounded px-1 py-0.5 truncate mb-0.5 text-[10px]">{h.hearingType}</div>
                    ))}
                    {dayHearings.length > 2 && <div className="text-muted-foreground text-[10px]">+{dayHearings.length - 2} more</div>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base">Upcoming Hearings</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : !hearings?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No hearings scheduled</div>
            ) : (
              <div className="space-y-2">
                {hearings.filter(h => new Date(h.scheduledAt) >= new Date()).slice(0, 10).map(h => (
                  <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{h.hearingType}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3" />{format(new Date(h.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
                        {h.courtroom && <><MapPin className="w-3 h-3 ml-1" />{h.courtroom}</>}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize shrink-0">{h.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </InternalLayout>
  );
}
