import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getLoginUrl } from "@/const";
import {
  Scale, LayoutDashboard, FolderOpen, Users, UserCheck, Calendar,
  FileSearch, Shield, BookOpen, AlertCircle, Heart, BarChart3,
  Bell, Settings, LogOut, ChevronRight, Newspaper, Briefcase,
  FileText, Menu, X, Globe,
} from "lucide-react";
import { useState } from "react";
import { DA_ROLE_LABELS } from "../../../shared/permissions";
import type { DaRole } from "../../../shared/permissions";

const navSections = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Case Management",
    items: [
      { icon: FolderOpen, label: "Cases", href: "/dashboard/cases" },
      { icon: Users, label: "Defendants", href: "/dashboard/defendants" },
      { icon: UserCheck, label: "Prosecutors", href: "/dashboard/prosecutors" },
    ],
  },
  {
    title: "Court & Legal",
    items: [
      { icon: Calendar, label: "Court Calendar", href: "/dashboard/calendar" },
      { icon: FileSearch, label: "Warrants", href: "/dashboard/warrants" },
      { icon: Shield, label: "Evidence", href: "/dashboard/evidence" },
      { icon: BookOpen, label: "Legal Research", href: "/dashboard/legal-research" },
    ],
  },
  {
    title: "People",
    items: [
      { icon: Heart, label: "Victim Services", href: "/dashboard/victims" },
      { icon: AlertCircle, label: "Complaints", href: "/dashboard/complaints" },
    ],
  },
  {
    title: "Content",
    items: [
      { icon: Newspaper, label: "Press Releases", href: "/dashboard/press-releases" },
      { icon: FileText, label: "Documents", href: "/dashboard/documents" },
      { icon: Briefcase, label: "Careers", href: "/dashboard/careers" },
    ],
  },
  {
    title: "Administration",
    items: [
      { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
      { icon: Users, label: "Staff Management", href: "/dashboard/staff" },
    ],
  },
];

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy-gradient flex items-center justify-center animate-pulse">
            <Scale className="w-5 h-5 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-navy-gradient flex items-center justify-center mx-auto mb-4">
            <Scale className="w-8 h-8 text-accent" />
          </div>
          <h1 className="font-serif text-2xl font-bold mb-2">Staff Portal</h1>
          <p className="text-muted-foreground text-sm mb-6">
            This area is restricted to authorized personnel only. Please sign in with your credentials.
          </p>
          <Button asChild className="w-full bg-navy-gradient text-white">
            <a href={getLoginUrl()}>Sign In to Staff Portal</a>
          </Button>
          <div className="mt-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const daRole = (user as any)?.daRole as DaRole | undefined;
  const roleLabel = daRole ? DA_ROLE_LABELS[daRole] : "Staff";
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Scale className="w-4.5 h-4.5 text-sidebar-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-serif font-bold text-sm text-sidebar-foreground leading-tight truncate">LSCDA</div>
            <div className="text-xs text-sidebar-foreground/50 truncate">Internal System</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-1">
            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 mx-2 px-3 py-2 rounded-md text-sm transition-all duration-150 group",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "" : "group-hover:text-sidebar-primary")} />
                  <span className="truncate">{item.label}</span>
                  {item.label === "Notifications" && unreadCount ? (
                    <Badge className="ml-auto text-xs h-4 min-w-4 px-1 bg-destructive text-destructive-foreground">{unreadCount}</Badge>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Extra links */}
        <div className="mb-1">
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">Alerts</div>
          <Link
            href="/dashboard/notifications"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-2.5 mx-2 px-3 py-2 rounded-md text-sm transition-all duration-150 group",
              location === "/dashboard/notifications"
                ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Notifications</span>
            {unreadCount ? (
              <Badge className="ml-auto text-xs h-4 min-w-4 px-1 bg-destructive text-destructive-foreground">{unreadCount}</Badge>
            ) : null}
          </Link>
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 mb-2">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "Staff"}</div>
            <div className="text-xs text-sidebar-foreground/50 truncate">{roleLabel}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            asChild
          >
            <Link href="/"><Globe className="w-3 h-3 mr-1" />Public Site</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-xs text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-3 h-3 mr-1" />Sign Out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 flex flex-col bg-sidebar z-50">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-white dark:bg-card flex items-center px-4 gap-3 shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link href="/dashboard/notifications" className="relative p-1.5 rounded-md hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount ? (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-sm">
              <div className="font-medium leading-tight">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{roleLabel}</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">{children}</div>
        </main>
      </div>
    </div>
  );
}
