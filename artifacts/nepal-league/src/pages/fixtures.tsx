import {
  useListMatches,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  CalendarDays, Clock, MapPin, Loader2, Crown,
} from "lucide-react";
import { TeamLogo } from "@/components/team-logo";
// ─── Shared match card ────────────────────────────────────────────────────────
function MatchCard({ match, large = false }: { match: any; large?: boolean }) {
  const isFinal = match.matchType === "final";
  if (large) {
    return (
      <Card className={`overflow-hidden shadow-lg ${isFinal ? "border-2 border-amber-500/50 shadow-amber-500/10" : "border-primary/50 shadow-primary/5"}`}>
        <CardContent className="p-0">
          <div className={`text-white p-2 text-center text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${isFinal ? "bg-amber-500" : "bg-primary"}`}>
            <span className="animate-pulse w-2 h-2 rounded-full bg-white" />
            {isFinal ? (
              <span className="flex items-center gap-1.5"><Crown className="h-4 w-4" /> FINAL</span>
            ) : `Pitch ${match.pitch}`} • Live
          </div>
          <div className="p-6 md:p-10 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
            <div className="flex items-center justify-end gap-3 min-w-0">
              <TeamLogo name={match.homeTeamName} shortName={match.homeTeamShortName} logoUrl={match.homeTeamLogo} size="lg" />
              <h2 className="text-xl md:text-3xl font-black truncate min-w-0">{match.homeTeamName}</h2>
            </div>
            <div className="bg-background border-2 border-border shadow-inner px-6 py-4 rounded-xl font-mono text-4xl md:text-6xl font-black tracking-tighter">
              {match.homeScore} – {match.awayScore}
            </div>
            <div className="flex items-center justify-start gap-3 min-w-0">
              <h2 className="text-xl md:text-3xl font-black text-left truncate min-w-0">{match.awayTeamName}</h2>
              <TeamLogo name={match.awayTeamName} shortName={match.awayTeamShortName} logoUrl={match.awayTeamLogo} size="lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden transition-colors ${isFinal ? "border-2 border-amber-500/50 shadow-md shadow-amber-500/10" : "hover:border-primary"}`}>
      <CardContent className="p-0">
        <div className={`flex justify-between items-center p-3 text-sm font-medium border-b ${isFinal ? "bg-amber-500/10" : "bg-muted/50"}`}>
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
          <div className="flex items-center gap-2">
            {isFinal && (
              <Badge variant="outline" className="border-amber-500 text-amber-500 font-bold bg-amber-500/10">
                <Crown className="h-3 w-3 mr-1" /> FINAL
              </Badge>
            )}
            <Badge
              variant={match.status === "live" ? "default" : match.status === "finished" ? "secondary" : "outline"}
              className={match.status === "live" ? "animate-pulse" : ""}
            >
              {match.status === "finished" ? "Full Time" : match.status.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="p-4 grid grid-cols-3 items-center gap-4">
          <div className="flex items-center justify-end gap-2 min-w-0">
            <TeamLogo name={match.homeTeamName} shortName={match.homeTeamShortName} logoUrl={match.homeTeamLogo} size="sm" />
            <span className="font-bold md:text-lg truncate min-w-0">{match.homeTeamName}</span>
          </div>
          <div className="text-center">
            {match.status === "upcoming" ? (
              <div className="bg-muted px-4 py-2 rounded font-mono text-xl font-bold tracking-widest text-muted-foreground">VS</div>
            ) : (
              <div className="bg-background border px-4 py-2 rounded font-mono text-2xl font-black tracking-widest shadow-sm">
                {match.homeScore} – {match.awayScore}
              </div>
            )}
          </div>
          <div className="flex items-center justify-start gap-2 min-w-0">
            <span className="text-left font-bold md:text-lg truncate min-w-0">{match.awayTeamName}</span>
            <TeamLogo name={match.awayTeamName} shortName={match.awayTeamShortName} logoUrl={match.awayTeamLogo} size="sm" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tab: Fixtures ────────────────────────────────────────────────────────────
function FixturesTab() {
  const { data: matches, isLoading } = useListMatches();
  if (isLoading) return <TabLoader />;

  // Finals always shown first
  const finalFirst = (list: any[]) =>
    list.slice().sort((a, b) => {
      if (a.matchType === "final" && b.matchType !== "final") return -1;
      if (b.matchType === "final" && a.matchType !== "final") return 1;
      return a.matchNumber - b.matchNumber;
    });

  const upcoming = finalFirst(matches?.filter(m => m.status === "upcoming") ?? []);
  const live     = finalFirst(matches?.filter(m => m.status === "live") ?? []);
  const finished = finalFirst(matches?.filter(m => m.status === "finished") ?? []);
  const all      = finalFirst(matches ?? []);

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="w-full grid grid-cols-4">
        <TabsTrigger value="all">All ({all.length})</TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
        <TabsTrigger value="live" className="data-[state=active]:text-primary">Live ({live.length})</TabsTrigger>
        <TabsTrigger value="finished">Finished ({finished.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="space-y-3 mt-4">
        {all.length ? all.map(m => <MatchCard key={m.id} match={m} />) : <Empty text="No matches yet" />}
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

export default function Fixtures() {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <FixturesTab />
    </div>
  );
}
