"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import InternalLayout from "@/components/InternalLayout";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CaseHeader } from "@/components/cases/CaseHeader";
import { OverviewTab } from "@/components/cases/tabs/OverviewTab";

// ─── Tab Definitions ──────────────────────────────────────────────────────────

interface TabDef {
  id: string;
  label: string;
  requiredPermission?: string;
}

const ALL_TABS: TabDef[] = [
  { id: "overview", label: "Overview" },
  {
    id: "documents",
    label: "Documents",
    requiredPermission: "page:case_detail/documents",
  },
  {
    id: "evidence",
    label: "Evidence",
    requiredPermission: "page:case_detail/evidence",
  },
  {
    id: "warrants",
    label: "Warrants",
    requiredPermission: "page:case_detail/warrants",
  },
  {
    id: "witnesses",
    label: "Witnesses",
    requiredPermission: "page:case_detail/witnesses",
  },
  {
    id: "filings",
    label: "Court Filings",
    requiredPermission: "page:case_detail/filings",
  },
  {
    id: "timeline",
    label: "Timeline",
    requiredPermission: "page:case_detail/timeline",
  },
  {
    id: "activity",
    label: "Activity Log",
    requiredPermission: "page:case_detail/activity",
  },
];

// ─── Inner component that uses useSearchParams ─────────────────────────────

function CaseDetailInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = parseInt(params?.id ?? "0");

  // ── URL tab persistence ──
  const tab = searchParams?.get("tab") ?? "overview";
  const setTab = (newTab: string) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("tab", newTab);
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  // ── Data fetching ──
  const {
    data: caseData,
    isLoading: caseLoading,
    refetch: refetchCase,
  } = trpc.cases.get.useQuery({ id: caseId }, { enabled: !isNaN(caseId) });

  const { data: myPermissions } = trpc.permissions.myPermissions.useQuery();

  // ── Tab visibility ──
  const visibleTabs = ALL_TABS.filter((t) => {
    if (t.requiredPermission) {
      return (myPermissions as string[] | undefined)?.includes(t.requiredPermission) ?? false;
    }
    return true; // overview always visible
  });

  // If URL tab isn't visible (e.g. permissions revoked), fall back to overview
  const activeTab = visibleTabs.some((t) => t.id === tab) ? tab : "overview";

  return (
    <InternalLayout>
      <div className="p-6 space-y-5">
        {/* Back button */}
        <Button asChild variant="ghost" className="-ml-2">
          <Link href="/dashboard/cases">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Link>
        </Button>

        {/* Case loading state */}
        {caseLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-5 w-1/4" />
          </div>
        ) : !caseData ? (
          <div className="text-center py-16 text-muted-foreground">
            Case not found.
          </div>
        ) : (
          <>
            {/* Case Header */}
            <CaseHeader
              caseData={caseData}
              myPermissions={myPermissions ?? []}
              onStatusChange={() => refetchCase()}
            />

            {/* 8-tab Interface */}
            <Tabs value={activeTab} onValueChange={setTab}>
              <TabsList className="flex-wrap h-auto gap-1">
                {visibleTabs.map((t) => (
                  <TabsTrigger key={t.id} value={t.id}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Overview — always rendered when active (lazy by default) */}
              <TabsContent value="overview" className="mt-5">
                <OverviewTab caseId={caseId} caseData={caseData} />
              </TabsContent>

              {/* Documents */}
              <TabsContent value="documents" className="mt-5">
                <div className="text-center py-16 text-muted-foreground text-sm">
                  Documents — coming soon
                </div>
              </TabsContent>

              {/* Evidence */}
              <TabsContent value="evidence" className="mt-5">
                <div className="text-center py-16 text-muted-foreground text-sm">
                  Evidence — coming soon
                </div>
              </TabsContent>

              {/* Warrants */}
              <TabsContent value="warrants" className="mt-5">
                <div className="text-center py-16 text-muted-foreground text-sm">
                  Warrants — coming soon
                </div>
              </TabsContent>

              {/* Witnesses */}
              <TabsContent value="witnesses" className="mt-5">
                <div className="text-center py-16 text-muted-foreground text-sm">
                  Witnesses — coming soon
                </div>
              </TabsContent>

              {/* Court Filings */}
              <TabsContent value="filings" className="mt-5">
                <div className="text-center py-16 text-muted-foreground text-sm">
                  Court Filings — coming soon
                </div>
              </TabsContent>

              {/* Timeline */}
              <TabsContent value="timeline" className="mt-5">
                <div className="text-center py-16 text-muted-foreground text-sm">
                  Timeline — coming soon
                </div>
              </TabsContent>

              {/* Activity Log */}
              <TabsContent value="activity" className="mt-5">
                <div className="text-center py-16 text-muted-foreground text-sm">
                  Activity Log — coming soon
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </InternalLayout>
  );
}

// ─── Page shell — wraps inner in Suspense for useSearchParams ────────────────

export default function CaseDetailPage() {
  return (
    <Suspense
      fallback={
        <InternalLayout>
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        </InternalLayout>
      }
    >
      <CaseDetailInner />
    </Suspense>
  );
}
