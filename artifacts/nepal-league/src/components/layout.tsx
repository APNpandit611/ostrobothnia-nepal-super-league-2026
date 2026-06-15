import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  CalendarDays, Activity, ListOrdered, ClipboardList, Users, BarChart3,
  Settings, Menu, X, Sun, Moon, Home, UserPlus, Mail, Phone, MapPin,
  Facebook, Info, Megaphone, ChevronDown, Heart, Shield,
  ClipboardEdit, BookOpen, LogOut, Archive,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useGetAdminMe, useAdminLogout, getGetAdminMeQueryKey, useListTeams, useListClubApplications } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "./theme-provider";

interface NavChild {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: NavChild[];
  badge?: number;
  badgeTitle?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "About", icon: Info },
  {
    href: "/fixtures",
    label: "Fixtures",
    icon: CalendarDays,
    children: [
      { href: "/fixtures", label: "All Fixtures", icon: CalendarDays },
      { href: "/live", label: "Live", icon: Activity },
      { href: "/standings", label: "Standings", icon: ListOrdered },
      { href: "/results", label: "Results", icon: ClipboardList },
      { href: "/stats", label: "Stats", icon: BarChart3 },
      { href: "/teams", label: "Teams", icon: Users },
    ],
  },
  { href: "/announcements", label: "News", icon: Megaphone },
  { href: "/register", label: "Join KSB Club", icon: Heart },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Settings },
  { href: "/admin/matches", label: "Match Control", icon: Activity },
  { href: "/admin/tournament", label: "Tournament Info", icon: ClipboardEdit },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/club-applications", label: "Applications", icon: Heart },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/club-settings", label: "About Us", icon: BookOpen },
  { href: "/admin/seasons", label: "Seasons", icon: Archive },
];

function isParentActive(item: NavItem, location: string): boolean {
  if (item.href === "/") return location === "/";
  if (!item.children) return location === item.href;
  if (location === item.href || location.startsWith(item.href + "/")) return true;
  return item.children.some(c => location === c.href || location.startsWith(c.href + "/"));
}

