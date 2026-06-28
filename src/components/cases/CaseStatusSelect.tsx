"use client";

import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CASE_STATUS_LABELS } from "../../../drizzle/schema";
import type { CaseStatus } from "../../../drizzle/schema";
import { toast } from "sonner";

interface CaseStatusSelectProps {
  caseId: number;
  currentStatus: string;
  onSuccess?: () => void;
}

export function CaseStatusSelect({
  caseId,
  currentStatus,
  onSuccess,
}: CaseStatusSelectProps) {
  const { data: validTransitions, isLoading: transitionsLoading } =
    trpc.cases.getValidTransitions.useQuery({ caseId });

  const updateCase = trpc.cases.update.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      onSuccess?.();
    },
    onError: (e) => {
      if (e.data?.code === "BAD_REQUEST") {
        try {
          const parsed = JSON.parse(e.message);
          toast.error(
            `Invalid status transition: cannot move from "${
              CASE_STATUS_LABELS[parsed.currentStatus as CaseStatus] ??
              parsed.currentStatus
            }" to "${
              CASE_STATUS_LABELS[parsed.targetStatus as CaseStatus] ??
              parsed.targetStatus
            }"`
          );
        } catch {
          toast.error(e.message);
        }
      } else {
        toast.error(e.message);
      }
    },
  });

  // Build the list: current status (always shown) + valid transitions
  const statusOptions: CaseStatus[] = [
    currentStatus as CaseStatus,
    ...(validTransitions ?? []),
  ];

  const handleChange = (newStatus: string) => {
    if (newStatus === currentStatus) return;
    updateCase.mutate({ id: caseId, status: newStatus as CaseStatus });
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleChange}
      disabled={updateCase.isPending || transitionsLoading}
    >
      <SelectTrigger className="w-52 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((s) => (
          <SelectItem key={s} value={s}>
            {CASE_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
