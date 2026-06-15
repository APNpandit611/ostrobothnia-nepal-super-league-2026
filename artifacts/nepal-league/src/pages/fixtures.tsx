import {
  useListMatches,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  CalendarDays, Clock, MapPin, Loader2,
} from "lucide-react";
import { TeamLogo } from "@/components/team-logo";
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
            <div className="flex items-center justify-end gap-3 min-w-0">
              <h2 className="text-xl md:text-3xl font-black text-right truncate">{match.homeTeamName}</h2>
              <TeamLogo name={match.homeTeamName} shortName={match.homeTeamShortName} logoUrl={match.homeTeamLogo} size="lg" />
            </div>
            <div className="bg-background border-2 border-border shadow-inner px-6 py-4 rounded-xl font-mono text-4xl md:text-6xl font-black tracking-tighter">
              {match.homeScore} – {match.awayScore}
            </div>
            <div className="flex items-center justify-start gap-3 min-w-0">
              <TeamLogo name={match.awayTeamName} shortName={match.awayTeamShortName} logoUrl={match.awayTeamLogo} size="lg" />
              <h2 className="text-xl md:text-3xl font-black text-left truncate">{match.awayTeamName}</h2>
            </div>
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
            {match.status === "finished" ? "Full Time" : match.status.toUpperCase()}
          </Badge>
        </div>
        <div className="p-4 grid grid-cols-3 items-center gap-4">
          <div className="flex items-center justify-end gap-2 min-w-0">
            <span className="text-right font-bold md:text-lg truncate">{match.homeTeamName}</span>
            <TeamLogo name={match.homeTeamName} shortName={match.homeTeamShortName} logoUrl={match.homeTeamLogo} size="sm" />
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
            <TeamLogo name={match.awayTeamName} shortName={match.awayTeamShortName} logoUrl={match.awayTeamLogo} size="sm" />
            <span className="text-left font-bold md:text-lg truncate">{match.awayTeamName}</span>
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
