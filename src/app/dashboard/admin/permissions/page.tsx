'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import InternalLayout from "@/components/InternalLayout";
import { PermissionMatrix } from "@/components/admin/PermissionMatrix";
import { RoleEditor } from "@/components/admin/RoleEditor";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck } from "lucide-react";

export default function PermissionsPage() {
  const router = useRouter();
  const { data: myPermissions, isLoading } = trpc.permissions.myPermissions.useQuery();

  const hasManageUsers = myPermissions?.includes("manage_users") ?? false;

  useEffect(() => {
    // Only redirect once we have a definitive answer (not loading)
    if (!isLoading && !hasManageUsers) {
      router.replace("/dashboard");
    }
  }, [isLoading, hasManageUsers, router]);

  // Show loading skeleton while permissions are being fetched
  if (isLoading) {
    return (
      <InternalLayout>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-12 w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </InternalLayout>
    );
  }

  // Redirect is in progress — render nothing to avoid flash
  if (!hasManageUsers) {
    return null;
  }

  return (
    <InternalLayout>
      <div className="p-6 space-y-8">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage role definitions and configure permission assignments for all staff roles.
            </p>
          </div>
        </div>

        <Separator />

        {/* Permission Matrix — role × permission grid */}
        <section>
          <PermissionMatrix />
        </section>

        <Separator />

        {/* Role Editor — role CRUD and audit history */}
        <section>
          <RoleEditor />
        </section>
      </div>
    </InternalLayout>
  );
}
