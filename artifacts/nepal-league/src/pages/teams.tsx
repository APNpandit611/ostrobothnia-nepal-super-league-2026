import { useListTeams, useGetStandings, useListPlayers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Crosshair, Shield, Users, FileText, UserPlus, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import type { Team } from "@workspace/api-client-react";

const POSITION_ORDER = ["GK", "C", "V.C", "Manager"];
const POSITION_COLORS: Record<string, string> = {
  GK: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  C: "bg-primary/20 text-primary border-primary/30",
  "V.C": "bg-blue-500/20 text-blue-500 border-blue-500/30",
  Manager: "bg-purple-500/20 text-purple-400 border-purple-500/30",
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
  const isApproved = team.squadStatus === "approved";
  const isPending = team.squadStatus === "pending";
  const isLocked = isApproved; // squad locked for manager edits once approved

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
      <div className="h-2 w-full" style={{ backgroundColor: color }} />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl font-bold">{team.name}</CardTitle>
            <p className="text-muted-foreground font-mono text-sm">{team.shortName}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
            {isApproved && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-green-500/15 text-green-600 border border-green-500/30">
                <CheckCircle2 className="h-3 w-3" /> Approved
              </span>
            )}
            {isPending && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-600 border border-yellow-500/30">
                <Clock className="h-3 w-3" /> Pending
              </span>
            )}
            {!isLocked && (
              <Link href={`/update-squad?team=${team.id}`}>
                <button className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-muted">
                  <UserPlus className="h-3 w-3" /> Update Squad
                </button>
              </Link>
            )}
            {isApproved && hasPlayers && (
              <Link href={`/teams/${team.id}`}>
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:text-white"
                  style={{ borderColor: `${color}60`, color, backgroundColor: `${color}15` }}
                >
                  <FileText className="h-3 w-3" /> Squad
                </button>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPlayers && !isLoading ? (
          /* No players yet — prompt to update squad */
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Users className="h-8 w-8 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-semibold">Squad not submitted yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Click "Update Squad" above to add your players.</p>
            </div>
            <Link href={`/update-squad?team=${team.id}`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer">
                <UserPlus className="h-3.5 w-3.5" /> Submit squad now
              </div>
            </Link>
          </div>
        ) : !isApproved ? (
          /* Players exist but squad not yet approved (pending or revoked) */
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Clock className="h-8 w-8 text-yellow-500/60" />
            <div>
              <p className="text-sm font-semibold">Squad submitted — pending approval</p>
              <p className="text-xs text-muted-foreground mt-0.5">The squad will appear here once the admin approves it.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats row */}
            {stats ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-2xl font-black">{stats.points}</div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Pts</div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-2xl font-black">{stats.goalsFor}</div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1 flex items-center justify-center gap-1">
                    <Crosshair className="h-3 w-3" /> GF
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-2xl font-black">{stats.goalsAgainst}</div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1 flex items-center justify-center gap-1">
                    <Shield className="h-3 w-3" /> GA
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 text-muted-foreground text-sm border border-dashed rounded-lg">
                No stats available yet
              </div>
            )}

            {/* Squad */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Squad</span>
              </div>
              <div className="space-y-1.5 mt-3">
                {sorted.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span
                      className="text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: p.number != null ? color : "transparent", border: p.number == null ? "1px dashed #666" : "none" }}
                    >
                      {p.number ?? "—"}
                    </span>
                    <span className="text-sm font-medium flex-1">{p.name}</span>
                    {p.isCaptain && (
                      <span className="text-[10px] font-black border rounded px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 border-yellow-500/40">
                        C
                      </span>
                    )}
                    {p.position && (
                      <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${POSITION_COLORS[p.position] ?? "bg-muted text-muted-foreground"}`}>
                        {p.position}
                      </span>
                    )}
                  </div>
                ))}
                {team.managerName && (
                  <div className="flex items-center gap-2.5 py-1.5 px-2 mt-1 border-t border-dashed border-border/60">
                    <span className="text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center bg-muted text-muted-foreground flex-shrink-0">
                      M
                    </span>
                    <span className="text-sm font-medium flex-1">{team.managerName}</span>
                    <span className="text-[10px] font-bold border rounded px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border-purple-500/30">
                      Manager
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Teams() {
  const { data: teams, isLoading: teamsLoading } = useListTeams();
  const { data: standings, isLoading: standingsLoading } = useGetStandings();

  if (teamsLoading || standingsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const noTeamsInDb = !teamsLoading && (teams?.length ?? 0) === 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-black tracking-tight uppercase italic">Teams</h1>
        <Link href="/register-team">
          <div className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm">
            <UserPlus className="h-4 w-4" /> Register a Team
          </div>
        </Link>
      </div>

      {/* Registration banner */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/15 rounded-lg flex-shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">Ostrobothnia Nepal Super League 2026</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registration is open — 28 June 2026 · Santahaka, Kokkola
            </p>
          </div>
        </div>
        <Link href="/register-team">
          <div className="flex items-center gap-2 text-primary font-bold text-sm hover:underline cursor-pointer whitespace-nowrap">
            Register your team <ChevronRight className="h-4 w-4" />
          </div>
        </Link>
      </div>

      {noTeamsInDb ? (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center gap-4">
            <Users className="h-12 w-12 opacity-20" />
            <div>
              <p className="font-bold text-lg">No teams registered yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Teams will appear here once they register.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {teams?.map((team) => (
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
