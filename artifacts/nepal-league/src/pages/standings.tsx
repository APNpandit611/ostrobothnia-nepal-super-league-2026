import { useGetStandings, useListTeams, useListMatches } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy, Crown, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamLogo } from "@/components/team-logo";
import { format } from "date-fns";

export default function Standings() {
  const { data: standings, isLoading } = useGetStandings();
  const { data: teams } = useListTeams();
  const { data: matches } = useListMatches();
  const logoById = new Map((teams ?? []).map((t) => [t.id, t]));

  const finalMatch = (matches ?? []).find((m) => m.matchType === "final");
  const winner = finalMatch?.status === "finished"
    ? (finalMatch.homeScore ?? 0) > (finalMatch.awayScore ?? 0)
      ? logoById.get(finalMatch.homeTeamId)
      : (finalMatch.homeScore ?? 0) < (finalMatch.awayScore ?? 0)
        ? logoById.get(finalMatch.awayTeamId)
        : null
    : null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight uppercase italic">Standings</h1>
      </div>

      {/* Final preview card */}
      {finalMatch && (
        <Card className={`overflow-hidden border-2 shadow-lg ${finalMatch.status === "finished" ? "border-amber-500/50 shadow-amber-500/10" : "border-amber-500/30"}`}>
          <CardContent className="p-0">
            <div className={`p-2 text-center text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 text-white ${finalMatch.status === "finished" ? "bg-amber-500" : "bg-amber-500/80"}`}>
              <Crown className="h-4 w-4" /> Championship Final
            </div>
            <div className="p-5 md:p-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-6">
              <div className="flex items-center justify-end gap-2.5 md:gap-3 min-w-0">
                <TeamLogo size="md" name={finalMatch.homeTeamName} shortName={finalMatch.homeTeamShortName} logoUrl={finalMatch.homeTeamLogo} />
                <h2 className="text-lg md:text-xl font-black truncate min-w-0">{finalMatch.homeTeamName}</h2>
              </div>
              <div className="text-center space-y-1">
                <div className="bg-background border-2 border-border shadow-inner px-4 py-2 rounded-xl font-mono text-3xl font-black tracking-tighter">
                  {finalMatch.homeScore} – {finalMatch.awayScore}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {format(new Date(finalMatch.scheduledTime), "HH:mm")}
                </div>
              </div>
              <div className="flex items-center justify-start gap-2.5 md:gap-3 min-w-0">
                <h2 className="text-lg md:text-xl font-black truncate min-w-0">{finalMatch.awayTeamName}</h2>
                <TeamLogo size="md" name={finalMatch.awayTeamName} shortName={finalMatch.awayTeamShortName} logoUrl={finalMatch.awayTeamLogo} />
              </div>
            </div>
            {winner && (
              <div className="px-6 pb-4 text-center">
                <div className="inline-flex items-center gap-2 text-amber-600 font-bold text-sm">
                  <Trophy className="h-4 w-4" /> Winner: {winner.name}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 text-center font-bold">#</TableHead>
                <TableHead className="font-bold uppercase tracking-wider">Team</TableHead>
                <TableHead className="text-center font-bold" title="Played">P</TableHead>
                <TableHead className="text-center font-bold" title="Won">W</TableHead>
                <TableHead className="text-center font-bold" title="Drawn">D</TableHead>
                <TableHead className="text-center font-bold" title="Lost">L</TableHead>
                <TableHead className="text-center font-bold hidden md:table-cell" title="Goals For">GF</TableHead>
                <TableHead className="text-center font-bold hidden md:table-cell" title="Goals Against">GA</TableHead>
                <TableHead className="text-center font-bold" title="Goal Difference">GD</TableHead>
                <TableHead className="text-center font-bold text-primary">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings?.map((row, idx) => (
                <TableRow 
                  key={row.teamId}
                  className={cn(
                    "transition-colors",
                    idx === 0 ? "bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary" : ""
                  )}
                >
                  <TableCell className="text-center font-mono font-bold">
                    {idx === 0 ? <Trophy className="h-4 w-4 mx-auto text-primary" /> : row.position}
                  </TableCell>
                  <TableCell className="font-bold">
                    <div className="flex items-center gap-2.5">
                      <TeamLogo
                        size="sm"
                        name={row.teamName}
                        shortName={logoById.get(row.teamId)?.shortName}
                        logoUrl={logoById.get(row.teamId)?.logoUrl}
                      />
                      <span className="truncate">{row.teamName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{row.played}</TableCell>
                  <TableCell className="text-center">{row.won}</TableCell>
                  <TableCell className="text-center">{row.drawn}</TableCell>
                  <TableCell className="text-center">{row.lost}</TableCell>
                  <TableCell className="text-center hidden md:table-cell text-muted-foreground">{row.goalsFor}</TableCell>
                  <TableCell className="text-center hidden md:table-cell text-muted-foreground">{row.goalsAgainst}</TableCell>
                  <TableCell className="text-center font-mono">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</TableCell>
                  <TableCell className="text-center font-bold text-lg text-primary">{row.points}</TableCell>
                </TableRow>
              ))}
              {(!standings || standings.length === 0) && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Standings not available yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex gap-4 text-xs text-muted-foreground mt-4 flex-wrap">
        <span><strong className="text-foreground">P</strong>: Played</span>
        <span><strong className="text-foreground">W</strong>: Won</span>
        <span><strong className="text-foreground">D</strong>: Drawn</span>
        <span><strong className="text-foreground">L</strong>: Lost</span>
        <span className="hidden md:inline"><strong className="text-foreground">GF</strong>: Goals For</span>
        <span className="hidden md:inline"><strong className="text-foreground">GA</strong>: Goals Against</span>
        <span><strong className="text-foreground">GD</strong>: Goal Difference</span>
        <span><strong className="text-foreground">Pts</strong>: Points</span>
      </div>
    </div>
  );
}
