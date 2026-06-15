import { useListMatches } from "@workspace/api-client-react";
import type { Match, Goal, Card as MatchCard } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, CalendarDays, ClipboardList, Clock, Crosshair } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

export default function Results() {
  const { data: matches, isLoading } = useListMatches({ status: 'finished' });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const finishedMatches = matches?.filter(m => m.status === 'finished') || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight uppercase italic">Results</h1>
      </div>

      {finishedMatches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center space-y-4">
            <ClipboardList className="h-12 w-12 text-muted-foreground opacity-20" />
            <div className="space-y-1">
              <h3 className="font-bold text-lg">No matches finished yet</h3>
              <p className="text-muted-foreground text-sm">Results will appear here once games conclude.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {finishedMatches.map(match => (
            <MatchResultCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchResultCard({ match }: { match: Match }) {
  const goals = (match.goals ?? []) as Goal[];
  const cards = (match.cards ?? []) as MatchCard[];

  const homeGoals = goals.filter(g => !g.isOwnGoal && g.teamId === match.homeTeamId);
  const awayGoals = goals.filter(g => !g.isOwnGoal && g.teamId === match.awayTeamId);
  const ownGoalsForHome = goals.filter(g => g.isOwnGoal && g.teamId === match.awayTeamId);
  const ownGoalsForAway = goals.filter(g => g.isOwnGoal && g.teamId === match.homeTeamId);

  const homeCards = cards.filter(c => c.teamId === match.homeTeamId);
  const awayCards = cards.filter(c => c.teamId === match.awayTeamId);

  const duration =
    match.startedAt && match.finishedAt
      ? differenceInMinutes(new Date(match.finishedAt), new Date(match.startedAt))
      : null;

  const homeColor = match.homeTeamColor ?? "#16a34a";
  const awayColor = match.awayTeamColor ?? "#16a34a";

  return (
    <Card className="overflow-hidden border shadow-sm relative">
      {/* Split top bar — left half home team color, right half away team color */}
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(to right, ${homeColor} 0%, ${homeColor} 50%, ${awayColor} 50%, ${awayColor} 100%)`,
        }}
      />

      <CardContent className="p-0 relative z-10">
        {/* Meta header */}
        <div className="flex justify-between items-center p-3 text-xs font-medium border-b bg-muted/50">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {format(new Date(match.scheduledTime), "HH:mm")}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Pitch {match.pitch}
            </span>
            {duration !== null && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {duration} min
              </span>
            )}
          </div>
          <Badge variant="secondary" className="text-[10px] tracking-wider uppercase">
            FT
          </Badge>
        </div>

        {/* Scoreboard */}
        <div className="px-4 py-5 md:px-6 md:py-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
          {/* Home team */}
          <div className="text-right space-y-2">
            <h2 className="text-base md:text-xl font-bold truncate">{match.homeTeamName}</h2>
            <div className="space-y-0.5">
              {homeGoals.map((g, i) => (
                <div key={i} className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
                  <span className="truncate">{g.scorerName || "Unknown"}</span>
                  <span className="text-muted-foreground/70 font-mono">{g.minute}'</span>
                  <Crosshair className="h-3 w-3 text-primary" />
                </div>
              ))}
              {ownGoalsForHome.map((g, i) => (
                <div key={`og-${i}`} className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
                  <span className="truncate">(OG) {g.scorerName || "Unknown"}</span>
                  <span className="text-muted-foreground/70 font-mono">{g.minute}'</span>
                  <Crosshair className="h-3 w-3 text-muted-foreground/60" />
                </div>
              ))}
            </div>
            {homeCards.length > 0 && (
              <div className="flex justify-end gap-1 pt-1">
                {homeCards.map((c, i) => (
                  <span
                    key={i}
                    className={`inline-block w-2.5 h-3.5 rounded-sm border ${
                      c.cardType === "red"
                        ? "bg-red-500 border-red-400"
                        : "bg-yellow-400 border-yellow-300"
                    }`}
                    title={`${c.playerName || "Unknown"} ${c.minute}'`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Score */}
          <div className="bg-background border-2 border-border px-4 py-2 md:px-6 md:py-3 rounded-lg font-mono text-3xl md:text-4xl font-black tracking-tighter text-center shadow-inner">
            {match.homeScore} - {match.awayScore}
          </div>

          {/* Away team */}
          <div className="text-left space-y-2">
            <h2 className="text-base md:text-xl font-bold truncate">{match.awayTeamName}</h2>
            <div className="space-y-0.5">
              {awayGoals.map((g, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Crosshair className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground/70 font-mono">{g.minute}'</span>
                  <span className="truncate">{g.scorerName || "Unknown"}</span>
                </div>
              ))}
              {ownGoalsForAway.map((g, i) => (
                <div key={`og-${i}`} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Crosshair className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-muted-foreground/70 font-mono">{g.minute}'</span>
                  <span className="truncate">(OG) {g.scorerName || "Unknown"}</span>
                </div>
              ))}
            </div>
            {awayCards.length > 0 && (
              <div className="flex gap-1 pt-1">
                {awayCards.map((c, i) => (
                  <span
                    key={i}
                    className={`inline-block w-2.5 h-3.5 rounded-sm border ${
                      c.cardType === "red"
                        ? "bg-red-500 border-red-400"
                        : "bg-yellow-400 border-yellow-300"
                    }`}
                    title={`${c.playerName || "Unknown"} ${c.minute}'`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
