import { useGetStandings, useGetTournamentStats, useListMatches } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Activity, ListOrdered, ClipboardList, Users, BarChart3, Clock, ArrowRight, MapPin } from "lucide-react";
import { Link } from "wouter";
import { differenceInDays } from "date-fns";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetTournamentStats();
  const { data: standings, isLoading: standingsLoading } = useGetStandings();
  const { data: liveMatches } = useListMatches({ status: 'live' });

  const tournamentDate = new Date(2026, 5, 28); // June 28, 2026
  const daysUntil = differenceInDays(tournamentDate, new Date());

  const leader = standings?.[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-card border shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <div className="relative p-6 md:p-10 flex flex-col items-center text-center space-y-4">
          <img
            src="/onsl-logo.jpeg"
            alt="Ostrobothnia Nepal Super League 2026"
            className="h-36 w-36 md:h-48 md:w-48 object-contain rounded-full shadow-lg"
          />
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase italic">
            Ostrobothnia Nepal
            <br className="hidden md:block" /> Super League 2026
          </h1>
          <div className="flex flex-wrap justify-center gap-3 text-sm md:text-base font-medium text-muted-foreground mt-2">
            <span className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border">
              <MapPin className="h-4 w-4 text-primary" />
              Santahaka, Kokkola, Finland
            </span>
            <span className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border">
              <CalendarDays className="h-4 w-4 text-primary" />
              28 June 2026
            </span>
            <span className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border">
              <Clock className="h-4 w-4 text-primary" />
              {daysUntil > 0 ? `${daysUntil} days to go` : daysUntil === 0 ? "Today!" : "Tournament Complete!"}
            </span>
          </div>
        </div>
      </div>

      {/* Live Match Alert */}
      {liveMatches && liveMatches.length > 0 && (
        <Link href="/live">
          <div className="bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </div>
              <span className="font-bold uppercase tracking-wider">{liveMatches.length} Live Match{liveMatches.length > 1 ? 'es' : ''} Happening Now</span>
            </div>
            <ArrowRight className="h-5 w-5" />
          </div>
        </Link>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div className="text-3xl font-black">5</div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
            <div className="text-3xl font-black">{statsLoading ? "-" : stats?.totalMatches || 10}</div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <Activity className="h-8 w-8 text-muted-foreground" />
            <div className="text-3xl font-black">{statsLoading ? "-" : stats?.totalGoals || 0}</div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Goals</p>
          </CardContent>
        </Card>
        <Card className={leader ? "border-primary/50 bg-primary/5" : ""}>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <img src="/onsl-logo.jpeg" alt="Trophy" className="h-8 w-8 object-contain rounded-full" />
            <div className="text-xl font-bold line-clamp-1 w-full">{standingsLoading ? "-" : leader?.teamName || "-"}</div>
            <p className="text-xs text-primary font-medium uppercase tracking-wider">Current Leader</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4 uppercase">Tournament Hub</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/fixtures">
            <Card className="hover:border-primary cursor-pointer transition-colors group">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <span className="font-bold">Fixtures</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/standings">
            <Card className="hover:border-primary cursor-pointer transition-colors group">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <ListOrdered className="h-6 w-6" />
                </div>
                <span className="font-bold">Standings</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/results">
            <Card className="hover:border-primary cursor-pointer transition-colors group">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <span className="font-bold">Results</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/teams">
            <Card className="hover:border-primary cursor-pointer transition-colors group">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Users className="h-6 w-6" />
                </div>
                <span className="font-bold">Teams</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/stats">
            <Card className="hover:border-primary cursor-pointer transition-colors group">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <span className="font-bold">Stats</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/live">
            <Card className="hover:border-primary cursor-pointer transition-colors group">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Activity className="h-6 w-6" />
                </div>
                <span className="font-bold">Live</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
