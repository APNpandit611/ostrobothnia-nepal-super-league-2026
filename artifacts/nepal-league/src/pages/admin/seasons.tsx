import { useState } from "react";
import {
  useListSeasonArchives,
  useGetSeasonArchive,
  useArchiveCurrentSeason,
  useDeleteSeasonArchive,
  getListSeasonArchivesQueryKey,
  useListMatches,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Trophy, Archive, Trash2, ChevronLeft, Plus, X,
  Calendar, Medal, Goal, Users, Table, Star,
} from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";

export default function AdminSeasons() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: archives, isLoading } = useListSeasonArchives();
  const { data: matches } = useListMatches();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveName, setArchiveName] = useState("");
  const [archiveYear, setArchiveYear] = useState("2026");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: selectedArchive } = useGetSeasonArchive(selectedId ?? 0, {
    query: { enabled: selectedId !== null } as never,
  });

  const archiveMutation = useArchiveCurrentSeason({
    mutation: {
      onSuccess: () => {
        toast({ title: "Season archived successfully" });
        queryClient.invalidateQueries({ queryKey: getListSeasonArchivesQueryKey() });
        setArchiveDialogOpen(false);
        setArchiveName("");
        setArchiveYear("2026");
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to archive" });
      },
    },
  });

  const deleteMutation = useDeleteSeasonArchive({
    mutation: {
      onSuccess: () => {
        toast({ title: "Archive deleted" });
        queryClient.invalidateQueries({ queryKey: getListSeasonArchivesQueryKey() });
        setDeleteId(null);
      },
      onError: () => toast({ variant: "destructive", title: "Failed to delete" }),
    },
  });

  const hasFinal = matches?.some(m => m.matchType === "final");
  const finalFinished = matches?.some(m => m.matchType === "final" && m.status === "finished");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListSeasonArchivesQueryKey() });
  };

  const handleArchive = () => {
    if (!archiveName.trim()) return;
    archiveMutation.mutate({ data: { name: archiveName.trim(), seasonYear: archiveYear.trim() } });
  };

  if (selectedId && selectedArchive) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <ArchiveDetailView archive={selectedArchive} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Archive className="h-6 w-6 text-primary" /> Season Archives
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Save and view past tournament results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setArchiveDialogOpen(true)}
            disabled={!finalFinished}
            className="gap-1.5"
            title={!hasFinal ? "Create a final match first" : !finalFinished ? "Final must be finished" : "Archive current season"}
          >
            <Plus className="h-4 w-4" /> Archive Current
          </Button>
        </div>
      </div>

      {/* Status hint */}
      {!finalFinished && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-500 flex items-center gap-2">
          <Star className="h-4 w-4" />
          {hasFinal
            ? "The final match must be finished before you can archive the season."
            : "Create a final match from the Dashboard first, then finish it to archive."}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !archives?.length ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <Archive className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No archives yet</p>
          <p className="text-sm mt-1">Finish the final and click "Archive Current" to save the season</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {archives.map((archive) => (
            <Card
              key={archive.id}
              className="cursor-pointer hover:border-primary/60 transition-colors group relative overflow-hidden"
              onClick={() => archive.id != null && setSelectedId(archive.id)}
            >
              <div className="h-1 w-full bg-amber-500" />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base">{archive.name}</h3>
                    <p className="text-xs text-muted-foreground">{archive.seasonYear}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); archive.id != null && setDeleteId(archive.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                  <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Champion</p>
                    <p className="font-bold text-amber-500 truncate">{archive.winnerTeamName || "Unknown"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Goal className="h-3.5 w-3.5" />
                    <span className="truncate">Final: {archive.finalScore}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Medal className="h-3.5 w-3.5" />
                    <span className="truncate">Top: {archive.topScorerName || "N/A"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Archived {archive.createdAt ? new Date(archive.createdAt).toLocaleDateString() : "Unknown"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Archive dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary" /> Archive Current Season
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Archive Name</Label>
              <Input
                placeholder="e.g. Nepal Summer League 2026"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Season Year</Label>
              <Input value={archiveYear} onChange={(e) => setArchiveYear(e.target.value)} />
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-500 flex items-start gap-2">
              <Star className="h-4 w-4 shrink-0 mt-0.5" />
              <p>This will snapshot the current standings, final result, top scorer, and all match data into the archive.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleArchive}
              disabled={!archiveName.trim() || archiveMutation.isPending}
              className="gap-1"
            >
              {archiveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Archive className="h-4 w-4" /> Save Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Delete Archive?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove this season archive. The data cannot be recovered.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ArchiveDetailView({ archive }: { archive: any }) {
  const standings: any[] = Array.isArray(archive.standings) ? archive.standings : [];
  const matches: any[] = Array.isArray(archive.matches) ? archive.matches : [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <Archive className="h-6 w-6 text-primary" /> {archive.name}
        </h1>
        <p className="text-sm text-muted-foreground">{archive.seasonYear} · Archived {archive.createdAt ? new Date(archive.createdAt).toLocaleDateString() : "Unknown"}</p>
      </div>

      {/* Champion card */}
      <Card className="overflow-hidden border-2 border-amber-500/50 shadow-lg shadow-amber-500/10">
        <div className="bg-amber-500 text-white p-3 text-center font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5" /> Champion
        </div>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <TeamLogo
              name={archive.winnerTeamName || ""}
              shortName={archive.winnerTeamShortName || ""}
              logoUrl={archive.winnerTeamLogo || ""}
              size="lg"
            />
            <h2 className="text-2xl font-black text-amber-500">{archive.winnerTeamName || "Unknown"}</h2>
          </div>
          <p className="text-sm text-muted-foreground">Final: {archive.finalHomeTeam} {archive.finalScore} {archive.finalAwayTeam}</p>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Medal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Top Scorer</p>
              <p className="font-bold">{archive.topScorerName || "N/A"}</p>
              <p className="text-xs text-muted-foreground">{archive.topScorerGoals ? `${archive.topScorerGoals} goals` : ""} {archive.topScorerTeam ? `· ${archive.topScorerTeam}` : ""}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Teams</p>
              <p className="font-bold">{standings.length}</p>
              <p className="text-xs text-muted-foreground">{matches.length} matches played</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Goal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Goals</p>
              <p className="font-bold">{matches.reduce((acc: number, m: any) => acc + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0)}</p>
              <p className="text-xs text-muted-foreground">Avg {matches.length > 0 ? ((matches.reduce((acc: number, m: any) => acc + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0)) / matches.length).toFixed(1) : "0"} per match</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Champion</p>
              <p className="font-bold">{archive.winnerTeamName || "N/A"}</p>
              <p className="text-xs text-muted-foreground">Final: {archive.finalScore}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standings table */}
      {standings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Table className="h-4 w-4" /> Final Standings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium text-xs uppercase tracking-wider">#</th>
                    <th className="px-4 py-2 text-left font-medium text-xs uppercase tracking-wider">Team</th>
                    <th className="px-4 py-2 text-center font-medium text-xs uppercase tracking-wider">P</th>
                    <th className="px-4 py-2 text-center font-medium text-xs uppercase tracking-wider">W</th>
                    <th className="px-4 py-2 text-center font-medium text-xs uppercase tracking-wider">D</th>
                    <th className="px-4 py-2 text-center font-medium text-xs uppercase tracking-wider">L</th>
                    <th className="px-4 py-2 text-center font-medium text-xs uppercase tracking-wider">GF</th>
                    <th className="px-4 py-2 text-center font-medium text-xs uppercase tracking-wider">GA</th>
                    <th className="px-4 py-2 text-center font-medium text-xs uppercase tracking-wider">GD</th>
                    <th className="px-4 py-2 text-center font-medium text-xs uppercase tracking-wider">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr key={i} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-2 font-bold">{i + 1}</td>
                      <td className="px-4 py-2 font-medium">{s.teamName}</td>
                      <td className="px-4 py-2 text-center">{s.played}</td>
                      <td className="px-4 py-2 text-center">{s.won}</td>
                      <td className="px-4 py-2 text-center">{s.drawn}</td>
                      <td className="px-4 py-2 text-center">{s.lost}</td>
                      <td className="px-4 py-2 text-center">{s.goalsFor}</td>
                      <td className="px-4 py-2 text-center">{s.goalsAgainst}</td>
                      <td className="px-4 py-2 text-center">{s.goalDifference}</td>
                      <td className="px-4 py-2 text-center font-bold">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matches */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Goal className="h-4 w-4" /> All Matches
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {matches.map((m, i) => {
                const homeGoals = (m.goals ?? []).filter((g: any) => g.team === m.homeTeam && !g.isOwnGoal);
                const awayGoals = (m.goals ?? []).filter((g: any) => g.team === m.awayTeam && !g.isOwnGoal);
                const homeOwnGoals = (m.goals ?? []).filter((g: any) => g.team === m.awayTeam && g.isOwnGoal);
                const awayOwnGoals = (m.goals ?? []).filter((g: any) => g.team === m.homeTeam && g.isOwnGoal);
                return (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground">#{m.matchNumber}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {m.homeTeam} <span className="font-mono font-bold">{m.homeScore} - {m.awayScore}</span> {m.awayTeam}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.goals?.length ?? 0} goals · {m.matchType === "final" ? "Final" : "League"}
                          </p>
                        </div>
                      </div>
                      {m.matchType === "final" && (
                        <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px] shrink-0">FINAL</Badge>
                      )}
                    </div>
                    {/* Scorers */}
                    {(homeGoals.length > 0 || awayGoals.length > 0 || homeOwnGoals.length > 0 || awayOwnGoals.length > 0) && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                        <div className="text-right space-y-0.5">
                          {homeGoals.map((g: any, gi: number) => (
                            <div key={gi} className="flex items-center justify-end gap-1.5">
                              <span className="truncate">{g.scorer}</span>
                              <span className="text-primary"><Goal className="h-2.5 w-2.5" /></span>
                              {g.minute != null && <span className="text-[10px] opacity-60">{g.minute}'</span>}
                            </div>
                          ))}
                          {homeOwnGoals.map((g: any, gi: number) => (
                            <div key={`og-${gi}`} className="flex items-center justify-end gap-1.5 opacity-60">
                              <span className="truncate">(OG) {g.scorer}</span>
                              <span className="text-muted-foreground"><Goal className="h-2.5 w-2.5" /></span>
                              {g.minute != null && <span className="text-[10px] opacity-60">{g.minute}'</span>}
                            </div>
                          ))}
                        </div>
                        <div className="text-left space-y-0.5">
                          {awayGoals.map((g: any, gi: number) => (
                            <div key={gi} className="flex items-center gap-1.5">
                              <span className="text-primary"><Goal className="h-2.5 w-2.5" /></span>
                              <span className="truncate">{g.scorer}</span>
                              {g.minute != null && <span className="text-[10px] opacity-60">{g.minute}'</span>}
                            </div>
                          ))}
                          {awayOwnGoals.map((g: any, gi: number) => (
                            <div key={`og-${gi}`} className="flex items-center gap-1.5 opacity-60">
                              <span className="text-muted-foreground"><Goal className="h-2.5 w-2.5" /></span>
                              <span className="truncate">(OG) {g.scorer}</span>
                              {g.minute != null && <span className="text-[10px] opacity-60">{g.minute}'</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
