import { Link, useLocation } from "wouter";
import { 
  useAdminLogout, 
  useGetTournamentStats, 
  useListMatches,
  useGenerateFixtures,
  useResetTournament,
  getListMatchesQueryKey,
  getGetTournamentStatsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  LogOut, 
  Settings, 
  Trophy, 
  CalendarDays, 
  Activity, 
  RefreshCcw,
  Users,
  AlertTriangle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useGetTournamentStats();
  const { data: liveMatches } = useListMatches({ status: 'live' });

  const logoutMutation = useAdminLogout({
    mutation: {
      onSuccess: () => {
        setLocation("/admin");
      }
    }
  });

  const generateFixturesMutation = useGenerateFixtures({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Fixtures generated successfully" });
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to generate fixtures" });
      }
    }
  });

  const resetTournamentMutation = useResetTournament({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Tournament reset completely" });
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to reset tournament" });
      }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage tournament data and live matches</p>
        </div>
        <Button variant="outline" onClick={() => logoutMutation.mutate()} className="w-full md:w-auto">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/matches">
          <Card className="hover:border-primary cursor-pointer transition-all hover:shadow-md">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">Live Match Control</h3>
                <p className="text-sm text-muted-foreground">Manage ongoing games</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/teams">
          <Card className="hover:border-primary cursor-pointer transition-all hover:shadow-md">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">Team Management</h3>
                <p className="text-sm text-muted-foreground">Edit team details</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/fixtures">
          <Card className="hover:border-primary cursor-pointer transition-all hover:shadow-md">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">View Fixtures</h3>
                <p className="text-sm text-muted-foreground">See all scheduled games</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/standings">
          <Card className="hover:border-primary cursor-pointer transition-all hover:shadow-md">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">Standings</h3>
                <p className="text-sm text-muted-foreground">View current leaderboard</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>System Actions</CardTitle>
            <CardDescription>Administrative functions for the tournament</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold">Generate Fixtures</h4>
                <p className="text-sm text-muted-foreground">Creates the 10 match schedule</p>
              </div>
              <Button 
                onClick={() => generateFixturesMutation.mutate()}
                disabled={generateFixturesMutation.isPending || (stats?.totalMatches || 0) > 0}
              >
                {generateFixturesMutation.isPending ? "Generating..." : "Generate"}
              </Button>
            </div>
            
            <div className="p-4 border-destructive/30 bg-destructive/5 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Danger Zone
                </h4>
                <p className="text-sm text-muted-foreground">Reset everything (teams kept)</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Reset Tournament</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all matches, goals, cards, and events. Only team names and colors will remain.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => resetTournamentMutation.mutate()}
                    >
                      Yes, reset everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </div>
              Live Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liveMatches && liveMatches.length > 0 ? (
              <div className="space-y-4">
                {liveMatches.map(match => (
                  <Link key={match.id} href={`/admin/match/${match.id}`}>
                    <div className="p-4 border rounded-xl hover:border-primary cursor-pointer transition-colors flex items-center justify-between group">
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground mb-1">Pitch {match.pitch}</div>
                        <div className="flex items-center justify-between pr-4">
                          <span className="font-bold">{match.homeTeamShortName}</span>
                          <span className="font-mono font-bold bg-muted px-3 py-1 rounded">
                            {match.homeScore} - {match.awayScore}
                          </span>
                          <span className="font-bold">{match.awayTeamShortName}</span>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                        Manage
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                <Activity className="h-8 w-8 mb-2 opacity-20" />
                <p>No live matches</p>
                <Link href="/admin/matches">
                  <Button variant="link" className="mt-2">Start a match</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
