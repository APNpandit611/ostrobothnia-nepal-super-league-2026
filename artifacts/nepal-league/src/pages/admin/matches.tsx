import { useListMatches } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Activity } from "lucide-react";
import { Link } from "wouter";

export default function AdminMatches() {
  const { data: matches, isLoading } = useListMatches();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Match Control
          </h1>
          <p className="text-muted-foreground mt-1">Select a match to manage live events</p>
        </div>
      </div>

      <div className="grid gap-4">
        {matches?.map((match) => (
          <Link key={match.id} href={`/admin/match/${match.id}`}>
            <Card className="hover:border-primary transition-all cursor-pointer overflow-hidden group">
              <CardContent className="p-0 flex flex-col md:flex-row md:items-center">
                <div className="w-full md:w-32 p-4 bg-muted/30 flex items-center justify-between md:justify-center border-b md:border-b-0 md:border-r">
                  <div className="text-sm font-bold text-muted-foreground">Match {match.matchNumber}</div>
                  <Badge 
                    variant={match.status === 'live' ? 'default' : match.status === 'finished' ? 'secondary' : 'outline'}
                    className={match.status === 'live' ? 'animate-pulse' : ''}
                  >
                    {match.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex-1 p-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="text-right font-bold text-lg">{match.homeTeamName}</div>
                  <div className="bg-background border px-4 py-2 rounded font-mono text-xl font-bold tracking-widest shadow-sm">
                    {match.status === 'upcoming' ? 'VS' : `${match.homeScore} - ${match.awayScore}`}
                  </div>
                  <div className="text-left font-bold text-lg">{match.awayTeamName}</div>
                </div>

                <div className="w-full md:w-auto p-4 border-t md:border-t-0 flex justify-end">
                  <Button variant={match.status === 'live' ? "default" : "secondary"} className="w-full md:w-auto group-hover:bg-primary group-hover:text-primary-foreground">
                    {match.status === 'finished' ? 'Edit Events' : match.status === 'upcoming' ? 'Start Match' : 'Manage Live'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {(!matches || matches.length === 0) && (
          <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed">
            No matches generated yet. Go to Dashboard to generate fixtures.
          </div>
        )}
      </div>
    </div>
  );
}
