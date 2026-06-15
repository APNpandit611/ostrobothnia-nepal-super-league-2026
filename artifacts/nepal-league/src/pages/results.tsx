import { useState } from "react";
import { useListMatches } from "@workspace/api-client-react";
import type { Match, Goal, Card as MatchCard } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, CalendarDays, ClipboardList, Clock, ArrowDownWideNarrow } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { TeamLogo } from "@/components/team-logo";

type SortOrder = "latest" | "earliest";

function matchTimestamp(m: Match): number {
  const raw = m.finishedAt ?? m.scheduledTime;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** A small soccer ball icon used to mark goals. */
function SoccerBall({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7.8 15.99 10.7 14.47 15.4 9.53 15.4 8.01 10.7Z" fill="currentColor" />
      <path d="M12 7.8 12 2.8M15.99 10.7 20.7 9.2M14.47 15.4 17.4 19.7M9.53 15.4 6.6 19.7M8.01 10.7 3.3 9.2" />
    </svg>
  );
}

interface ScorerLine {
  name: string;
  minutes: number[];
  count: number;
}

/** Group goals by scorer, preserving order, so repeat scorers show one line with a count. */
function groupGoals(goals: Goal[]): ScorerLine[] {
  const order: string[] = [];
  const map = new Map<string, ScorerLine>();
  for (const g of goals) {
    const name = g.scorerName || "Unknown";
    const existing = map.get(name);
    if (existing) {
      existing.count += 1;
      existing.minutes.push(g.minute);
    } else {
      order.push(name);
      map.set(name, { name, minutes: [g.minute], count: 1 });
    }
  }
  return order.map((n) => map.get(n)!);
}

export default function Results() {
  const { data: matches, isLoading } = useListMatches({ status: 'finished' });
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const finishedMatches = (matches?.filter(m => m.status === 'finished') || [])
    .slice()
    .sort((a, b) => {
      const diff =
        sortOrder === "latest"
          ? matchTimestamp(b) - matchTimestamp(a)
          : matchTimestamp(a) - matchTimestamp(b);
      if (diff !== 0) return diff;
      // Deterministic tiebreaker when timestamps are equal/missing.
      return sortOrder === "latest"
        ? b.matchNumber - a.matchNumber
        : a.matchNumber - b.matchNumber;
    });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black tracking-tight uppercase italic">Results</h1>
        {finishedMatches.length > 0 && (
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="w-[180px] h-9 text-sm" aria-label="Sort results">
              <ArrowDownWideNarrow className="h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest first</SelectItem>
              <SelectItem value="earliest">Earliest first</SelectItem>
            </SelectContent>
          </Select>
        )}
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
            Full Time
          </Badge>
        </div>

        {/* Scoreboard */}
        <div className="px-4 py-5 md:px-6 md:py-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
          {/* Home team */}
          <div className="text-right space-y-2 min-w-0">
            <div className="flex items-center justify-end gap-2 min-w-0">
              <TeamLogo name={match.homeTeamName} shortName={match.homeTeamShortName} logoUrl={match.homeTeamLogo} size="md" />
              <h2 className="text-base md:text-xl font-bold truncate">{match.homeTeamName}</h2>
            </div>
            <div className="space-y-0.5">
              {groupGoals(homeGoals).map((g, i) => (
                <div key={i} className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
                  <span className="truncate">{g.name}</span>
                  <span className="text-muted-foreground/70 font-mono">{g.minutes.map(m => `${m}'`).join(", ")}</span>
                  <span className="flex items-center gap-0.5 text-primary">
                    <SoccerBall className="h-3 w-3" />
                    {g.count > 1 && <span className="font-bold text-[10px]">×{g.count}</span>}
                  </span>
                </div>
              ))}
              {groupGoals(ownGoalsForHome).map((g, i) => (
                <div key={`og-${i}`} className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
                  <span className="truncate">(OG) {g.name}</span>
                  <span className="text-muted-foreground/70 font-mono">{g.minutes.map(m => `${m}'`).join(", ")}</span>
                  <span className="flex items-center gap-0.5 text-muted-foreground/60">
                    <SoccerBall className="h-3 w-3" />
                    {g.count > 1 && <span className="font-bold text-[10px]">×{g.count}</span>}
                  </span>
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
          <div className="text-left space-y-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <TeamLogo name={match.awayTeamName} shortName={match.awayTeamShortName} logoUrl={match.awayTeamLogo} size="md" />
              <h2 className="text-base md:text-xl font-bold truncate">{match.awayTeamName}</h2>
            </div>
            <div className="space-y-0.5">
              {groupGoals(awayGoals).map((g, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-0.5 text-primary">
                    <SoccerBall className="h-3 w-3" />
                    {g.count > 1 && <span className="font-bold text-[10px]">×{g.count}</span>}
                  </span>
                  <span className="text-muted-foreground/70 font-mono">{g.minutes.map(m => `${m}'`).join(", ")}</span>
                  <span className="truncate">{g.name}</span>
                </div>
              ))}
              {groupGoals(ownGoalsForAway).map((g, i) => (
                <div key={`og-${i}`} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-0.5 text-muted-foreground/60">
                    <SoccerBall className="h-3 w-3" />
                    {g.count > 1 && <span className="font-bold text-[10px]">×{g.count}</span>}
                  </span>
                  <span className="text-muted-foreground/70 font-mono">{g.minutes.map(m => `${m}'`).join(", ")}</span>
                  <span className="truncate">(OG) {g.name}</span>
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
