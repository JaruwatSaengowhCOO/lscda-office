import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, Scale, Calendar, AlertTriangle, FileText, MessageSquare } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const TYPE_ICONS: Record<string, any> = {
  case_update: Scale, hearing_reminder: Calendar, warrant_update: FileText,
  complaint_received: AlertTriangle, new_tip: MessageSquare, system: Bell,
};

export default function Notifications() {
  const { data, isLoading, refetch } = trpc.notifications.list.useQuery();
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e.message),
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { toast.success("All marked as read"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const unreadCount = (data ?? []).filter(n => !n.isRead).length;
  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <CheckCheck className="w-4 h-4 mr-1.5" />Mark All Read
            </Button>
          )}
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !data?.length ? (
              <div className="text-center py-16 text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.map(n => {
                  const Icon = TYPE_ICONS[n.type ?? "system"] ?? Bell;
                  return (
                    <div key={n.id} className={`flex items-start gap-3 p-4 transition-colors ${!n.isRead ? "bg-accent/5" : ""}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? "bg-accent/20" : "bg-muted"}`}>
                        <Icon className={`w-4 h-4 ${!n.isRead ? "text-accent" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className={`text-sm font-medium ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                          </div>
                          {!n.isRead && <Badge className="bg-accent text-white text-[10px] shrink-0">New</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ""}</div>
                      </div>
                      {!n.isRead && (
                        <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={() => markRead.mutate({ id: n.id })}>
                          Mark Read
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </InternalLayout>
  );
}
