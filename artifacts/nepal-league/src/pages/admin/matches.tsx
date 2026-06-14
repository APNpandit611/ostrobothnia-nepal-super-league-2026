import { useListMatches, useGetStandings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Activity, Trophy } from "lucide-react";
import { Link } from "wouter";

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          Match Control
        </h1>
        <p className="text-muted-foreground mt-1">Select a match to manage live events</p>
      </div>

      {/* Match list */}
      <div className="grid gap-4">
        {matches?.map((match) => (
          <Link key={match.id} href={`/admin/match/${match.id}`}>
            <Card className="hover:border-primary transition-all cursor-pointer overflow-hidden group">
              <CardContent className="p-0 flex flex-col md:flex-row md:items-center">
                <div className="w-full md:w-32 p-4 bg-muted/30 flex items-center justify-between md:justify-center border-b md:border-b-0 md:border-r">
                  <div className="text-sm font-bold text-muted-foreground">Match {match.matchNumber}</div>
                  <Badge
                    variant={match.status === 'live' ? 'default' : match.status === 'finished' ? 'secondary' : 'outline'}
                    className={match.status === 'live' ? 'animate-pulse' : ''}
                  >
                    {match.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex-1 p-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="text-right font-bold text-lg">{match.homeTeamName}</div>
                  <div className="bg-background border px-4 py-2 rounded font-mono text-xl font-bold tracking-widest shadow-sm">
                    {match.status === 'upcoming' ? 'VS' : `${match.homeScore} - ${match.awayScore}`}
                  </div>
                  <div className="text-left font-bold text-lg">{match.awayTeamName}</div>
                </div>

                <div className="w-full md:w-auto p-4 border-t md:border-t-0 flex justify-end">
                  <Button variant={match.status === 'live' ? "default" : "secondary"} className="w-full md:w-auto group-hover:bg-primary group-hover:text-primary-foreground">
                    {match.status === 'finished' ? 'Edit Events' : match.status === 'upcoming' ? 'Start Match' : 'Manage Live'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {(!matches || matches.length === 0) && (
          <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed">
            No matches generated yet. Go to Dashboard to generate fixtures.
          </div>
        )}
      </div>

      {/* Live Standings */}
      {standings && standings.length > 0 && (
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
                  {standings.map((row, idx) => (
                    <tr key={row.teamId} className={`border-b last:border-0 ${idx === 0 ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-2.5 text-muted-foreground font-bold">{idx + 1}</td>
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
                      <td className="px-3 py-2.5 text-center">{(row.goalsFor ?? 0) - (row.goalsAgainst ?? 0) >= 0 ? "+" : ""}{(row.goalsFor ?? 0) - (row.goalsAgainst ?? 0)}</td>
                      <td className="px-3 py-2.5 text-center font-black text-primary">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
