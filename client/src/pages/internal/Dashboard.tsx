import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { FolderOpen, Clock, Calendar, TrendingUp, Plus, ArrowRight, Scale, Users, FileSearch } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const STATUS_LABELS: Record<string, string> = {
  investigation: "Investigation", case_review: "Case Review", filed: "Filed",
  arraignment: "Arraignment", preliminary_hearing: "Preliminary Hearing",
  trial: "Trial", sentencing: "Sentencing", closed: "Closed", dismissed: "Dismissed",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.reports.dashboard.useQuery();
  const { data: upcomingHearings, isLoading: hearingsLoading } = trpc.hearings.upcoming.useQuery();
  const { data: recentCasesData, isLoading: casesLoading } = trpc.cases.list.useQuery({ status: undefined });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const statCards = [
    { title: "Active Cases", value: stats?.activeCases ?? 0, icon: FolderOpen, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", change: "Currently open" },
    { title: "Pending Reviews", value: stats?.pendingReviews ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", change: "Needs attention" },
    { title: "Upcoming Hearings", value: stats?.upcomingHearings ?? 0, icon: Calendar, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", change: "Next 7 days" },
    { title: "Conviction Rate", value: `${stats?.convictionRate ?? 0}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", change: "This year" },
  ];

  return (
    <InternalLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">{greeting}, {user?.name?.split(" ")[0] ?? "Officer"}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          </div>
          <Button asChild className="bg-navy-gradient text-white hidden sm:flex">
            <Link href="/dashboard/cases/new"><Plus className="w-4 h-4 mr-2" />New Case</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="border-border/60">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  {statsLoading ? <Skeleton className="h-8 w-16 mb-1" /> : (
                    <div className="font-serif text-2xl font-bold text-foreground">{card.value}</div>
                  )}
                  <div className="text-sm font-medium text-foreground mt-0.5">{card.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{card.change}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!statsLoading && stats && (
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">Case Outcome Overview</h3>
                  <p className="text-xs text-muted-foreground">Total cases: {stats.totalCases}</p>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{stats.convictionRate}% conviction rate</Badge>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Closed", value: stats.closedCases ?? 0, total: stats.totalCases ?? 0, cls: "" },
                  { label: "Active", value: stats.activeCases ?? 0, total: stats.totalCases ?? 0, cls: "[&>div]:bg-blue-500" },
                  { label: "Dismissed", value: stats.dismissedCases ?? 0, total: stats.totalCases ?? 0, cls: "[&>div]:bg-gray-400" },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>{row.label}</span><span>{row.value}</span></div>
                    <Progress value={((row.value as number) / Math.max(row.total as number, 1)) * 100} className={`h-2 ${row.cls}`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Cases</CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-xs text-accent">
                  <Link href="/dashboard/cases">View All <ArrowRight className="ml-1 w-3 h-3" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {casesLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !recentCasesData?.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No cases found</div>
              ) : (
                <div className="space-y-2">
                  {recentCasesData.slice(0, 5).map(c => (
                    <Link key={c.id} href={`/dashboard/cases/${c.id}`}>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Scale className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{c.title}</div>
                          <div className="text-xs text-muted-foreground font-mono">{c.caseNumber}</div>
                        </div>
                        <Badge className={`status-${c.status} text-xs shrink-0`}>{STATUS_LABELS[c.status] ?? c.status}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Upcoming Hearings</CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-xs text-accent">
                  <Link href="/dashboard/calendar">View Calendar <ArrowRight className="ml-1 w-3 h-3" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {hearingsLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !upcomingHearings?.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No upcoming hearings</div>
              ) : (
                <div className="space-y-2">
                  {upcomingHearings.slice(0, 5).map(h => (
                    <div key={h.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{h.hearingType}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(h.scheduledAt), "MMM d, yyyy 'at' h:mm a")}{h.courtroom ? ` · ${h.courtroom}` : ""}</div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">{formatDistanceToNow(new Date(h.scheduledAt), { addSuffix: true })}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: FolderOpen, label: "New Case", href: "/dashboard/cases/new", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
              { icon: Users, label: "Defendants", href: "/dashboard/defendants", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
              { icon: Calendar, label: "Schedule Hearing", href: "/dashboard/calendar", color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
              { icon: FileSearch, label: "Issue Warrant", href: "/dashboard/warrants", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card className="card-hover cursor-pointer border-border/60 h-full">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
                      <span className="text-sm font-medium text-foreground">{action.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </InternalLayout>
  );
}
