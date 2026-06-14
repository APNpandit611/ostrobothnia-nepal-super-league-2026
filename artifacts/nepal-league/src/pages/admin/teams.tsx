import {
  useListTeams,
  useUpdateTeam,
  getListTeamsQueryKey,
  useListPlayers,
  useAddPlayer,
  useDeletePlayer,
  useUpdatePlayer,
  getListPlayersQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Save, Users, UserPlus, Trash2, Pencil, X, Check, ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";

const POSITIONS = ["GK", "C", "V.C", "Manager"];

/* ─── Player Section ────────────────────────────────────────────────────── */

interface PlayerEdit { name: string; number: string; position: string }

function PlayerSection({ teamId, teamColor }: { teamId: number; teamColor: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: players, isLoading } = useListPlayers(teamId);
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<PlayerEdit>({ name: "", number: "", position: "" });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(teamId) });

  const addMutation = useAddPlayer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Player added" });
        setNewName(""); setNewNumber(""); setNewPosition("");
        invalidate();
      },
      onError: () => toast({ variant: "destructive", title: "Failed to add player" }),
    },
  });

  const updateMutation = useUpdatePlayer({
    mutation: {
      onSuccess: () => { toast({ title: "Player updated" }); setEditingId(null); invalidate(); },
      onError: () => toast({ variant: "destructive", title: "Failed to update player" }),
    },
  });

  const deleteMutation = useDeletePlayer({
    mutation: {
      onSuccess: () => { toast({ title: "Player removed" }); invalidate(); },
    },
  });

  const handleAdd = () => {
    if (!newName.trim()) return;
    addMutation.mutate({
      teamId,
      data: { name: newName.trim(), number: newNumber ? parseInt(newNumber) : null, position: newPosition || null, email: null, phone: null },
    });
  };

  const startEdit = (p: { id: number; name: string; number?: number | null; position?: string | null }) => {
    setEditingId(p.id);
    setEditValues({ name: p.name, number: p.number != null ? String(p.number) : "", position: p.position ?? "" });
  };

  const saveEdit = (playerId: number) => {
    if (!editValues.name.trim()) return;
    updateMutation.mutate({
      teamId, playerId,
      data: { name: editValues.name.trim(), number: editValues.number ? parseInt(editValues.number) : null, position: editValues.position || null, email: null, phone: null },
    });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Roster */}
      {players && players.length > 0 ? (
        <div className="rounded-xl border overflow-hidden divide-y">
          {players.map((p) => (
            <div key={p.id} className="px-4 py-3 bg-card hover:bg-muted/30 transition-colors">
              {editingId === p.id ? (
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    value={editValues.name}
                    onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                    className="h-8 text-sm flex-1 min-w-28"
                    placeholder="Name"
                    autoFocus
                  />
                  <Input
                    type="number" min={1} max={99}
                    value={editValues.number}
                    onChange={(e) => setEditValues((v) => ({ ...v, number: e.target.value }))}
                    className="h-8 text-sm w-14"
                    placeholder="#"
                  />
                  <Select value={editValues.position} onValueChange={(val) => setEditValues((v) => ({ ...v, position: val }))}>
                    <SelectTrigger className="h-8 text-sm w-28"><SelectValue placeholder="Role" /></SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((pos) => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8" onClick={() => saveEdit(p.id)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1" />Save</>}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex-shrink-0 text-xs font-black w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: teamColor }}
                    >
                      {p.number ?? "—"}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-sm">{p.name}</span>
                      {p.position && (
                        <span className="ml-2 text-xs bg-muted border rounded px-1.5 py-0.5 font-mono text-muted-foreground">{p.position}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => startEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate({ teamId, playerId: p.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-10 text-center text-muted-foreground text-sm">
          No players yet — add one below
        </div>
      )}

      {/* Add player */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl bg-muted/40 border">
        <Input
          placeholder="Player name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-9 text-sm flex-1 min-w-36 bg-background"
        />
        <Input
          placeholder="#"
          type="number" min={1} max={99}
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
          className="h-9 text-sm w-16 bg-background"
        />
        <Select value={newPosition} onValueChange={setNewPosition}>
          <SelectTrigger className="h-9 text-sm w-28 bg-background"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            {POSITIONS.map((pos) => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="h-9 gap-1.5" onClick={handleAdd} disabled={!newName.trim() || addMutation.isPending}>
          {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" />Add Player</>}
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

export default function AdminTeams() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: teams, isLoading } = useListTeams();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, { name: string; shortName: string; primaryColor: string; logoUrl: string }>>({});

  useEffect(() => {
    if (teams) {
      const initial: Record<number, { name: string; shortName: string; primaryColor: string; logoUrl: string }> = {};
      teams.forEach((t) => {
        initial[t.id] = { name: t.name, shortName: t.shortName, primaryColor: t.primaryColor || "#16a34a", logoUrl: t.logoUrl ?? "" };
      });
      setEdits(initial);
      if (!selectedId && teams.length > 0) setSelectedId(teams[0].id);
    }
  }, [teams]);

  const updateMutation = useUpdateTeam({
    mutation: {
      onSuccess: () => {
        toast({ title: "Team saved" });
        queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to save" }),
    },
  });

  const handleSave = (id: number) => {
    const e = edits[id];
    if (!e) return;
    updateMutation.mutate({ id, data: { name: e.name, shortName: e.shortName, primaryColor: e.primaryColor, logoUrl: e.logoUrl || null } });
  };

  const set = (id: number, field: string, value: string) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const selectedTeam = teams?.find((t) => t.id === selectedId);
  const edit = selectedId ? edits[selectedId] : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Team Management
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Select a team to edit details and manage the squad</p>
      </div>

      {/* Team selector */}
      <div className="flex gap-2 flex-wrap">
        {teams?.map((team) => {
          const isSelected = team.id === selectedId;
          return (
            <button
              key={team.id}
              onClick={() => setSelectedId(team.id)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all font-semibold text-sm"
              style={{
                borderColor: isSelected ? (edits[team.id]?.primaryColor || team.primaryColor) : "transparent",
                backgroundColor: isSelected ? `${edits[team.id]?.primaryColor || team.primaryColor}18` : "hsl(var(--muted)/0.5)",
                color: isSelected ? (edits[team.id]?.primaryColor || team.primaryColor) : undefined,
              }}
            >
              {(edits[team.id]?.logoUrl || team.logoUrl) ? (
                <img
                  src={edits[team.id]?.logoUrl || team.logoUrl!}
                  alt={team.shortName}
                  className="h-6 w-6 rounded-full object-contain"
                />
              ) : (
                <span
                  className="h-6 w-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: edits[team.id]?.primaryColor || team.primaryColor }}
                />
              )}
              <span>{edits[team.id]?.shortName || team.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Edit panel */}
      {selectedTeam && edit && (
        <Card className="overflow-hidden border-t-4" style={{ borderTopColor: edit.primaryColor }}>
          <CardContent className="p-0">
            <Tabs defaultValue="info">
              <div className="px-6 pt-5 pb-0 border-b">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {edit.logoUrl ? (
                      <img src={edit.logoUrl} alt={edit.shortName} className="h-10 w-10 rounded-full object-contain border" />
                    ) : (
                      <span className="h-10 w-10 rounded-full flex-shrink-0 border" style={{ backgroundColor: edit.primaryColor }} />
                    )}
                    <div>
                      <p className="font-black text-base leading-tight">{edit.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{edit.shortName}</p>
                    </div>
                  </div>
                </div>
                <TabsList className="mb-0 bg-transparent p-0 gap-4 h-auto border-none rounded-none">
                  <TabsTrigger
                    value="info"
                    className="pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-semibold"
                  >
                    Team Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="squad"
                    className="pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-semibold"
                  >
                    Squad
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Team Info tab */}
              <TabsContent value="info" className="p-6 space-y-5 mt-0">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Full Name</Label>
                    <Input value={edit.name} onChange={(e) => set(selectedTeam.id, "name", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Short Name</Label>
                    <Input value={edit.shortName} maxLength={10} onChange={(e) => set(selectedTeam.id, "shortName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Team Colour</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={edit.primaryColor}
                        onChange={(e) => set(selectedTeam.id, "primaryColor", e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                      />
                      <span className="text-sm font-mono text-muted-foreground">{edit.primaryColor}</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Logo URL</Label>
                    <div className="flex gap-3 items-center">
                      {edit.logoUrl && (
                        <img src={edit.logoUrl} alt="preview" className="h-12 w-12 rounded-full object-contain border flex-shrink-0" />
                      )}
                      <Input
                        value={edit.logoUrl}
                        onChange={(e) => set(selectedTeam.id, "logoUrl", e.target.value)}
                        placeholder="/ksb-logo.png or https://…"
                        className="flex-1"
                      />
                      {edit.logoUrl && (
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => set(selectedTeam.id, "logoUrl", "")}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleSave(selectedTeam.id)}
                  disabled={updateMutation.isPending && (updateMutation.variables as { id: number })?.id === selectedTeam.id}
                  className="gap-1.5"
                >
                  {updateMutation.isPending && (updateMutation.variables as { id: number })?.id === selectedTeam.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </TabsContent>

              {/* Squad tab */}
              <TabsContent value="squad" className="p-6 mt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Roster
                    </span>
                  </div>
                </div>
                <PlayerSection teamId={selectedTeam.id} teamColor={edit.primaryColor} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
