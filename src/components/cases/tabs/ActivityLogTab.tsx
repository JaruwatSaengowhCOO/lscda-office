"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ArrowUp, ArrowDown, ShieldOff } from "lucide-react";
import { format } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatActionLabel(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SortDirection = "asc" | "desc";

interface ActivityLogTabProps {
  caseId: number;
  permissions: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityLogTab({ caseId, permissions }: ActivityLogTabProps) {
  // Permission gate
  if (!permissions.includes("view_activity_logs")) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <ShieldOff className="w-8 h-8 opacity-40" />
        <p className="text-sm">You don&apos;t have permission to view activity logs</p>
      </div>
    );
  }

  return <ActivityLogContent caseId={caseId} />;
}

// ─── Inner content (rendered only when permission is granted) ─────────────────

function ActivityLogContent({ caseId }: { caseId: number }) {
  const { data: entries, isLoading } = trpc.cases.getActivityLog.useQuery(
    { caseId },
    { enabled: !!caseId }
  );

  // Filter state
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Sort state – default newest first
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // Derive unique action types from data
  const actionTypes = useMemo(() => {
    if (!entries) return [];
    return Array.from(new Set(entries.map((e) => e.action))).sort();
  }, [entries]);

  // Apply filters + sort
  const filtered = useMemo(() => {
    if (!entries) return [];

    let result = [...entries];

    if (actionTypeFilter !== "all") {
      result = result.filter((e) => e.action === actionTypeFilter);
    }

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      result = result.filter((e) => new Date(e.createdAt) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter((e) => new Date(e.createdAt) <= to);
    }

    result.sort((a, b) => {
      const diff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? diff : -diff;
    });

    return result;
  }, [entries, actionTypeFilter, fromDate, toDate, sortDir]);

  const handleClearFilters = () => {
    setActionTypeFilter("all");
    setFromDate("");
    setToDate("");
  };

  const hasActiveFilters =
    actionTypeFilter !== "all" || fromDate !== "" || toDate !== "";

  const toggleSort = () => {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="rounded-md border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {["Timestamp", "Action Type", "Actor", "Details"].map((h) => (
                  <TableHead key={h}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Action type select */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Action Type</span>
          <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
            <SelectTrigger className="h-9 w-48">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map((action) => (
                <SelectItem key={action} value={action}>
                  {formatActionLabel(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* From date */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">From</span>
          <Input
            type="date"
            className="h-9 w-40"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={toDate || undefined}
          />
        </div>

        {/* To date */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">To</span>
          <Input
            type="date"
            className="h-9 w-40"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate || undefined}
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 self-end"
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 font-medium hover:bg-transparent"
                  onClick={toggleSort}
                >
                  Timestamp
                  {sortDir === "desc" ? (
                    <ArrowDown className="ml-1.5 w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ArrowUp className="ml-1.5 w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </Button>
              </TableHead>
              <TableHead>Action Type</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {hasActiveFilters
                    ? "No entries match the current filters."
                    : "No activity recorded yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                    {format(new Date(entry.createdAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-medium">
                      {formatActionLabel(entry.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.userName ?? (
                      <span className="text-muted-foreground italic">System</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {entry.details ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Row count */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {entries?.length ?? 0} entries
      </p>
    </div>
  );
}
