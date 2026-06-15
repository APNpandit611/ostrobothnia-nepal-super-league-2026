import { useListMatches, getListMatchesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { TeamLogo } from "@/components/team-logo";
import { Loader2, Activity } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

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

  const liveMatches = matches?.filter(m => m.status === 'live') || [];

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
          {liveMatches.map(match => (
            <Card key={match.id} className="overflow-hidden border-primary/50 shadow-lg shadow-primary/5">
              <CardContent className="p-0">
                <div className="bg-primary text-primary-foreground p-2 text-center text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <span className="animate-pulse w-2 h-2 rounded-full bg-white"></span>
                  Pitch {match.pitch} • Live
                </div>
                
                <div className="p-6 md:p-10 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                  <div className="flex items-center justify-end gap-3 min-w-0">
                    <h2 className="text-xl md:text-3xl font-black truncate">{match.homeTeamName}</h2>
                    <TeamLogo name={match.homeTeamName} shortName={match.homeTeamShortName} logoUrl={match.homeTeamLogo} size="lg" />
                  </div>
                  
                  <div className="bg-background border-2 border-border shadow-inner px-6 py-4 rounded-xl font-mono text-4xl md:text-6xl font-black tracking-tighter">
                    {match.homeScore} - {match.awayScore}
                  </div>
                  
                  <div className="flex items-center justify-start gap-3 min-w-0">
                    <TeamLogo name={match.awayTeamName} shortName={match.awayTeamShortName} logoUrl={match.awayTeamLogo} size="lg" />
                    <h2 className="text-xl md:text-3xl font-black truncate">{match.awayTeamName}</h2>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
