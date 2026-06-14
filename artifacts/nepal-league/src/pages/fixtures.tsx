import { useEffect } from "react";
import {
  useListMatches,
  useGetStandings,
  useGetTournamentStats,
  useGetTopScorers,
  getListMatchesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import {
  CalendarDays, Clock, MapPin, Loader2, Activity, ClipboardList,
  Trophy, Target, Shield, Flame, ListOrdered, BarChart3,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// ─── Shared match card ────────────────────────────────────────────────────────
function MatchCard({ match, large = false }: { match: any; large?: boolean }) {
  if (large) {
    return (
      <Card className="overflow-hidden border-primary/50 shadow-lg shadow-primary/5">
        <CardContent className="p-0">
          <div className="bg-primary text-primary-foreground p-2 text-center text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="animate-pulse w-2 h-2 rounded-full bg-white" />
            Pitch {match.pitch} • Live
          </div>
          <div className="p-6 md:p-10 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
            <h2 className="text-xl md:text-3xl font-black text-right truncate">{match.homeTeamName}</h2>
            <div className="bg-background border-2 border-border shadow-inner px-6 py-4 rounded-xl font-mono text-4xl md:text-6xl font-black tracking-tighter">
              {match.homeScore} – {match.awayScore}
            </div>
            <h2 className="text-xl md:text-3xl font-black text-left truncate">{match.awayTeamName}</h2>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:border-primary transition-colors">
      <CardContent className="p-0">
        <div className="flex justify-between items-center bg-muted/50 p-3 text-sm font-medium border-b">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(match.scheduledTime), "HH:mm")}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Pitch {match.pitch}
            </span>
          </div>
          <Badge
            variant={match.status === "live" ? "default" : match.status === "finished" ? "secondary" : "outline"}
            className={match.status === "live" ? "animate-pulse" : ""}
          >
            {match.status === "finished" ? "FT" : match.status.toUpperCase()}
          </Badge>
        </div>
        <div className="p-4 grid grid-cols-3 items-center gap-4">
          <div className="text-right font-bold md:text-lg truncate">{match.homeTeamName}</div>
          <div className="text-center">
            {match.status === "upcoming" ? (
              <div className="bg-muted px-4 py-2 rounded font-mono text-xl font-bold tracking-widest text-muted-foreground">VS</div>
            ) : (
              <div className="bg-background border px-4 py-2 rounded font-mono text-2xl font-black tracking-widest shadow-sm">
                {match.homeScore} – {match.awayScore}
              </div>
            )}
          </div>
          <div className="text-left font-bold md:text-lg truncate">{match.awayTeamName}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tab: Fixtures ────────────────────────────────────────────────────────────
function FixturesTab() {
  const { data: matches, isLoading } = useListMatches();
  if (isLoading) return <TabLoader />;

  const upcoming = matches?.filter(m => m.status === "upcoming") ?? [];
  const live     = matches?.filter(m => m.status === "live") ?? [];
  const finished = matches?.filter(m => m.status === "finished") ?? [];

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="w-full grid grid-cols-4">
        <TabsTrigger value="all">All ({matches?.length ?? 0})</TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
        <TabsTrigger value="live" className="data-[state=active]:text-primary">Live ({live.length})</TabsTrigger>
        <TabsTrigger value="finished">Finished ({finished.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="space-y-3 mt-4">
        {matches?.length ? matches.map(m => <MatchCard key={m.id} match={m} />) : <Empty text="No matches yet" />}
      </TabsContent>
      <TabsContent value="upcoming" className="space-y-3 mt-4">
        {upcoming.length ? upcoming.map(m => <MatchCard key={m.id} match={m} />) : <Empty text="No upcoming matches" />}
      </TabsContent>
      <TabsContent value="live" className="space-y-3 mt-4">
        {live.length ? live.map(m => <MatchCard key={m.id} match={m} />) : (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
            <Clock className="h-8 w-8 opacity-20" />
            <p>No matches currently live</p>
          </div>
        )}
      </TabsContent>
      <TabsContent value="finished" className="space-y-3 mt-4">
        {finished.length ? finished.map(m => <MatchCard key={m.id} match={m} />) : <Empty text="No finished matches" />}
      </TabsContent>
    </Tabs>
  );
}

// ─── Tab: Live ────────────────────────────────────────────────────────────────
function LiveTab() {
  const queryClient = useQueryClient();
  const { data: matches, isLoading } = useListMatches();

  useEffect(() => {
    const id = setInterval(() => queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() }), 5000);
    return () => clearInterval(id);
  }, [queryClient]);

  if (isLoading) return <TabLoader />;

  const liveMatches = matches?.filter(m => m.status === "live") ?? [];

  if (!liveMatches.length) {
    return (
      <Card className="border-dashed mt-4">
        <CardContent className="py-16 flex flex-col items-center text-center gap-4">
          <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
          <div>
            <h3 className="font-bold text-lg">No matches live right now</h3>
            <p className="text-muted-foreground text-sm">Check back when a game kicks off.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {liveMatches.map(m => <MatchCard key={m.id} match={m} large />)}
    </div>
  );
}

// ─── Tab: Standings ───────────────────────────────────────────────────────────
function StandingsTab() {
  const { data: standings, isLoading } = useGetStandings();
  if (isLoading) return <TabLoader />;

  return (
    <div className="space-y-4 mt-4">
      <Card className="overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-10 text-center font-bold">#</TableHead>
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
                <TableRow key={row.teamId} className={cn("transition-colors", idx === 0 ? "bg-primary/5 border-l-4 border-l-primary" : "")}>
                  <TableCell className="text-center font-mono font-bold">
                    {idx === 0 ? <Trophy className="h-4 w-4 mx-auto text-primary" /> : row.position}
                  </TableCell>
                  <TableCell className="font-bold">{row.teamName}</TableCell>
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
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Standings not available yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
        <span><strong className="text-foreground">P</strong> Played</span>
        <span><strong className="text-foreground">W</strong> Won</span>
        <span><strong className="text-foreground">D</strong> Drawn</span>
        <span><strong className="text-foreground">L</strong> Lost</span>
        <span className="hidden md:inline"><strong className="text-foreground">GF</strong> Goals For</span>
        <span className="hidden md:inline"><strong className="text-foreground">GA</strong> Goals Against</span>
        <span><strong className="text-foreground">GD</strong> Goal Difference</span>
        <span><strong className="text-foreground">Pts</strong> Points</span>
      </div>
    </div>
  );
}

// ─── Tab: Results ─────────────────────────────────────────────────────────────
function ResultsTab() {
  const { data: matches, isLoading } = useListMatches({ status: "finished" });
  if (isLoading) return <TabLoader />;

  const finished = matches?.filter(m => m.status === "finished") ?? [];

  if (!finished.length) {
    return (
      <Card className="border-dashed mt-4">
        <CardContent className="py-16 flex flex-col items-center text-center gap-4">
          <ClipboardList className="h-12 w-12 text-muted-foreground opacity-20" />
          <div>
            <h3 className="font-bold text-lg">No results yet</h3>
            <p className="text-muted-foreground text-sm">Results will appear once matches conclude.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {finished.map(m => <MatchCard key={m.id} match={m} />)}
    </div>
  );
}

// ─── Tab: Stats ───────────────────────────────────────────────────────────────
function StatsTab() {
  const { data: stats, isLoading: sl } = useGetTournamentStats();
  const { data: topScorers, isLoading: tl } = useGetTopScorers();
  if (sl || tl) return <TabLoader />;

  return (
    <div className="space-y-6 mt-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold uppercase tracking-wider text-xs opacity-90">Total Goals</h3>
              <Target className="h-4 w-4 opacity-80" />
            </div>
            <div className="text-4xl font-black">{stats?.totalGoals ?? 0}</div>
            <p className="text-xs mt-1 opacity-80">Avg {stats?.averageGoalsPerMatch?.toFixed(1) ?? 0}/match</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Most Goals</h3>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-xl font-black truncate">{stats?.mostGoalsTeam?.teamName ?? "–"}</div>
            <p className="text-xs mt-1 text-primary font-bold">{stats?.mostGoalsTeam?.goals ?? 0} goals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Best Defense</h3>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-xl font-black truncate">{stats?.bestDefenseTeam?.teamName ?? "–"}</div>
            <p className="text-xs mt-1 text-primary font-bold">{stats?.bestDefenseTeam?.goalsAgainst ?? 0} conceded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Most Wins</h3>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-xl font-black truncate">{stats?.mostWinsTeam?.teamName ?? "–"}</div>
            <p className="text-xs mt-1 text-primary font-bold">{stats?.mostWinsTeam?.wins ?? 0} wins</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Scorers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> Top Scorers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right font-bold text-primary">G</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topScorers?.map((s, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-center font-mono font-bold text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-bold">{s.scorerName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.teamName}</TableCell>
                    <TableCell className="text-right font-black text-lg">{s.goals}</TableCell>
                  </TableRow>
                ))}
                {(!topScorers || topScorers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">No goals scored yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Progress + Highest Scoring */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" /> Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Matches Played</span>
                <span>{stats?.matchesPlayed ?? 0} / {stats?.totalMatches ?? 10}</span>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-1000"
                  style={{ width: `${((stats?.matchesPlayed ?? 0) / (stats?.totalMatches ?? 10)) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {stats?.highestScoringMatch && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                  <Flame className="h-4 w-4" /> Highest Scoring Match
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center gap-3">
                  <span className="font-bold truncate">{stats.highestScoringMatch.homeTeam}</span>
                  <span className="bg-muted px-3 py-1.5 rounded font-mono text-lg font-black flex-shrink-0">
                    {stats.highestScoringMatch.homeScore} – {stats.highestScoringMatch.awayScore}
                  </span>
                  <span className="font-bold truncate text-right">{stats.highestScoringMatch.awayTeam}</span>
                </div>
                <p className="text-center mt-3 text-sm font-bold text-primary">{stats.highestScoringMatch.totalGoals} goals total</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function TabLoader() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-12 text-muted-foreground">{text}</div>;
}

// ─── Main page ────────────────────────────────────────────────────────────────
const SECTIONS = [
  { value: "fixtures",  label: "Fixtures",  icon: CalendarDays },
  { value: "live",      label: "Live",      icon: Activity },
  { value: "standings", label: "Standings", icon: ListOrdered },
  { value: "results",   label: "Results",   icon: ClipboardList },
  { value: "stats",     label: "Stats",     icon: BarChart3 },
] as const;

type Section = typeof SECTIONS[number]["value"];

function hashToSection(hash: string): Section {
  const val = hash.replace("#", "");
  return (SECTIONS.find(s => s.value === val)?.value ?? "fixtures") as Section;
}

export default function Fixtures() {
  const [location, setLocation] = useLocation();
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const active = hashToSection(hash);

  const handleTab = (val: string) => {
    window.location.hash = val === "fixtures" ? "" : val;
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Tabs value={active} onValueChange={handleTab} className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          {SECTIONS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={value === "live" ? "data-[state=active]:text-primary" : ""}
            >
              <Icon className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="fixtures"><FixturesTab /></TabsContent>
        <TabsContent value="live"><LiveTab /></TabsContent>
        <TabsContent value="standings"><StandingsTab /></TabsContent>
        <TabsContent value="results"><ResultsTab /></TabsContent>
        <TabsContent value="stats"><StatsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
