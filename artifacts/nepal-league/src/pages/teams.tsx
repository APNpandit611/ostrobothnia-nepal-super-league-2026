import { useListTeams, useGetStandings, useListPlayers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Crosshair, Shield, Users } from "lucide-react";

const POSITION_ORDER = ["GK", "C", "V.C", "Manager"];
const POSITION_COLORS: Record<string, string> = {
  GK: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  C: "bg-primary/20 text-primary border-primary/30",
  "V.C": "bg-blue-500/20 text-blue-500 border-blue-500/30",
  Manager: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

function TeamSquad({ teamId, teamColor }: { teamId: number; teamColor: string }) {
  const { data: players, isLoading } = useListPlayers(teamId);

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!players || players.length === 0) {
    return <p className="text-xs text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">Squad not announced yet</p>;
  }

  const sorted = [...players].sort((a, b) => {
    const posA = POSITION_ORDER.indexOf(a.position ?? "");
    const posB = POSITION_ORDER.indexOf(b.position ?? "");
    if (posA !== posB) return (posA === -1 ? 99 : posA) - (posB === -1 ? 99 : posB);
    return (a.number ?? 99) - (b.number ?? 99);
  });

  return (
    <div className="space-y-1.5 mt-3">
      {sorted.map((p) => (
        <div key={p.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
          <span
            className="text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{ backgroundColor: p.number != null ? teamColor : "transparent", border: p.number == null ? "1px dashed #666" : "none" }}
          >
            {p.number ?? "—"}
          </span>
          <span className="text-sm font-medium flex-1">{p.name}</span>
          {p.position && (
            <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${POSITION_COLORS[p.position] ?? "bg-muted text-muted-foreground"}`}>
              {p.position}
            </span>
          )}
        </div>
      ))}
    </div>
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-black tracking-tight uppercase italic">Teams</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {teams?.map((team) => {
          const stats = standings?.find((s) => s.teamId === team.id);
          const color = team.primaryColor || "hsl(var(--primary))";

          return (
            <Card key={team.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              <div className="h-2 w-full" style={{ backgroundColor: color }} />
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">{team.name}</CardTitle>
                <p className="text-muted-foreground font-mono text-sm">{team.shortName}</p>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <TeamSquad teamId={team.id} teamColor={color} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
