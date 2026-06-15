import { useListMatches, getListMatchesQueryKey } from "@workspace/api-client-react";
import type { Goal } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { TeamLogo } from "@/components/team-logo";
import { Loader2, Activity } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

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

export default function Live() {
  const queryClient = useQueryClient();
  const { data: matches, isLoading } = useListMatches();

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
    }, 5000);
    return () => clearInterval(interval);
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const liveMatches = (matches?.filter(m => m.status === 'live') || [])
    .slice()
    .sort((a, b) => {
      if (a.matchType === "final" && b.matchType !== "final") return -1;
      if (b.matchType === "final" && a.matchType !== "final") return 1;
      return a.matchNumber - b.matchNumber;
    });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
        </div>
        <h1 className="text-3xl font-black tracking-tight uppercase italic text-primary">Live Center</h1>
      </div>

      {liveMatches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center space-y-4">
            <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
            <div className="space-y-1">
              <h3 className="font-bold text-lg">No matches currently live</h3>
              <p className="text-muted-foreground text-sm">Check the fixtures tab for upcoming games.</p>
            </div>
            <Link href="/fixtures">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium mt-4">
                View Fixtures
              </button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {liveMatches.map(match => {
            const goals = (match.goals ?? []) as Goal[];
            const homeGoals = goals.filter(g => !g.isOwnGoal && g.teamId === match.homeTeamId);
            const awayGoals = goals.filter(g => !g.isOwnGoal && g.teamId === match.awayTeamId);
            const ownGoalsForHome = goals.filter(g => g.isOwnGoal && g.teamId === match.awayTeamId);
            const ownGoalsForAway = goals.filter(g => g.isOwnGoal && g.teamId === match.homeTeamId);

            return (
              <Card key={match.id} className="overflow-hidden border-primary/50 shadow-lg shadow-primary/5">
                <CardContent className="p-0">
                  <div className="bg-primary text-primary-foreground p-2 text-center text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <span className="animate-pulse w-2 h-2 rounded-full bg-white"></span>
                    {match.matchType === "final" ? "🏆 FINAL" : `Pitch ${match.pitch}`} • Live
                  </div>
                  
                  <div className="p-6 md:p-10 grid grid-cols-[1fr_auto_1fr] items-start gap-6">
                    {/* Home team */}
                    <div className="text-right space-y-2 min-w-0">
                      <div className="flex items-center justify-end gap-3 min-w-0">
                        <TeamLogo name={match.homeTeamName} shortName={match.homeTeamShortName} logoUrl={match.homeTeamLogo} size="lg" />
                        <h2 className="text-xl md:text-3xl font-black truncate min-w-0">{match.homeTeamName}</h2>
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
                    </div>
                    
                    {/* Score */}
                    <div className="bg-background border-2 border-border shadow-inner px-6 py-4 rounded-xl font-mono text-4xl md:text-6xl font-black tracking-tighter text-center self-center">
                      {match.homeScore} - {match.awayScore}
                    </div>
                    
                    {/* Away team */}
                    <div className="text-left space-y-2 min-w-0">
                      <div className="flex items-center justify-start gap-3 min-w-0">
                        <h2 className="text-xl md:text-3xl font-black truncate min-w-0">{match.awayTeamName}</h2>
                        <TeamLogo name={match.awayTeamName} shortName={match.awayTeamShortName} logoUrl={match.awayTeamLogo} size="lg" />
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
