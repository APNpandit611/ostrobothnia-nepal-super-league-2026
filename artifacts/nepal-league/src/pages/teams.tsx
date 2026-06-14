import { useListTeams, useGetStandings, useListPlayers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Crosshair, Shield, Users, UserPlus, ChevronRight, Trophy, MapPin, Shirt } from "lucide-react";
import { Link } from "wouter";
import type { Team } from "@workspace/api-client-react";

const POSITION_ORDER = ["GK", "C", "V.C", "Manager"];
const POSITION_COLORS: Record<string, string> = {
  GK: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  C: "bg-primary/15 text-primary border-primary/30",
  "V.C": "bg-blue-500/15 text-blue-600 border-blue-500/30",
  Manager: "bg-purple-500/15 text-purple-600 border-purple-500/30",
};

function TeamCard({ team, stats }: { team: Team; stats: { points: number; goalsFor: number; goalsAgainst: number; teamId: number } | undefined }) {
  const { data: players, isLoading } = useListPlayers(team.id);
  const color = team.primaryColor || "hsl(var(--primary))";

  const sorted = isLoading ? [] : [...(players ?? [])].sort((a, b) => {
    const posA = POSITION_ORDER.indexOf(a.position ?? "");
    const posB = POSITION_ORDER.indexOf(b.position ?? "");
    if (posA !== posB) return (posA === -1 ? 99 : posA) - (posB === -1 ? 99 : posB);
    return (a.number ?? 99) - (b.number ?? 99);
  });

  const hasPlayers = !isLoading && (players?.length ?? 0) > 0;

  const logoUrl = team.logoUrl;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0 shadow-sm relative">
      {/* Brand colour top bar */}
      <div className="h-3 w-full" style={{ backgroundColor: color }} />

      {/* Background logo watermark */}
      {logoUrl && (
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none bg-no-repeat bg-right-top bg-contain"
          style={{ backgroundImage: `url(${logoUrl})` }}
        />
      )}

      <CardContent className="p-0 relative z-10">
        {/* Header block */}
        <div className="p-5 pb-4">
          <div className="flex items-start gap-4">
            {/* Logo or initials circle */}
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={team.name}
                className="w-14 h-14 rounded-xl object-cover bg-white shadow-sm flex-shrink-0 border"
                style={{ borderColor: `${color}30` }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-xl flex-shrink-0 shadow-sm"
                style={{ backgroundColor: color }}
              >
                {team.shortName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-lg leading-tight truncate">{team.name}</h3>
              <p className="text-muted-foreground font-mono text-xs mt-0.5">{team.shortName}</p>
              {team.city && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                  <MapPin className="h-3 w-3" />
                  {team.city}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 space-y-5">
          {!hasPlayers && !isLoading ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center border border-dashed rounded-xl bg-muted/30">
              <Users className="h-6 w-6 text-muted-foreground/40" />
              <p className="text-sm font-semibold">Squad not submitted yet</p>
              <p className="text-xs text-muted-foreground">The roster will be published before the tournament.</p>
            </div>
          ) : (
            <>
              {/* Stats row */}
              {stats ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <div className="text-xl font-black">{stats.points}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Pts</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <div className="text-xl font-black">{stats.goalsFor}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5 flex items-center justify-center gap-1">
                      <Crosshair className="h-3 w-3" /> GF
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <div className="text-xl font-black">{stats.goalsAgainst}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5 flex items-center justify-center gap-1">
                      <Shield className="h-3 w-3" /> GA
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/20">
                  No stats yet
                </div>
              )}

              {/* Squad */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Shirt className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Squad {players?.length ? `(${players.length})` : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {sorted.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors"
                    >
                      <span
                        className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: p.number != null ? color : "transparent", border: p.number == null ? `1px dashed ${color}` : "none" }}
                      >
                        {p.number ?? "—"}
                      </span>
                      <span className="text-xs font-semibold truncate flex-1 min-w-0">{p.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {p.isCaptain && (
                          <span className="text-[9px] font-black border rounded px-1 py-0 bg-yellow-500/15 text-yellow-600 border-yellow-500/30">
                            C
                          </span>
                        )}
                        {p.position && (
                          <span className={`text-[9px] font-bold border rounded px-1 py-0 ${POSITION_COLORS[p.position] ?? "bg-muted text-muted-foreground"}`}>
                            {p.position}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Manager */}
                {team.managerName && (
                  <div className="flex items-center gap-2 py-1.5 px-2 mt-2 border-t border-dashed border-border/40">
                    <span className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center bg-muted text-muted-foreground flex-shrink-0">
                      M
                    </span>
                    <span className="text-xs font-semibold truncate flex-1 min-w-0">{team.managerName}</span>
                    <span className="text-[9px] font-bold border rounded px-1 py-0 bg-purple-500/15 text-purple-600 border-purple-500/30">
                      Manager
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Teams() {
  const { data: teams, isLoading: teamsLoading } = useListTeams();
  const { data: standings, isLoading: standingsLoading } = useGetStandings();

  const approvedTeams = (teams ?? []).filter((t) => t.squadStatus === "approved");

  if (teamsLoading || standingsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const noTeams = approvedTeams.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Teams</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {approvedTeams.length > 0 ? `${approvedTeams.length} teams registered` : "Registration open"}
            </p>
          </div>
        </div>
        <Link href="/register-team">
          <div className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm">
            <UserPlus className="h-4 w-4" /> Register a Team
          </div>
        </Link>
      </div>

      {/* Registration banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">Ostrobothnia Nepal Super League 2026</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              28 June 2026 · Santahaka, Kokkola
            </p>
          </div>
        </div>
        <Link href="/register-team">
          <div className="flex items-center gap-1 text-primary font-bold text-sm hover:underline cursor-pointer whitespace-nowrap">
            Register your team <ChevronRight className="h-4 w-4" />
          </div>
        </Link>
      </div>

      {noTeams ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 flex flex-col items-center text-center gap-4">
            <Users className="h-12 w-12 opacity-20" />
            <div>
              <p className="font-bold text-lg">No teams yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Teams appear here once they register and are approved by the admin.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {approvedTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              stats={standings?.find((s) => s.teamId === team.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
