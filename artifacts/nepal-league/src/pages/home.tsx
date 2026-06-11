import { useGetStandings, useGetTournamentStats, useListMatches, useListTeams, useListPlayers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Activity, ListOrdered, ClipboardList, Users, BarChart3, Clock, ArrowRight, MapPin, QrCode, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { differenceInDays } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

const POSITION_ORDER = ["GK", "C", "V.C", "Manager"];
const POSITION_COLORS: Record<string, string> = {
  GK: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  C: "bg-primary/20 text-primary border-primary/30",
  "V.C": "bg-blue-500/20 text-blue-500 border-blue-500/30",
  Manager: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

function KSBSquad({ teamId }: { teamId: number }) {
  const { data: players, isLoading } = useListPlayers(teamId);

  if (isLoading) return <div className="text-center py-4 text-muted-foreground text-sm">Loading squad…</div>;
  if (!players || players.length === 0) {
    return <p className="text-center py-6 text-muted-foreground text-sm italic">Squad will be announced soon</p>;
  }

  const sorted = [...players].sort((a, b) => {
    const posA = POSITION_ORDER.indexOf(a.position ?? "");
    const posB = POSITION_ORDER.indexOf(b.position ?? "");
    if (posA !== posB) return (posA === -1 ? 99 : posA) - (posB === -1 ? 99 : posB);
    return (a.number ?? 99) - (b.number ?? 99);
  });

  const byPosition: Record<string, typeof sorted> = {};
  for (const p of sorted) {
    const pos = p.position ?? "Other";
    if (!byPosition[pos]) byPosition[pos] = [];
    byPosition[pos].push(p);
  }

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mt-2">
      {[...POSITION_ORDER, "Other"].map((pos) => {
        const group = byPosition[pos];
        if (!group?.length) return null;
        return (
          <div key={pos}>
            <div className={`text-[10px] font-black uppercase tracking-widest border rounded px-2 py-0.5 inline-block mb-2 ${POSITION_COLORS[pos] ?? "bg-muted text-muted-foreground"}`}>
              {pos}
            </div>
            <div className="space-y-1.5">
              {group.map((p) => (
                <div key={p.id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-2.5 py-1.5">
                  <span className="text-xs font-black w-5 text-center text-primary opacity-70">{p.number ?? "—"}</span>
                  <span className="text-sm font-medium truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const APP_URL = "http://kokkolasoccerboys.cc/";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetTournamentStats();
  const { data: standings, isLoading: standingsLoading } = useGetStandings();
  const { data: liveMatches } = useListMatches({ status: 'live' });
  const { data: teams } = useListTeams();
  const ksb = teams?.find((t) => t.shortName === "KSB");

  const tournamentDate = new Date(2026, 5, 28); // June 28, 2026
  const daysUntil = differenceInDays(tournamentDate, new Date());

  const leader = standings?.[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-card border shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
        <div className="relative p-6 md:p-10 flex flex-col items-center text-center space-y-4">

          {/* Host club logo */}
          <img
            src="/onsl-official-logo.png"
            alt="Kokkola Soccer Boys"
            className="h-36 w-36 md:h-48 md:w-48 object-contain rounded-full shadow-lg ring-4 ring-primary/20"
          />

          {/* Badges row */}
          <div className="flex flex-wrap justify-center gap-2">
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              <span>🏆</span>
              Hosted by Kokkola Soccer Boys
            </div>
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 text-yellow-500 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              <span>⭐</span>
              Defending Champions
            </div>
          </div>

          {/* League name */}
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase italic leading-tight">
            Ostrobothnia Nepal
            <br /> Super League 2026
          </h1>

          <p className="text-muted-foreground text-sm md:text-base max-w-md">
            A joint 5-team football tournament organised and hosted by <span className="text-foreground font-semibold">Kokkola Soccer Boys</span> in partnership with Nepali clubs from across Ostrobothnia.
          </p>

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
            <img src="/onsl-official-logo.png" alt="Trophy" className="h-8 w-8 object-contain rounded-full" />
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

      {/* KSB Squad */}
      {ksb && (
        <Card className="border-primary/20 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <img src="/onsl-official-logo.png" alt="KSB" className="h-10 w-10 rounded-full object-contain flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black uppercase tracking-tight">Kokkola Soccer Boys</h2>
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-primary/10 border border-primary/30 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                    <ShieldCheck className="h-3 w-3" /> Host · Defending Champions
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">ONSL 2026 Squad</p>
              </div>
            </div>
            <KSBSquad teamId={ksb.id} />
          </CardContent>
        </Card>
      )}

      {/* QR Code */}
      <Card className="border-dashed">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-xl shadow-sm flex-shrink-0">
            <QRCodeSVG
              value={APP_URL}
              size={140}
              bgColor="#ffffff"
              fgColor="#111827"
              level="M"
              imageSettings={{
                src: "/onsl-official-logo.png",
                x: undefined,
                y: undefined,
                height: 32,
                width: 32,
                excavate: true,
              }}
            />
          </div>
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Share Live Scores</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Scan this QR code to follow live scores, fixtures and standings on your phone.
            </p>
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm font-medium hover:underline break-all"
            >
              {APP_URL}
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
