import { Link, useLocation } from "wouter";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertTriangle,
  Home,
  Lock,
  Heart,
  BookOpen,
  Megaphone,
  Swords,
  Building2,
  ClipboardEdit,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState(false);

  const { data: stats } = useGetTournamentStats();
  const { data: liveMatches } = useListMatches({ status: 'live' });

  const logoutMutation = useAdminLogout({
    mutation: { onSuccess: () => setLocation("/admin") }
  });

  const generateFixturesMutation = useGenerateFixtures({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Fixtures generated successfully" });
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to generate fixtures" }),
    }
  });

  const resetTournamentMutation = useResetTournament({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Tournament reset completely" });
        queryClient.invalidateQueries();
        setResetDialogOpen(false);
        setResetPassword("");
        setResetPasswordError(false);
      },
      onError: () => {
        setResetPasswordError(true);
        toast({ variant: "destructive", title: "Incorrect password", description: "The password you entered is wrong." });
      }
    }
  });

  const handleResetConfirm = () => {
    if (!resetPassword.trim()) { setResetPasswordError(true); return; }
    setResetPasswordError(false);
    resetTournamentMutation.mutate({ data: { password: resetPassword } });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage the tournament and club</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Link href="/">
            <Button variant="outline" className="w-full md:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Public Site
            </Button>
          </Link>
          <Button variant="outline" onClick={() => logoutMutation.mutate()} className="w-full md:w-auto">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* ── GAME MANAGEMENT ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Swords className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">Game Management</h2>
            <p className="text-xs text-muted-foreground">Control matches, fixtures, and live scores</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/matches">
            <Card className="hover:border-primary cursor-pointer transition-all hover:shadow-md">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Live Match Control</h3>
                  <p className="text-sm text-muted-foreground">Start, manage & finish games</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/fixtures">
            <Card className="hover:border-primary cursor-pointer transition-all hover:shadow-md">
              <CardContent className="p-5 flex items-center gap-4">
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
          <Link href="/admin/tournament">
            <Card className="hover:border-primary cursor-pointer transition-all hover:shadow-md">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <ClipboardEdit className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Tournament Info</h3>
                  <p className="text-sm text-muted-foreground">Edit upcoming event details</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Tournament actions + live matches */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Actions</CardTitle>
              <CardDescription>System-level controls for the tournament</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold">Generate Fixtures</h4>
                  <p className="text-sm text-muted-foreground">Creates the 10-match schedule</p>
                </div>
                <Button
                  onClick={() => generateFixturesMutation.mutate()}
                  disabled={generateFixturesMutation.isPending || (stats?.totalMatches || 0) > 0}
                >
                  {generateFixturesMutation.isPending ? "Generating..." : "Generate"}
                </Button>
              </div>

              <div className="p-4 border border-destructive/30 bg-destructive/5 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Danger Zone
                  </h4>
                  <p className="text-sm text-muted-foreground">Reset everything (teams kept)</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => { setResetPassword(""); setResetPasswordError(false); setResetDialogOpen(true); }}
                >
                  Reset
                </Button>
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
                <div className="space-y-3">
                  {liveMatches.map(match => (
                    <Link key={match.id} href={`/admin/match/${match.id}`}>
                      <div className="p-4 border rounded-xl hover:border-primary cursor-pointer transition-colors flex items-center justify-between group">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">Pitch {match.pitch}</div>
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
                <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
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
      </section>

      {/* ── CLUB MANAGEMENT ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">Club Management</h2>
            <p className="text-xs text-muted-foreground">Teams, members, content, and communications</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/teams">
            <Card className="hover:border-primary cursor-pointer transition-all hover:shadow-md">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Teams</h3>
                  <p className="text-sm text-muted-foreground">Edit team details</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/club-applications">
            <Card className="hover:border-primary cursor-pointer transition-all hover:shadow-md">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Applications</h3>
                  <p className="text-sm text-muted-foreground">Review membership requests</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/announcements">
            <Card className="hover:border-primary cursor-pointer transition-all hover:shadow-md">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Announcements</h3>
                  <p className="text-sm text-muted-foreground">Post news & updates</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/club-settings">
            <Card className="hover:border-primary cursor-pointer transition-all hover:shadow-md">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">About Us</h3>
                  <p className="text-sm text-muted-foreground">Edit club story, contact & values</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={(open) => { if (!resetTournamentMutation.isPending) setResetDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Reset Tournament
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all matches, goals, cards, and events. Team records will remain. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="reset-password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Enter admin password to confirm
            </Label>
            <Input
              id="reset-password"
              type="password"
              placeholder="Admin password"
              value={resetPassword}
              onChange={(e) => { setResetPassword(e.target.value); setResetPasswordError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleResetConfirm(); }}
              className={resetPasswordError ? "border-destructive focus-visible:ring-destructive" : ""}
              autoFocus
            />
            {resetPasswordError && (
              <p className="text-sm text-destructive">Incorrect password. Please try again.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={resetTournamentMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetConfirm}
              disabled={resetTournamentMutation.isPending || !resetPassword.trim()}
            >
              {resetTournamentMutation.isPending ? "Resetting..." : "Yes, reset everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
