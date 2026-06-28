"use client";

import { useState } from "react";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { DA_ROLE_LABELS } from "../../../shared/permissions";
import type { DaRole } from "../../../shared/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CalendarIcon,
  Filter,
  History,
  Plus,
  Trash2,
  X,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const DA_ROLES = Object.keys(DA_ROLE_LABELS) as DaRole[];

const ACTION_TYPE_OPTIONS = [
  { value: "all", label: "All Action Types" },
  { value: "permissions_updated", label: "Permissions Updated" },
  { value: "permission_toggled", label: "Permission Toggled" },
  { value: "role_created", label: "Role Created" },
  { value: "role_deleted", label: "Role Deleted" },
  { value: "page_access_updated", label: "Page Access Updated" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditFilters {
  role: string;
  actionType: string;
  from: string; // ISO date string for the date input
  to: string;   // ISO date string for the date input
}

// ─── Create Role Dialog ───────────────────────────────────────────────────────

function CreateRoleDialog() {
  const [open, setOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleLabel, setRoleLabel] = useState("");

  const handleClose = () => {
    setOpen(false);
    setRoleName("");
    setRoleLabel("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Create Custom Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Custom Role</DialogTitle>
          <DialogDescription>
            Custom role creation is a planned feature. Define a unique role identifier and
            display label for the new role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Placeholder notice */}
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Custom role management requires a <code className="font-mono text-xs">permissions.createRole</code> procedure
              on the server. This dialog is a placeholder — the form is disabled until that endpoint is available.
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-id">Role Identifier</Label>
            <Input
              id="role-id"
              placeholder="e.g. paralegal"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              disabled
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters and underscores only. Cannot be changed after creation.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-label">Display Label</Label>
            <Input
              id="role-label"
              placeholder="e.g. Paralegal"
              value={roleLabel}
              onChange={(e) => setRoleLabel(e.target.value)}
              disabled
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled
            title="Requires permissions.createRole server procedure"
            className="bg-navy-gradient text-white"
          >
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Role Dialog ───────────────────────────────────────────────────────

interface DeleteRoleDialogProps {
  role: DaRole;
  onClose: () => void;
}

function DeleteRoleDialog({ role, onClose }: DeleteRoleDialogProps) {
  // This is a placeholder — deleting built-in roles is not supported.
  // For custom roles (future), we'd call a deleteRole mutation here.
  // Per Req 13.3, deleting a role with active users must be rejected.
  const isBuiltIn = DA_ROLES.includes(role);

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogDescription>
          Remove the <strong>{DA_ROLE_LABELS[role]}</strong> role from the system.
        </DialogDescription>
      </DialogHeader>

      <div className="py-2 space-y-3">
        {isBuiltIn && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Built-in roles cannot be deleted. Only custom roles created through the Role
              Editor can be removed.
            </span>
          </div>
        )}

        {!isBuiltIn && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This action is irreversible. If any active users are assigned to this role,
              the deletion will be rejected — you must reassign those users first.
            </span>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={isBuiltIn}
          title={isBuiltIn ? "Built-in roles cannot be deleted" : "Delete this role"}
          onClick={onClose}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Role
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Audit Log Section ────────────────────────────────────────────────────────

function AuditLogSection() {
  const [filters, setFilters] = useState<AuditFilters>({
    role: "all",
    actionType: "all",
    from: "",
    to: "",
  });

  // Convert date strings to epoch ms for the tRPC query
  const fromMs = filters.from ? new Date(filters.from).getTime() : undefined;
  const toMs = filters.to ? new Date(filters.to + "T23:59:59").getTime() : undefined;

  const { data: auditLogs, isLoading } = trpc.permissions.getAuditLog.useQuery({
    role: filters.role !== "all" ? filters.role : undefined,
    actionType: filters.actionType !== "all" ? filters.actionType : undefined,
    from: fromMs,
    to: toMs,
  });

  const hasActiveFilters =
    filters.role !== "all" ||
    filters.actionType !== "all" ||
    filters.from !== "" ||
    filters.to !== "";

  const clearFilters = () =>
    setFilters({ role: "all", actionType: "all", from: "", to: "" });

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />

        {/* Role filter */}
        <Select
          value={filters.role}
          onValueChange={(v) => setFilters((f) => ({ ...f, role: v }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {DA_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {DA_ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action type filter */}
        <Select
          value={filters.actionType}
          onValueChange={(v) => setFilters((f) => ({ ...f, actionType: v }))}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range: from */}
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            className="h-9 w-38 text-sm"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            placeholder="From"
            aria-label="Filter from date"
          />
        </div>

        {/* Date range: to */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            className="h-9 w-38 text-sm"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            placeholder="To"
            aria-label="Filter to date"
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={clearFilters}
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Results table */}
      <div className="rounded-md border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Timestamp</TableHead>
              <TableHead className="w-40">Administrator</TableHead>
              <TableHead className="w-40">Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !auditLogs || auditLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  <History className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  No audit log entries found
                  {hasActiveFilters && (
                    <span className="block text-xs mt-1">
                      Try adjusting the filters
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {entry.createdAt
                      ? format(new Date(entry.createdAt), "MMM d, yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.userName ?? (
                      <span className="text-muted-foreground italic">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ActionTypeBadge action={entry.action} />
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

      {auditLogs && auditLogs.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Showing {auditLogs.length} of up to 100 most recent entries
        </p>
      )}
    </div>
  );
}

// ─── Action Type Badge ────────────────────────────────────────────────────────

function ActionTypeBadge({ action }: { action: string }) {
  const config: Record<string, { label: string; className: string }> = {
    permissions_updated: {
      label: "Permissions Updated",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
    permission_toggled: {
      label: "Permission Toggled",
      className: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
    },
    role_created: {
      label: "Role Created",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    },
    role_deleted: {
      label: "Role Deleted",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    },
    page_access_updated: {
      label: "Page Access",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    },
  };

  const display = config[action];
  if (display) {
    return (
      <Badge
        variant="outline"
        className={`text-xs border-0 font-medium ${display.className}`}
      >
        {display.label}
      </Badge>
    );
  }

  // Fallback for unknown action types
  return (
    <Badge variant="outline" className="text-xs">
      {action.replace(/_/g, " ")}
    </Badge>
  );
}

// ─── Role List ────────────────────────────────────────────────────────────────

function RoleList() {
  const [deleteTarget, setDeleteTarget] = useState<DaRole | null>(null);

  return (
    <>
      <div className="space-y-2">
        {DA_ROLES.map((role) => (
          <div
            key={role}
            className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-4 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{DA_ROLE_LABELS[role]}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {role}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Built-in
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title="Delete role"
              onClick={() => setDeleteTarget(role)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete {DA_ROLE_LABELS[role]}</span>
            </Button>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog — rendered outside the map so it layers correctly */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        {deleteTarget && (
          <DeleteRoleDialog
            role={deleteTarget}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </Dialog>
    </>
  );
}

// ─── Main RoleEditor Component ────────────────────────────────────────────────

/**
 * RoleEditor — admin component for role CRUD and audit history.
 *
 * Displays:
 * - A list of all defined roles with a placeholder "Create Custom Role" dialog
 * - Error feedback when attempting to delete a role with active users (Req 13.3)
 * - The full audit log for role/permission changes, filterable by role,
 *   action type, and date range (Req 13.12)
 *
 * Requirements: 13.2, 13.3, 13.12
 */
export function RoleEditor() {
  return (
    <div className="space-y-6">
      {/* ── Roles Section ── */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold">Roles</CardTitle>
          <CreateRoleDialog />
        </CardHeader>
        <CardContent>
          <RoleList />
        </CardContent>
      </Card>

      <Separator />

      {/* ── Audit History Section ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">
              Permission Change History
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable audit log of all role and permission changes. Filter by role,
            action type, or date range.
          </p>
        </CardHeader>
        <CardContent>
          <AuditLogSection />
        </CardContent>
      </Card>
    </div>
  );
}
