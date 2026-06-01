import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FileBarChart, Download, TrendingUp, Scale, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const CHART_COLORS = ["#1e3a5f", "#c9a84c", "#2563eb", "#16a34a", "#dc2626", "#7c3aed"];

export default function Reports() {
  const [reportType, setReportType] = useState("monthly");
  const { data: stats, isLoading } = trpc.reports.dashboard.useQuery();
  const { data: convictionStats } = trpc.reports.convictionStats.useQuery();
  const { data: monthlyData } = trpc.reports.monthly.useQuery({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  const handleExport = (format: "pdf" | "excel") => {
    toast.info(`Exporting ${reportType} report as ${format.toUpperCase()}... (Feature in development)`);
  };

  const statusChartData = (convictionStats?.statusBreakdown ?? []).map((item: any) => ({
    name: String(item.status ?? "").replace(/_/g," "),
    value: Number(item.count ?? 0),
  }));

  return (
    <InternalLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Case statistics and prosecution metrics</p>
          </div>
          <div className="flex gap-2">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="conviction">Conviction Statistics</SelectItem>
                <SelectItem value="closure">Case Closure Report</SelectItem>
                <SelectItem value="budget">Budget Report</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExport("pdf")}><Download className="w-4 h-4 mr-1.5" />PDF</Button>
            <Button variant="outline" onClick={() => handleExport("excel")}><Download className="w-4 h-4 mr-1.5" />Excel</Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            [1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)
          ) : [
            { label: "Total Cases", value: stats?.totalCases ?? 0, icon: Scale, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
            { label: "Active Cases", value: stats?.activeCases ?? 0, icon: FileBarChart, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
            { label: "Closed Cases", value: stats?.closedCases ?? 0, icon: CheckCircle2, color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
            { label: "Dismissed", value: stats?.dismissedCases ?? 0, icon: XCircle, color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
          ].map(card => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="border-border/60">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg ${card.color.split(" ").slice(1).join(" ")} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${card.color.split(" ")[0]}`} />
                  </div>
                  <div className="font-serif text-2xl font-bold text-foreground">{card.value}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{card.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Conviction Rate */}
        {!isLoading && stats && (
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                <h3 className="font-semibold">Conviction Rate</h3>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 ml-auto">{stats.convictionRate}%</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div className="bg-accent h-3 rounded-full transition-all duration-700" style={{ width: `${stats.convictionRate}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{stats.closedCases} closed out of {stats.totalCases} total cases</p>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Cases by Status */}
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base">Cases by Status</CardTitle></CardHeader>
            <CardContent>
              {!statusChartData.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {statusChartData.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Case Trend</CardTitle></CardHeader>
            <CardContent>
              {!monthlyData ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No monthly data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyData ? [monthlyData] : []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="cases" fill="#1e3a5f" radius={[4,4,0,0]} name="Cases" />
                    <Bar dataKey="closed" fill="#c9a84c" radius={[4,4,0,0]} name="Closed" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </InternalLayout>
  );
}
