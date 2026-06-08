import { useGetTournamentStats, useGetTopScorers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy, Target, Shield, Flame, Activity } from "lucide-react";

export default function Stats() {
  const { data: stats, isLoading: statsLoading } = useGetTournamentStats();
  const { data: topScorers, isLoading: scorersLoading } = useGetTopScorers();

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

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="text-2xl font-black truncate">{stats?.mostGoalsTeam?.teamName || "-"}</div>
            <p className="text-sm mt-2 text-primary font-bold">
              {stats?.mostGoalsTeam?.goals || 0} goals scored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold uppercase tracking-wider text-sm text-muted-foreground">Best Defense</h3>
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-black truncate">{stats?.bestDefenseTeam?.teamName || "-"}</div>
            <p className="text-sm mt-2 text-primary font-bold">
              Only {stats?.bestDefenseTeam?.goalsAgainst || 0} goals conceded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold uppercase tracking-wider text-sm text-muted-foreground">Most Wins</h3>
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-black truncate">{stats?.mostWinsTeam?.teamName || "-"}</div>
            <p className="text-sm mt-2 text-primary font-bold">
              {stats?.mostWinsTeam?.wins || 0} matches won
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
                    <TableCell className="text-muted-foreground text-sm">{scorer.teamName}</TableCell>
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
                <div className="flex justify-between items-center">
                  <div className="font-bold text-lg">{stats.highestScoringMatch.homeTeam}</div>
                  <div className="bg-muted px-4 py-2 rounded font-mono text-xl font-black">
                    {stats.highestScoringMatch.homeScore} - {stats.highestScoringMatch.awayScore}
                  </div>
                  <div className="font-bold text-lg text-right">{stats.highestScoringMatch.awayTeam}</div>
                </div>
                <div className="text-center mt-4 text-sm font-medium text-primary">
                  {stats.highestScoringMatch.totalGoals} Total Goals
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