// ─── Notification badge (red count pill) ──────────────────────────────────────
function NavBadge({ count, title }: { count: number; title?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className="flex h-5 min-w-[1.25rem] flex-shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white shadow-sm"
      title={title ?? `${count} new`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

// ─── Desktop sidebar nav item ─────────────────────────────────────────────────
function SidebarItem({ item, location }: { item: NavItem; location: string }) {
  const Icon = item.icon;
  const active = isParentActive(item, location);
  const [open, setOpen] = useState(active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  if (!item.children) {
    return (
      <Link href={item.href}>
        <div className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
          active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
        )}>
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge ? <NavBadge count={item.badge} title={item.badgeTitle} /> : null}
        </div>
      </Link>
    );
  }

  return (
    <div>
      {/* Parent row */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer select-none",
          active ? "bg-primary/10 text-primary" : "hover:bg-muted",
        )}
        onClick={() => setOpen(o => !o)}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200", open ? "rotate-180" : "")} />
      </div>

      {/* Children */}
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
          {item.children!.map(child => {
            const CIcon = child.icon;
            const childActive = location === child.href
              || (child.href === item.href && location === item.href);
            return (
              <Link key={child.href} href={child.href}>
                <div className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer",
                  childActive ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}>
                  <CIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  {child.label}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Mobile nav item ──────────────────────────────────────────────────────────
function MobileItem({ item, location, onClose }: { item: NavItem; location: string; onClose: () => void }) {
  const Icon = item.icon;
  const active = isParentActive(item, location);
  const [open, setOpen] = useState(active);

  if (!item.children) {
    return (
      <Link href={item.href} onClick={onClose}>
        <div className={cn(
          "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
          active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
        )}>
          <Icon className="h-5 w-5" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge ? <NavBadge count={item.badge} title={item.badgeTitle} /> : null}
        </div>
      </Link>
    );
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors cursor-pointer select-none",
          active ? "bg-primary/10 text-primary" : "hover:bg-muted",
        )}
        onClick={() => setOpen(o => !o)}
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1">{item.label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open ? "rotate-180" : "")} />
      </div>
      {open && (
        <div className="ml-5 mt-1 space-y-0.5 border-l border-border pl-3">
          {item.children!.map(child => {
            const CIcon = child.icon;
            return (
              <Link key={child.href} href={child.href} onClick={onClose}>
                <div className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                  <CIcon className="h-4 w-4 flex-shrink-0" />
                  {child.label}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const mainRef = useRef<HTMLElement>(null);

  const queryClient = useQueryClient();
  const { data: adminMe, isError: adminMeError } = useGetAdminMe({
    query: { retry: false, staleTime: 30_000 } as never,
  });
  const isAdmin = !adminMeError && !!adminMe?.isAdmin;
  const logoutMutation = useAdminLogout({
    mutation: {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: getGetAdminMeQueryKey() });
        setLocation("/admin");
      },
    },
  });

  // Admin notification counts — drive the red count badges in the admin nav.
  // Only fetched (and polled) while an admin is logged in.
  const adminQuery = {
    enabled: isAdmin,
    refetchInterval: isAdmin ? 30_000 : false,
    staleTime: 15_000,
  } as never;

  // Squads awaiting approval (new team registrations) → "Teams" badge.
  const { data: teamsList } = useListTeams({ query: adminQuery });
  const pendingTeams = isAdmin
    ? teamsList?.filter(t => t.squadStatus === "pending").length ?? 0
    : 0;

  // New "Join KSB Club" applications awaiting review → "Applications" badge.
  const { data: pendingApplications } = useListClubApplications(
    { status: "pending" },
    { query: adminQuery },
  );
  const pendingAppCount = isAdmin ? pendingApplications?.length ?? 0 : 0;

  const adminItems: NavItem[] = ADMIN_NAV_ITEMS.map(item => {
    if (item.href === "/admin/teams")
      return { ...item, badge: pendingTeams, badgeTitle: `${pendingTeams} squad${pendingTeams === 1 ? "" : "s"} awaiting approval` };
    if (item.href === "/admin/club-applications")
      return { ...item, badge: pendingAppCount, badgeTitle: `${pendingAppCount} new application${pendingAppCount === 1 ? "" : "s"}` };
    return item;
  });

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background text-foreground">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 md:hidden">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src="/ksb-logo.png" alt="Kokkola Soccer Boys" className="h-8 w-8 rounded-full object-contain flex-shrink-0" />
            <div className="font-black text-sm tracking-tight">KOKKOLA SOCCER BOYS</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="text-muted-foreground hover:text-foreground transition-colors">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-foreground">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-background md:hidden overflow-y-auto">
          <nav className="flex min-h-full flex-col p-4 gap-0.5">
            {NAV_ITEMS.map(item => (
              <MobileItem key={item.href} item={item} location={location} onClose={() => setMobileMenuOpen(false)} />
            ))}
            {isAdmin ? (
              <>
                <div className="mt-2 pt-2 border-t">
                  <div className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Admin Panel</div>
                  {adminItems.map(item => (
                    <MobileItem key={item.href} item={item} location={location} onClose={() => setMobileMenuOpen(false)} />
                  ))}
                </div>
                <div className="mt-auto pt-2 border-t">
                  <button
                    onClick={() => { setMobileMenuOpen(false); logoutMutation.mutate(); }}
                    className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-2 pt-2 border-t">
                <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <div className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    location.startsWith("/admin") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}>
                    <Settings className="h-5 w-5" />
                    Admin
                  </div>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex h-screen sticky top-0">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity">
            <img src="/ksb-logo.png" alt="Kokkola Soccer Boys" className="h-9 w-9 rounded-full object-contain flex-shrink-0" />
            <div className="font-black text-sm tracking-tight truncate">KOKKOLA SOCCER BOYS</div>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 p-4 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <SidebarItem key={item.href} item={item} location={location} />
          ))}
          {isAdmin && (
            <div className="mt-2 space-y-0.5 border-t pt-2">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Panel</div>
              {adminItems.map(item => (
                <SidebarItem key={item.href} item={item} location={location} />
              ))}
            </div>
          )}
        </nav>
        <div className="border-t p-4">
          {isAdmin ? (
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              Logout
            </button>
          ) : (
            <Link href="/admin/dashboard">
              <div className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                location.startsWith("/admin") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}>
                <Settings className="h-4 w-4 flex-shrink-0" />
                Admin
              </div>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto flex flex-col relative bg-background">
        {/* Background image — subtle watermark across entire layout */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.03] pointer-events-none select-none z-0"
          style={{ backgroundImage: "url(/ksb-logo.png)" }}
        />
        {/* Top bar — theme toggle pinned to top-right (desktop only) */}
        <div className="hidden md:flex sticky top-0 z-30 justify-end px-4 py-2 bg-background/80 backdrop-blur-sm border-b relative z-10">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex-1 container mx-auto p-4 md:p-8 max-w-5xl relative z-10">
          {children}
        </div>
        <footer className="border-t bg-card mt-8">
          <div className="container mx-auto max-w-5xl px-4 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/ksb-logo.png" alt="Kokkola Soccer Boys" className="h-10 w-10 rounded-full object-contain flex-shrink-0" />
                <div><div className="font-black text-sm tracking-tight">KOKKOLA SOCCER BOYS</div></div>
              </div>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <a href="mailto:info@kokkolasoccerboys.cc" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5" /> info@kokkolasoccerboys.cc
                </a>
                <a href="tel:+358413174494" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="h-3.5 w-3.5" /> +358 413 174 494
                </a>
                <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Kokkola, Finland</span>
                <a href="https://www.facebook.com/people/Kokkola-Soccer-Boys/61589834992626/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Facebook className="h-3.5 w-3.5" /> Kokkola Soccer Boys
                </a>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">© 2026 Kokkola Soccer Boys</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
