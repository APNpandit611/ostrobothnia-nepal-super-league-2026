import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { CalendarDays, Activity, ListOrdered, ClipboardList, Users, BarChart3, Settings, Menu, X, Sun, Moon, Home, UserPlus } from "lucide-react";
import { useState } from "react";
import { useTheme } from "./theme-provider";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/fixtures", label: "Fixtures", icon: CalendarDays },
  { href: "/live", label: "Live", icon: Activity },
  { href: "/standings", label: "Standings", icon: ListOrdered },
  { href: "/results", label: "Results", icon: ClipboardList },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/register", label: "Register Team", icon: UserPlus },
  { href: "/admin/dashboard", label: "Admin", icon: Settings },
];

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
            <img src="/onsl-official-logo.png" alt="Kokkola Soccer Boys" className="h-8 w-8 rounded-full object-contain flex-shrink-0" />
            <div className="leading-tight">
              <div className="font-black text-sm tracking-tight">KOKKOLA SOCCER BOYS</div>
              <div className="text-[10px] text-muted-foreground">ONSL 2026</div>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-foreground"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-background md:hidden">
          <nav className="flex flex-col p-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex h-screen sticky top-0">
        <Link href="/">
          <div className="flex h-16 items-center gap-3 border-b px-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <img src="/onsl-official-logo.png" alt="Kokkola Soccer Boys" className="h-9 w-9 rounded-full object-contain flex-shrink-0" />
            <div className="leading-tight min-w-0">
              <div className="font-black text-sm tracking-tight truncate">KOKKOLA SOCCER BOYS</div>
              <div className="text-[10px] text-muted-foreground truncate">ONSL 2026</div>
            </div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors text-left"
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-4 w-4" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                Dark Mode
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-8 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
