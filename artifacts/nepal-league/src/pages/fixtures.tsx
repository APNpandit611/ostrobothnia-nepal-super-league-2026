import { useListMatches } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { CalendarDays, Clock, MapPin, Loader2 } from "lucide-react";
import { MatchStatus } from "@workspace/api-zod/src/generated/types";
import { Link } from "wouter";

export default function Fixtures() {
  const { data: matches, isLoading } = useListMatches();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderMatchCard = (match: any) => {
    return (
      <Link key={match.id} href={`/live`} className="block w-full">
        <Card className="hover:border-primary transition-colors overflow-hidden">
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
              <Badge variant={match.status === 'live' ? 'default' : match.status === 'finished' ? 'secondary' : 'outline'} className={match.status === 'live' ? 'animate-pulse' : ''}>
                {match.status.toUpperCase()}
              </Badge>
            </div>
            
            <div className="p-4 grid grid-cols-3 items-center gap-4">
              <div className="text-right font-bold md:text-lg">
                {match.homeTeamName}
              </div>
              
              <div className="text-center flex flex-col items-center justify-center">
                {match.status === 'upcoming' ? (
                  <div className="bg-muted px-4 py-2 rounded font-mono text-xl font-bold tracking-widest text-muted-foreground">
                    VS
                  </div>
                ) : (
                  <div className="bg-background border px-4 py-2 rounded font-mono text-2xl font-black tracking-widest shadow-sm">
                    {match.homeScore} - {match.awayScore}
                  </div>
                )}
              </div>
              
              <div className="text-left font-bold md:text-lg">
                {match.awayTeamName}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const upcomingMatches = matches?.filter(m => m.status === 'upcoming') || [];
  const liveMatches = matches?.filter(m => m.status === 'live') || [];
  const finishedMatches = matches?.filter(m => m.status === 'finished') || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight uppercase italic">Fixtures</h1>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-4 md:inline-flex">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingMatches.length})</TabsTrigger>
          <TabsTrigger value="live" className="data-[state=active]:text-primary">Live ({liveMatches.length})</TabsTrigger>
          <TabsTrigger value="finished">Finished ({finishedMatches.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-6">
          {matches?.map(renderMatchCard)}
          {(!matches || matches.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">No matches found</div>
          )}
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcomingMatches.map(renderMatchCard)}
          {upcomingMatches.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No upcoming matches</div>
          )}
        </TabsContent>
        
        <TabsContent value="live" className="space-y-4 mt-6">
          {liveMatches.map(renderMatchCard)}
          {liveMatches.length === 0 && (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center space-y-2">
              <Clock className="h-8 w-8 opacity-20" />
              <p>No matches currently live</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="finished" className="space-y-4 mt-6">
          {finishedMatches.map(renderMatchCard)}
          {finishedMatches.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No finished matches</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
