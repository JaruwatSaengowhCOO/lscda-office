"use client";

import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  ArrowRight,
  Upload,
  Shield,
  Package,
  Calendar,
  User,
  Lock,
  Activity,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// ─── Action icon map ──────────────────────────────────────────────────────────

function getActionIcon(action: string) {
  switch (action) {
    case "case_created":
      return FileText;
    case "status_changed":
      return ArrowRight;
    case "document_uploaded":
    case "document_version_added":
      return Upload;
    case "warrant_submitted":
    case "warrant_approved":
      return Shield;
    case "evidence_added":
      return Package;
    case "hearing_scheduled":
      return Calendar;
    case "witness_added":
      return User;
    case "permission_updated":
    case "permission_toggled":
      return Lock;
    default:
      return Activity;
  }
}

function formatActionLabel(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TimelineTabProps {
  caseId: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TimelineTab({ caseId }: TimelineTabProps) {
  const { data: entries, isLoading } = trpc.cases.getActivityLog.useQuery(
    { caseId },
    { enabled: !!caseId }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <Skeleton className="w-0.5 h-12 mt-2" />
            </div>
            <div className="flex-1 pb-4 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Activity className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flow-root">
        <ul className="-mb-6">
          {entries.map((entry, index) => {
            const Icon = getActionIcon(entry.action);
            const isLast = index === entries.length - 1;
            const createdAt = new Date(entry.createdAt);
            const relativeTime = formatDistanceToNow(createdAt, { addSuffix: true });
            const absoluteTime = format(createdAt, "MMMM d, yyyy 'at' h:mm a");

            return (
              <li key={entry.id}>
                <div className="relative pb-6">
                  {/* Vertical connector line */}
                  {!isLast && (
                    <span
                      className="absolute left-4 top-8 -ml-px h-full w-0.5 bg-border"
                      aria-hidden="true"
                    />
                  )}

                  <div className="relative flex gap-3">
                    {/* Icon bubble */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border/60">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>

                    {/* Entry content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {formatActionLabel(entry.action)}
                        </span>
                        {entry.userName && (
                          <span className="text-xs text-muted-foreground">
                            by {entry.userName}
                          </span>
                        )}
                      </div>

                      {entry.details && (
                        <p className="mt-0.5 text-sm text-muted-foreground leading-snug">
                          {entry.details}
                        </p>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <time
                            dateTime={createdAt.toISOString()}
                            className="mt-1 inline-block text-xs text-muted-foreground/70 cursor-default hover:text-muted-foreground transition-colors"
                          >
                            {relativeTime}
                          </time>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>{absoluteTime}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </TooltipProvider>
  );
}
