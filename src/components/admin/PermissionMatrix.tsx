"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DA_ROLE_LABELS, DA_ROLE_ORDER } from "../../../shared/permissions";
import type { DaRole, Permission } from "../../../shared/permissions";

// ─── Permission grouping ──────────────────────────────────────────────────────

interface PermissionGroup {
  label: string;
  permissions: Array<{ key: Permission; label: string }>;
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "Cases",
    permissions: [
      { key: "view_case",    label: "View Case" },
      { key: "create_case",  label: "Create Case" },
      { key: "edit_case",    label: "Edit Case" },
      { key: "assign_case",  label: "Assign Case" },
      { key: "close_case",   label: "Close Case" },
      { key: "delete_case",  label: "Delete Case" },
    ],
  },
  {
    label: "Evidence",
    permissions: [
      { key: "view_evidence",   label: "View Evidence" },
      { key: "upload_evidence", label: "Upload Evidence" },
    ],
  },
  {
    label: "Warrants",
    permissions: [
      { key: "view_warrant",    label: "View Warrant" },
      { key: "create_warrant",  label: "Create Warrant" },
      { key: "approve_warrant", label: "Approve Warrant" },
    ],
  },
  {
    label: "Hearings",
    permissions: [
      { key: "view_hearing",   label: "View Hearing" },
      { key: "create_hearing", label: "Create Hearing" },
    ],
  },
  {
    label: "Case Documents",
    permissions: [
      { key: "view_case_documents",   label: "View Documents" },
      { key: "manage_case_documents", label: "Manage Documents" },
    ],
  },
  {
    label: "Witnesses",
    permissions: [
      { key: "view_witnesses",   label: "View Witnesses" },
      { key: "manage_witnesses", label: "Manage Witnesses" },
    ],
  },
  {
    label: "Defendants",
    permissions: [
      { key: "view_defendants", label: "View Defendants" },
      { key: "edit_defendants", label: "Edit Defendants" },
    ],
  },
  {
    label: "Victims",
    permissions: [
      { key: "view_victims", label: "View Victims" },
      { key: "edit_victims", label: "Edit Victims" },
    ],
  },
  {
    label: "Complaints",
    permissions: [
      { key: "view_complaints",   label: "View Complaints" },
      { key: "manage_complaints", label: "Manage Complaints" },
    ],
  },
  {
    label: "Reports",
    permissions: [
      { key: "view_reports",   label: "View Reports" },
      { key: "export_reports", label: "Export Reports" },
    ],
  },
  {
    label: "Documents & Research",
    permissions: [
      { key: "manage_documents",       label: "Manage Documents" },
      { key: "manage_legal_research",  label: "Manage Legal Research" },
      { key: "manage_press_releases",  label: "Manage Press Releases" },
    ],
  },
  {
    label: "Tips & Requests",
    permissions: [
      { key: "view_tips",      label: "View Tips" },
      { key: "manage_tips",    label: "Manage Tips" },
      { key: "view_requests",  label: "View Requests" },
      { key: "manage_requests", label: "Manage Requests" },
    ],
  },
  {
    label: "Admin",
    permissions: [
      { key: "manage_users",        label: "Manage Users" },
      { key: "view_activity_logs",  label: "View Activity Logs" },
    ],
  },
];

// Build a flat map of all permissions for quick lookup
const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
);

// ─── Types ────────────────────────────────────────────────────────────────────

/** Optimistic state: track pending cell toggles that haven't settled yet */
type PendingKey = `${DaRole}:${Permission}`;

// ─── Component ────────────────────────────────────────────────────────────────

