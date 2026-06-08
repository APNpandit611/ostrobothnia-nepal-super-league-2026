import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetMatch,
  useStartMatch,
  useFinishMatch,
  useResetMatch,
  useAddGoal,
  useAddCard,
  getGetMatchQueryKey,
  useListMatchEvents,
  getListMatchEventsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, Square, RotateCcw, Target, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

export default function AdminMatchDetail() {
  const [, params] = useRoute("/admin/match/:id");
  const matchId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: match, isLoading } = useGetMatch(matchId, {
    query: { refetchInterval: 5000 }
  });
  
  const { data: events } = useListMatchEvents(matchId, {
    query: { refetchInterval: 5000 }
  });

  // Goal Form State
  const [scorerName, setScorerName] = useState("");
  const [goalMinute, setGoalMinute] = useState("");
  const [isOwnGoal, setIsOwnGoal] = useState(false);

  // Card Form State
  const [playerName, setPlayerName] = useState("");
  const [cardMinute, setCardMinute] = useState("");

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getGetMatchQueryKey(matchId) });
    queryClient.invalidateQueries({ queryKey: getListMatchEventsQueryKey(matchId) });
  };

  const startMutation = useStartMatch({
    mutation: {
      onSuccess: () => {
        toast({ title: "Match Started" });
        invalidateQueries();
      }
    }
  });

  const finishMutation = useFinishMatch({
    mutation: {
      onSuccess: () => {
        toast({ title: "Match Finished" });
        invalidateQueries();
      }
    }
  });

  const resetMutation = useResetMatch({
    mutation: {
      onSuccess: () => {
        toast({ title: "Match Reset to Upcoming" });
        invalidateQueries();
      }
    }
  });

  const addGoalMutation = useAddGoal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Goal Added!" });
        setScorerName("");
        setGoalMinute("");
        setIsOwnGoal(false);
        invalidateQueries();
      }
    }
  });

  const addCardMutation = useAddCard({
    mutation: {
      onSuccess: () => {
        toast({ title: "Card Added" });
        setPlayerName("");
        setCardMinute("");
        invalidateQueries();
      }
    }
  });

  const handleAddGoal = (teamId: number) => {
    if (!scorerName || !goalMinute) {
      toast({ variant: "destructive", title: "Error", description: "Scorer name and minute required" });
      return;
    }
    addGoalMutation.mutate({
      matchId,
      data: { teamId, scorerName, minute: parseInt(goalMinute), isOwnGoal }
    });
  };

  const handleAddCard = (teamId: number, cardType: 'yellow' | 'red') => {
    if (!playerName || !cardMinute) {
      toast({ variant: "destructive", title: "Error", description: "Player name and minute required" });
      return;
    }
    addCardMutation.mutate({
      matchId,
      data: { teamId, playerName, cardType, minute: parseInt(cardMinute) }
    });
  };

  if (isLoading || !match) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Scoreboard Header */}
      <Card className="border-2 border-primary/20 bg-card overflow-hidden">
        <div className="bg-primary/5 p-4 flex justify-between items-center border-b border-primary/10">
          <Badge variant={match.status === 'live' ? 'default' : match.status === 'finished' ? 'secondary' : 'outline'} className={match.status === 'live' ? 'animate-pulse' : ''}>
            {match.status.toUpperCase()}
          </Badge>
          <div className="text-sm font-bold text-muted-foreground">Match {match.matchNumber} • Pitch {match.pitch}</div>
        </div>
        <CardContent className="p-8 grid grid-cols-[1fr_auto_1fr] items-center gap-8">
          <div className="text-right">
            <h2 className="text-2xl md:text-4xl font-black">{match.homeTeamName}</h2>
          </div>
          
          <div className="bg-background border-2 border-border shadow-inner px-8 py-4 rounded-xl font-mono text-5xl md:text-7xl font-black tracking-tighter text-center">
            {match.homeScore} - {match.awayScore}
          </div>
          
          <div className="text-left">
            <h2 className="text-2xl md:text-4xl font-black">{match.awayTeamName}</h2>
          </div>
        </CardContent>
      </Card>

      {/* Match Controls */}
      <div className="flex gap-4 justify-center bg-muted/30 p-4 rounded-xl border">
        {match.status === 'upcoming' && (
          <Button size="lg" className="w-full md:w-auto" onClick={() => startMutation.mutate({ id: matchId })} disabled={startMutation.isPending}>
            <Play className="mr-2 h-5 w-5" /> Start Match
          </Button>
        )}
        {match.status === 'live' && (
          <Button size="lg" variant="destructive" className="w-full md:w-auto" onClick={() => finishMutation.mutate({ id: matchId })} disabled={finishMutation.isPending}>
            <Square className="mr-2 h-5 w-5" /> End Match
          </Button>
        )}
        {(match.status === 'live' || match.status === 'finished') && (
          <Button size="lg" variant="outline" onClick={() => resetMutation.mutate({ id: matchId })} disabled={resetMutation.isPending}>
            <RotateCcw className="mr-2 h-5 w-5" /> Reset to Upcoming
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Home Team Panel */}
        <Card className="border-primary/20">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle>{match.homeTeamName}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                <Target className="h-4 w-4" /> Add Goal
              </h3>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Scorer Name" value={scorerName} onChange={(e) => setScorerName(e.target.value)} />
                  <Input type="number" placeholder="Minute" value={goalMinute} onChange={(e) => setGoalMinute(e.target.value)} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="own-goal-home" checked={isOwnGoal} onCheckedChange={setIsOwnGoal} />
                  <Label htmlFor="own-goal-home">Own Goal</Label>
                </div>
                <Button className="w-full font-bold" onClick={() => handleAddGoal(match.homeTeamId)} disabled={addGoalMutation.isPending}>
                  +1 Goal Home
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Add Card
              </h3>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Player Name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
                  <Input type="number" placeholder="Minute" value={cardMinute} onChange={(e) => setCardMinute(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 border-yellow-500/50" onClick={() => handleAddCard(match.homeTeamId, 'yellow')} disabled={addCardMutation.isPending}>
                    Yellow
                  </Button>
                  <Button variant="outline" className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/50" onClick={() => handleAddCard(match.homeTeamId, 'red')} disabled={addCardMutation.isPending}>
                    Red
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Away Team Panel */}
        <Card className="border-primary/20">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-right">{match.awayTeamName}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 justify-end">
                Add Goal <Target className="h-4 w-4" />
              </h3>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Minute" value={goalMinute} onChange={(e) => setGoalMinute(e.target.value)} />
                  <Input placeholder="Scorer Name" value={scorerName} onChange={(e) => setScorerName(e.target.value)} className="text-right" />
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <Label htmlFor="own-goal-away">Own Goal</Label>
                  <Switch id="own-goal-away" checked={isOwnGoal} onCheckedChange={setIsOwnGoal} />
                </div>
                <Button className="w-full font-bold" onClick={() => handleAddGoal(match.awayTeamId)} disabled={addGoalMutation.isPending}>
                  +1 Goal Away
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 justify-end">
                Add Card <AlertTriangle className="h-4 w-4" />
              </h3>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Minute" value={cardMinute} onChange={(e) => setCardMinute(e.target.value)} />
                  <Input placeholder="Player Name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="text-right" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 border-yellow-500/50" onClick={() => handleAddCard(match.awayTeamId, 'yellow')} disabled={addCardMutation.isPending}>
                    Yellow
                  </Button>
                  <Button variant="outline" className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/50" onClick={() => handleAddCard(match.awayTeamId, 'red')} disabled={addCardMutation.isPending}>
                    Red
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events && events.length > 0 ? (
            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
                  <div className="font-mono font-bold text-primary w-12">{event.minute}'</div>
                  <Badge variant="outline">{event.eventType}</Badge>
                  <div className="font-medium flex-1">
                    {event.playerName && <span className="font-bold mr-2">{event.playerName}</span>}
                    {event.description}
                  </div>
                  <div className="text-sm text-muted-foreground">{event.teamName}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No events recorded yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
