import { useListTeams, useGetStandings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, Crosshair, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Teams() {
  const { data: teams, isLoading: teamsLoading } = useListTeams();
  const { data: standings, isLoading: standingsLoading } = useGetStandings();

  if (teamsLoading || standingsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight uppercase italic">Teams</h1>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams?.map(team => {
          const stats = standings?.find(s => s.teamId === team.id);
          
          return (
            <Card key={team.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              <div 
                className="h-2 w-full" 
                style={{ backgroundColor: team.primaryColor || 'hsl(var(--primary))' }}
              />
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">{team.name}</CardTitle>
                <p className="text-muted-foreground font-mono text-sm">{team.shortName}</p>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="grid grid-cols-3 gap-2 text-center mt-4">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-2xl font-black">{stats.points}</div>
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Pts</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-2xl font-black">{stats.goalsFor}</div>
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1 flex items-center justify-center gap-1">
                        <Crosshair className="h-3 w-3" /> GF
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-2xl font-black">{stats.goalsAgainst}</div>
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1 flex items-center justify-center gap-1">
                        <Shield className="h-3 w-3" /> GA
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg mt-4">
                    No stats available yet
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
