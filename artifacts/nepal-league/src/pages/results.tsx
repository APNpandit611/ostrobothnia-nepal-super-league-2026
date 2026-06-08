import { useListMatches, useGetTopScorers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, CalendarDays, ClipboardList } from "lucide-react";
import { format } from "date-fns";

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
        <div className="grid gap-4">
          {finishedMatches.map(match => (
            <Card key={match.id} className="overflow-hidden">
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
                  <Badge variant="secondary">FULL TIME</Badge>
                </div>
                
                <div className="p-4 md:p-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
                  <div className="text-right">
                    <h2 className="text-lg md:text-2xl font-bold truncate">{match.homeTeamName}</h2>
                  </div>
                  
                  <div className="bg-background border px-4 py-2 md:px-6 md:py-3 rounded-lg font-mono text-2xl md:text-4xl font-black tracking-tighter shadow-sm">
                    {match.homeScore} - {match.awayScore}
                  </div>
                  
                  <div className="text-left">
                    <h2 className="text-lg md:text-2xl font-bold truncate">{match.awayTeamName}</h2>
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