export function PermissionMatrix() {
  const utils = trpc.useUtils();

  // Fetch the full role × permission matrix from the server
  const {
    data: matrix,
    isLoading,
    isError,
    refetch,
  } = trpc.permissions.getMatrix.useQuery(undefined, {
    staleTime: 30_000,
  });

  /**
   * Optimistic override map — key: "role:permission", value: true|false
   * Populated immediately when the user clicks a cell; cleared on settle.
   */
  const [optimistic, setOptimistic] = useState<Map<PendingKey, boolean>>(
    new Map()
  );

  // Track which cells are in-flight to prevent double-clicking
  const [pending, setPending] = useState<Set<PendingKey>>(new Set());

  // ── Toggle mutation ─────────────────────────────────────────────────────────
  const toggleMutation = trpc.permissions.togglePermission.useMutation({
    onSuccess: (_data, variables) => {
      const key: PendingKey = `${variables.role}:${variables.permission as Permission}`;
      // Remove optimistic override; query will reflect the real value
      setOptimistic((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      // Refetch matrix so all tabs / components see the new state
      utils.permissions.getMatrix.invalidate();
      toast.success(`Permission ${variables.granted ? "granted" : "revoked"}`);
    },
    onError: (err, variables) => {
      const key: PendingKey = `${variables.role}:${variables.permission as Permission}`;
      // Revert optimistic change
      setOptimistic((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      toast.error(`Failed to update permission: ${err.message}`);
    },
  });

  // ── Cell toggle handler ─────────────────────────────────────────────────────
  const handleToggle = useCallback(
    (role: DaRole, permission: Permission, currentValue: boolean) => {
      const key: PendingKey = `${role}:${permission}`;
      if (pending.has(key)) return; // already in-flight

      const newValue = !currentValue;

      // Apply optimistic update
      setOptimistic((prev) => new Map(prev).set(key, newValue));
      setPending((prev) => new Set(prev).add(key));

      toggleMutation.mutate({ role, permission, granted: newValue });
    },
    [pending, toggleMutation]
  );

  // ── Resolved cell value (optimistic takes precedence) ──────────────────────
  function getCellValue(role: DaRole, permission: Permission): boolean {
    const key: PendingKey = `${role}:${permission}`;
    if (optimistic.has(key)) return optimistic.get(key)!;
    const rolePerms = matrix?.[role] ?? [];
    return rolePerms.includes(permission);
  }

  // ── Roles to display (filter to only roles present in DA_ROLE_ORDER) ────────
  const roles = DA_ROLE_ORDER;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <ShieldOff className="w-10 h-10 opacity-30" />
        <p className="text-sm">Failed to load permission matrix.</p>
        <button
          className="text-xs text-accent hover:underline flex items-center gap-1"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-3 h-3" />
          Try again
        </button>
      </div>
    );
  }

  // ── Summary badges ──────────────────────────────────────────────────────────
  const totalPerms = ALL_PERMISSION_KEYS.length;
  const roleGrantCounts = roles.reduce<Record<DaRole, number>>((acc, role) => {
    acc[role] = ALL_PERMISSION_KEYS.filter((p) => getCellValue(role, p)).length;
    return acc;
  }, {} as Record<DaRole, number>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold">Permission Matrix</h2>
        <Badge variant="outline" className="text-xs font-normal">
          {totalPerms} permissions × {roles.length} roles
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Toggle each cell to grant or revoke a permission for a role. Changes
        take effect immediately (within the 60-second cache window for active
        sessions).
      </p>

      {/* Scrollable container */}
      <div className="overflow-x-auto rounded-md border border-border/60">
        <Table>
          <TableHeader>
            {/* Role header row */}
            <TableRow className="bg-muted/40">
              <TableHead className="w-52 min-w-[13rem] sticky left-0 bg-muted/40 border-r border-border/40 z-10">
                Permission
              </TableHead>
              {roles.map((role) => (
                <TableHead
                  key={role}
                  className="text-center min-w-[9rem] px-2"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium leading-tight whitespace-normal text-center">
                      {DA_ROLE_LABELS[role]}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal px-1.5 py-0 bg-background"
                    >
                      {roleGrantCounts[role]}/{totalPerms}
                    </Badge>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {PERMISSION_GROUPS.map((group) => (
              <>
                {/* Group header row */}
                <TableRow
                  key={`group-${group.label}`}
                  className="bg-muted/20 hover:bg-muted/20"
                >
                  <TableCell
                    colSpan={roles.length + 1}
                    className="py-1.5 px-3 sticky left-0"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </span>
                  </TableCell>
                </TableRow>

                {/* Permission rows */}
                {group.permissions.map(({ key: permission, label }) => (
                  <TableRow
                    key={permission}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Permission label (sticky left) */}
                    <TableCell className="sticky left-0 bg-background border-r border-border/40 z-10 py-2.5 px-3">
                      <span className="text-sm">{label}</span>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {permission}
                      </div>
                    </TableCell>

                    {/* One cell per role */}
                    {roles.map((role) => {
                      const key: PendingKey = `${role}:${permission}`;
                      const isChecked = getCellValue(role, permission);
                      const isInFlight = pending.has(key);

                      return (
                        <TableCell
                          key={role}
                          className="text-center px-2 py-2.5"
                        >
                          <div className="flex justify-center">
                            <Checkbox
                              checked={isChecked}
                              disabled={isInFlight}
                              onCheckedChange={() =>
                                handleToggle(role, permission, isChecked)
                              }
                              aria-label={`${isChecked ? "Revoke" : "Grant"} ${label} for ${DA_ROLE_LABELS[role]}`}
                              className={
                                isInFlight
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }
                            />
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Note: Page-level access controls (
        <code className="bg-muted rounded px-1 text-[11px]">page:</code> keys)
        are managed separately and are not shown here.
      </p>
    </div>
  );
}
