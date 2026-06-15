import { useGetTournamentStats, useGetTopScorers, useListTeams } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy, Target, Shield, Flame, Activity, X, Crown, Minimize2 } from "lucide-react";
import { TeamLogo } from "@/components/team-logo";

export default function Stats() {
  const { data: stats, isLoading: statsLoading } = useGetTournamentStats();
  const { data: topScorers, isLoading: scorersLoading } = useGetTopScorers();
  const { data: teams } = useListTeams();
  const teamByName = new Map((teams ?? []).map((t) => [t.name, t] as const));
  const findTeam = (name: string | undefined | null) => (name ? teamByName.get(name) : undefined);

  if (statsLoading || scorersLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight uppercase italic">Tournament Stats</h1>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold uppercase tracking-wider text-sm opacity-90">Total Goals</h3>
              <Target className="h-5 w-5 opacity-80" />
            </div>
            <div className="text-5xl font-black">{stats?.totalGoals || 0}</div>
            <p className="text-sm mt-2 opacity-80 font-medium">
              Avg {stats?.averageGoalsPerMatch?.toFixed(1) || 0} per match
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold uppercase tracking-wider text-sm text-muted-foreground">Most Goals</h3>
              <Flame className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              {stats?.mostGoalsTeam && (
                <TeamLogo size="md" name={stats.mostGoalsTeam.teamName} shortName={findTeam(stats.mostGoalsTeam.teamName)?.shortName} logoUrl={findTeam(stats.mostGoalsTeam.teamName)?.logoUrl} />
              )}
              <div className="text-sm font-bold leading-tight break-words">{stats?.mostGoalsTeam?.teamName || "-"}</div>
            </div>
            <p className="text-sm mt-2 text-primary font-bold">
              {stats?.mostGoalsTeam?.goals || 0} goal{stats?.mostGoalsTeam?.goals === 1 ? "" : "s"} scored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold uppercase tracking-wider text-sm text-muted-foreground">Best Defense</h3>
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              {stats?.bestDefenseTeam && (
                <TeamLogo size="md" name={stats.bestDefenseTeam.teamName} shortName={findTeam(stats.bestDefenseTeam.teamName)?.shortName} logoUrl={findTeam(stats.bestDefenseTeam.teamName)?.logoUrl} />
              )}
              <div className="text-sm font-bold leading-tight break-words">{stats?.bestDefenseTeam?.teamName || "-"}</div>
            </div>
            <p className="text-sm mt-2 text-primary font-bold">
              Only {stats?.bestDefenseTeam?.goalsAgainst || 0} goal{stats?.bestDefenseTeam?.goalsAgainst === 1 ? "" : "s"} conceded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold uppercase tracking-wider text-sm text-muted-foreground">Most Wins</h3>
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              {stats?.mostWinsTeam && (
                <TeamLogo size="md" name={stats.mostWinsTeam.teamName} shortName={findTeam(stats.mostWinsTeam.teamName)?.shortName} logoUrl={findTeam(stats.mostWinsTeam.teamName)?.logoUrl} />
              )}
              <div className="text-sm font-bold leading-tight break-words">{stats?.mostWinsTeam?.teamName || "-"}</div>
            </div>
            <p className="text-sm mt-2 text-primary font-bold">
              {stats?.mostWinsTeam?.wins || 0} match{stats?.mostWinsTeam?.wins === 1 ? "" : "es"} won
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold uppercase tracking-wider text-sm text-muted-foreground">Most Draws</h3>
              <X className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              {stats?.mostDrawsTeam && (
                <TeamLogo size="md" name={stats.mostDrawsTeam.teamName} shortName={findTeam(stats.mostDrawsTeam.teamName)?.shortName} logoUrl={findTeam(stats.mostDrawsTeam.teamName)?.logoUrl} />
              )}
              <div className="text-sm font-bold leading-tight break-words">{stats?.mostDrawsTeam?.teamName || "-"}</div>
            </div>
            <p className="text-sm mt-2 text-primary font-bold">
              {stats?.mostDrawsTeam?.draws || 0} draw{stats?.mostDrawsTeam?.draws === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold uppercase tracking-wider text-sm text-muted-foreground">Clean Sheets</h3>
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              {stats?.mostCleanSheetsTeam && (
                <TeamLogo size="md" name={stats.mostCleanSheetsTeam.teamName} shortName={findTeam(stats.mostCleanSheetsTeam.teamName)?.shortName} logoUrl={findTeam(stats.mostCleanSheetsTeam.teamName)?.logoUrl} />
              )}
              <div className="text-sm font-bold leading-tight break-words">{stats?.mostCleanSheetsTeam?.teamName || "-"}</div>
            </div>
            <p className="text-sm mt-2 text-primary font-bold">
              {stats?.mostCleanSheetsTeam?.cleanSheets || 0} clean sheet{stats?.mostCleanSheetsTeam?.cleanSheets === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold uppercase tracking-wider text-sm text-muted-foreground">Biggest Win</h3>
              <Crown className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              {(stats?.biggestWin as any)?.winner && (
                <TeamLogo size="md" name={(stats?.biggestWin as any)?.winner} shortName={findTeam((stats?.biggestWin as any)?.winner)?.shortName} logoUrl={findTeam((stats?.biggestWin as any)?.winner)?.logoUrl} />
              )}
              <div className="text-sm font-bold leading-tight break-words">{(stats?.biggestWin as any)?.winner || "-"}</div>
            </div>
            <p className="text-sm mt-2 text-primary font-bold">
              {(stats?.biggestWin as any)?.winnerScore ?? 0} - {(stats?.biggestWin as any)?.loserScore ?? 0}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              vs {(stats?.biggestWin as any)?.loser || "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold uppercase tracking-wider text-sm text-muted-foreground">Most Goals (Single Match)</h3>
              <Minimize2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-sm font-bold leading-tight">
              <span>{findTeam(stats?.highestScoringMatch?.homeTeam)?.shortName || stats?.highestScoringMatch?.homeTeam || "-"}</span>
              <span className="text-muted-foreground mx-1">vs</span>
              <span>{findTeam(stats?.highestScoringMatch?.awayTeam)?.shortName || stats?.highestScoringMatch?.awayTeam || "-"}</span>
            </div>
            <p className="text-sm mt-2 text-primary font-bold">
              {stats?.highestScoringMatch?.homeScore ?? 0} - {stats?.highestScoringMatch?.awayScore ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats?.highestScoringMatch?.totalGoals ?? 0} total goals
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Top Scorers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right font-bold text-primary">Goals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topScorers?.map((scorer, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-center font-mono font-bold text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-bold">{scorer.scorerName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <TeamLogo size="sm" name={scorer.teamName} shortName={findTeam(scorer.teamName)?.shortName} logoUrl={findTeam(scorer.teamName)?.logoUrl} />
                        <span className="truncate">{scorer.teamName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-black text-lg">{scorer.goals}</TableCell>
                  </TableRow>
                ))}
                {(!topScorers || topScorers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No goals scored yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Tournament Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span>Matches Played</span>
                    <span>{stats?.matchesPlayed || 0} / {stats?.totalMatches || 10}</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${((stats?.matchesPlayed || 0) / (stats?.totalMatches || 10)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {stats?.highestScoringMatch && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                  <Flame className="h-4 w-4" />
                  Highest Scoring Match
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    <div className="font-bold text-sm truncate min-w-0 text-right">{findTeam(stats.highestScoringMatch.homeTeam)?.shortName || stats.highestScoringMatch.homeTeam}</div>
                    <TeamLogo size="md" name={stats.highestScoringMatch.homeTeam} shortName={findTeam(stats.highestScoringMatch.homeTeam)?.shortName} logoUrl={findTeam(stats.highestScoringMatch.homeTeam)?.logoUrl} />
                  </div>
                  <div className="bg-muted px-4 py-2 rounded font-mono text-xl font-black whitespace-nowrap mx-2">
                    {stats.highestScoringMatch.homeScore} - {stats.highestScoringMatch.awayScore}
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <TeamLogo size="md" name={stats.highestScoringMatch.awayTeam} shortName={findTeam(stats.highestScoringMatch.awayTeam)?.shortName} logoUrl={findTeam(stats.highestScoringMatch.awayTeam)?.logoUrl} />
                    <div className="font-bold text-sm truncate min-w-0">{findTeam(stats.highestScoringMatch.awayTeam)?.shortName || stats.highestScoringMatch.awayTeam}</div>
                  </div>
                </div>
                {/* Goal scorers */}
                <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-muted-foreground">
                  <div className="text-right space-y-0.5">
                    {(stats.highestScoringMatch as any).homeScorers?.length > 0 && (
                      <div className="space-y-0.5">
                        {(stats.highestScoringMatch as any).homeScorers.map((name: string, i: number) => (
                          <div key={i} className="flex items-center justify-end gap-1.5">
                            <span className="truncate">{name}</span>
                            <span className="text-primary"><Target className="h-2.5 w-2.5" /></span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(stats.highestScoringMatch as any).ownGoalsForHome?.length > 0 && (
                      <div className="space-y-0.5">
                        {(stats.highestScoringMatch as any).ownGoalsForHome.map((name: string, i: number) => (
                          <div key={`og-home-${i}`} className="flex items-center justify-end gap-1.5 opacity-60">
                            <span className="truncate">(OG) {name}</span>
                            <span className="text-muted-foreground"><Target className="h-2.5 w-2.5" /></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-left space-y-0.5">
                    {(stats.highestScoringMatch as any).awayScorers?.length > 0 && (
                      <div className="space-y-0.5">
                        {(stats.highestScoringMatch as any).awayScorers.map((name: string, i: number) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="text-primary"><Target className="h-2.5 w-2.5" /></span>
                            <span className="truncate">{name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(stats.highestScoringMatch as any).ownGoalsForAway?.length > 0 && (
                      <div className="space-y-0.5">
                        {(stats.highestScoringMatch as any).ownGoalsForAway.map((name: string, i: number) => (
                          <div key={`og-away-${i}`} className="flex items-center gap-1.5 opacity-60">
                            <span className="text-muted-foreground"><Target className="h-2.5 w-2.5" /></span>
                            <span className="truncate">(OG) {name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center mt-3 text-sm font-medium text-primary">
                  {stats.highestScoringMatch.totalGoals} Total Goal{stats.highestScoringMatch.totalGoals === 1 ? "" : "s"}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
