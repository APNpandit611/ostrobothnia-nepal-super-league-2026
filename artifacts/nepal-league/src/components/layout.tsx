import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  CalendarDays, Activity, ListOrdered, ClipboardList, Users, BarChart3,
  Settings, Menu, X, Sun, Moon, Home, UserPlus, Mail, Phone, MapPin,
  Facebook, Info, Megaphone, ChevronDown, Heart, Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
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
      { href: "/fixtures#live", label: "Live", icon: Activity },
      { href: "/fixtures#standings", label: "Standings", icon: ListOrdered },
      { href: "/fixtures#results", label: "Results", icon: ClipboardList },
      { href: "/fixtures#stats", label: "Stats", icon: BarChart3 },
      { href: "/teams", label: "Teams", icon: Users },
    ],
  },
  { href: "/announcements", label: "News", icon: Megaphone },
  {
    href: "/register",
    label: "Register",
    icon: UserPlus,
    children: [
      { href: "/register", label: "Join KSB Club", icon: Heart },
      { href: "/register#team", label: "Register Team", icon: Shield },
    ],
  },
];

function isParentActive(item: NavItem, location: string): boolean {
  if (item.href === "/") return location === "/";
  return location === item.href || location.startsWith(item.href + "/") || location.startsWith(item.href + "#");
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
          {item.label}
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
            const childActive = location + (typeof window !== "undefined" ? window.location.hash : "") === child.href
              || (child.href === item.href && (location === item.href) && !window.location.hash);
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
          {item.label}
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
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

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
          <nav className="flex flex-col p-4 gap-0.5">
            {NAV_ITEMS.map(item => (
              <MobileItem key={item.href} item={item} location={location} onClose={() => setMobileMenuOpen(false)} />
            ))}
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
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex h-screen sticky top-0">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity">
            <img src="/ksb-logo.png" alt="Kokkola Soccer Boys" className="h-9 w-9 rounded-full object-contain flex-shrink-0" />
            <div className="font-black text-sm tracking-tight truncate">KOKKOLA SOCCER BOYS</div>
          </Link>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ml-2 flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 p-4 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <SidebarItem key={item.href} item={item} location={location} />
          ))}
        </nav>
        <div className="border-t p-4">
          <Link href="/admin/dashboard">
            <div className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
              location.startsWith("/admin") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}>
              <Settings className="h-4 w-4 flex-shrink-0" />
              Admin
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1 container mx-auto p-4 md:p-8 max-w-5xl">
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
                <a href="mailto:ksoccerboys@gmail.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5" /> ksoccerboys@gmail.com
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
