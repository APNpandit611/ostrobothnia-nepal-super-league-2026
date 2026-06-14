import { useListMatches, useGetStandings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Loader2, Activity, Trophy, Clock, MapPin, Play, Radio, Pencil,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  if (status === "live") {
    return (
      <Badge className="gap-1.5 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        LIVE
      </Badge>
    );
  }
  if (status === "finished") {
    return <Badge variant="secondary">FT</Badge>;
  }
  return <Badge variant="outline">UPCOMING</Badge>;
}

function MatchRow({ match }: { match: any }) {
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";

  return (
    <Link href={`/admin/match/${match.id}`}>
      <Card
        className={cn(
          "overflow-hidden cursor-pointer group transition-all",
          isLive
            ? "border-primary shadow-sm shadow-primary/10"
            : "hover:border-primary/60 hover:shadow-md",
        )}
      >
        <CardContent className="p-0">
          {/* Meta bar */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-muted/40 px-4 py-2 text-xs font-medium border-b">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground min-w-0">
              <span className="font-bold text-foreground">#{match.matchNumber}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {format(new Date(match.scheduledTime), "HH:mm")}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                Pitch {match.pitch}
              </span>
            </div>
            <StatusBadge status={match.status} />
          </div>

          {/* Teams + score + action */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="text-right min-w-0">
                <div className="font-bold truncate">{match.homeTeamName}</div>
                {match.homeTeamShortName && (
                  <div className="text-xs text-muted-foreground font-mono">{match.homeTeamShortName}</div>
                )}
              </div>
              {isUpcoming ? (
                <div className="bg-muted px-3 py-1.5 rounded font-mono text-lg font-bold tracking-widest text-muted-foreground">
                  VS
                </div>
              ) : (
                <div className="bg-background border px-3 py-1.5 rounded font-mono text-xl font-black tracking-widest shadow-sm whitespace-nowrap">
                  {match.homeScore} – {match.awayScore}
                </div>
              )}
              <div className="text-left min-w-0">
                <div className="font-bold truncate">{match.awayTeamName}</div>
                {match.awayTeamShortName && (
                  <div className="text-xs text-muted-foreground font-mono">{match.awayTeamShortName}</div>
                )}
              </div>
            </div>

            <span
              className={cn(
                buttonVariants({ variant: match.status === "finished" ? "secondary" : "default" }),
                "w-full sm:w-auto sm:min-w-[9.5rem] gap-2 pointer-events-none",
              )}
            >
              {match.status === "finished" ? (
                <><Pencil className="h-4 w-4" /> Edit Events</>
              ) : isLive ? (
                <><Radio className="h-4 w-4" /> Manage Live</>
              ) : (
                <><Play className="h-4 w-4" /> Start Match</>
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card className={cn(accent && value > 0 ? "border-primary/50 bg-primary/5" : "")}>
      <CardContent className="p-4">
        <div className={cn("text-2xl font-black tabular-nums", accent && value > 0 ? "text-primary" : "")}>
          {value}
        </div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mt-0.5 flex items-center gap-1.5">
          {accent && value > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
          {label}
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, count, accent, children }: { title: string; count: number; accent?: boolean; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        {accent && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
        {title}
        <span className="text-muted-foreground/60">({count})</span>
      </h2>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

export default function AdminMatches() {
  const { data: matches, isLoading } = useListMatches();
  const { data: standings } = useGetStandings();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const live = matches?.filter(m => m.status === "live") ?? [];
  const upcoming = matches?.filter(m => m.status === "upcoming") ?? [];
  const finished = matches?.filter(m => m.status === "finished") ?? [];
  const hasMatches = (matches?.length ?? 0) > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          Match Control
        </h1>
        <p className="text-muted-foreground mt-1">Select a match to manage live events</p>
      </div>

      {hasMatches && (
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Live" value={live.length} accent />
          <StatTile label="Upcoming" value={upcoming.length} />
          <StatTile label="Finished" value={finished.length} />
        </div>
      )}

      {/* Match list grouped by status */}
      {hasMatches ? (
        <div className="space-y-8">
          <Section title="Live now" count={live.length} accent>
            {live.map(m => <MatchRow key={m.id} match={m} />)}
          </Section>
          <Section title="Upcoming" count={upcoming.length}>
            {upcoming.map(m => <MatchRow key={m.id} match={m} />)}
          </Section>
          <Section title="Finished" count={finished.length}>
            {finished.map(m => <MatchRow key={m.id} match={m} />)}
          </Section>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center gap-3">
            <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
            <div>
              <h3 className="font-bold text-lg">No matches yet</h3>
              <p className="text-muted-foreground text-sm">Go to the Dashboard to generate fixtures.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Standings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            Current Standings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-2 w-8">#</th>
                  <th className="text-left px-4 py-2">Team</th>
                  <th className="text-center px-3 py-2">P</th>
                  <th className="text-center px-3 py-2">W</th>
                  <th className="text-center px-3 py-2">D</th>
                  <th className="text-center px-3 py-2">L</th>
                  <th className="text-center px-3 py-2">GD</th>
                  <th className="text-center px-3 py-2 font-black text-foreground">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings && standings.length > 0 ? standings.map((row, idx) => (
                  <tr key={row.teamId} className={cn("border-b last:border-0", idx === 0 ? "bg-primary/5 border-l-4 border-l-primary" : "")}>
                    <td className="px-4 py-2.5 text-center font-bold">
                      {idx === 0 ? <Trophy className="h-4 w-4 mx-auto text-primary" /> : <span className="text-muted-foreground">{idx + 1}</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.primaryColor ?? "#888" }} />
                        <span className="font-semibold">{row.teamName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">{row.played}</td>
                    <td className="px-3 py-2.5 text-center">{row.won}</td>
                    <td className="px-3 py-2.5 text-center">{row.drawn}</td>
                    <td className="px-3 py-2.5 text-center">{row.lost}</td>
                    <td className="px-3 py-2.5 text-center font-mono">{(row.goalsFor ?? 0) - (row.goalsAgainst ?? 0) >= 0 ? "+" : ""}{(row.goalsFor ?? 0) - (row.goalsAgainst ?? 0)}</td>
                    <td className="px-3 py-2.5 text-center font-black text-primary">{row.points}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground text-sm">
                      No matches played yet — standings will update automatically.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
