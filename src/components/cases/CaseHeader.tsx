"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, Edit } from "lucide-react";
import { format } from "date-fns";
import { CaseStatusSelect } from "./CaseStatusSelect";
import { CASE_STATUS_LABELS } from "../../../drizzle/schema";
import type { CaseStatus } from "../../../drizzle/schema";

// The shape returned by trpc.cases.get (at minimum the fields we use here)
interface CaseHeaderData {
  id: number;
  caseNumber: string;
  title: string;
  status: string;
  priority?: string | null;
  updatedAt: Date | string;
}

interface CaseHeaderProps {
  caseData: CaseHeaderData;
  myPermissions: string[];
  onStatusChange?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  investigation: "bg-blue-100 text-blue-800 border-blue-200",
  submitted_to_da: "bg-yellow-100 text-yellow-800 border-yellow-200",
  case_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  filed: "bg-blue-100 text-blue-800 border-blue-200",
  warrant_requested: "bg-orange-100 text-orange-800 border-orange-200",
  warrant_issued: "bg-orange-100 text-orange-800 border-orange-200",
  arraignment: "bg-purple-100 text-purple-800 border-purple-200",
  preliminary_hearing: "bg-purple-100 text-purple-800 border-purple-200",
  pre_trial: "bg-purple-100 text-purple-800 border-purple-200",
  trial: "bg-indigo-100 text-indigo-800 border-indigo-200",
  verdict: "bg-indigo-100 text-indigo-800 border-indigo-200",
  sentencing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  appeal: "bg-amber-100 text-amber-800 border-amber-200",
  closed: "bg-green-100 text-green-800 border-green-200",
  dismissed: "bg-red-100 text-red-800 border-red-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 border-gray-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function CaseHeader({ caseData, myPermissions, onStatusChange }: CaseHeaderProps) {
  const canEdit = myPermissions.includes("edit_case");
  const statusColor =
    STATUS_COLORS[caseData.status] ?? "bg-gray-100 text-gray-700 border-gray-200";
  const priorityColor = caseData.priority
    ? PRIORITY_COLORS[caseData.priority] ?? "bg-gray-100 text-gray-700 border-gray-200"
    : null;

  const lastUpdated = caseData.updatedAt
    ? format(new Date(caseData.updatedAt), "MMM d, yyyy 'at' h:mm a")
    : null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {/* Left: case identity */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <Scale className="w-4.5 h-4.5 text-accent shrink-0" />
          <span className="font-mono text-sm text-muted-foreground">
            {caseData.caseNumber}
          </span>
          <Badge
            variant="outline"
            className={`text-xs font-medium ${statusColor}`}
          >
            {CASE_STATUS_LABELS[caseData.status as CaseStatus] ?? caseData.status}
          </Badge>
          {caseData.priority && (
            <Badge
              variant="outline"
              className={`text-xs font-medium ${priorityColor}`}
            >
              {PRIORITY_LABELS[caseData.priority] ?? caseData.priority}
            </Badge>
          )}
        </div>
        <h1 className="font-serif text-2xl font-bold text-foreground truncate">
          {caseData.title}
        </h1>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-1">
            Last updated {lastUpdated}
          </p>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <CaseStatusSelect
          caseId={caseData.id}
          currentStatus={caseData.status}
          onSuccess={onStatusChange}
        />
        {canEdit && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/cases/${caseData.id}/edit`}>
              <Edit className="w-4 h-4 mr-1.5" />
              Edit
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
