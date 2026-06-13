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
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Users, UserPlus, Trash2, ChevronDown, ChevronUp, Pencil, X, Check } from "lucide-react";
import { useState, useEffect } from "react";

const POSITIONS = ["GK", "C", "V.C", "Manager"];

interface PlayerEdit {
  name: string;
  number: string;
  position: string;
  email: string;
  phone: string;
}

function PlayerSection({ teamId, teamColor }: { teamId: number; teamColor: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: players, isLoading } = useListPlayers(teamId);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<PlayerEdit>({ name: "", number: "", position: "", email: "", phone: "" });

  const addMutation = useAddPlayer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Player added" });
        setName(""); setNumber(""); setPosition(""); setEmail(""); setPhone("");
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(teamId) });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to add player" }),
    },
  });

  const updateMutation = useUpdatePlayer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Player updated" });
        setEditingId(null);
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(teamId) });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update player" }),
    },
  });

  const deleteMutation = useDeletePlayer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Player removed" });
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(teamId) });
      },
    },
  });

  const handleAdd = () => {
    if (!name.trim()) return;
    addMutation.mutate({
      teamId,
      data: {
        name: name.trim(),
        number: number ? parseInt(number) : null,
        position: position || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
      },
    });
  };

  const startEdit = (p: { id: number; name: string; number?: number | null; position?: string | null; email?: string | null; phone?: string | null }) => {
    setEditingId(p.id);
    setEditValues({
      name: p.name,
      number: p.number != null ? String(p.number) : "",
      position: p.position ?? "",
      email: p.email ?? "",
      phone: p.phone ?? "",
    });
  };

  const saveEdit = (playerId: number) => {
    if (!editValues.name.trim()) return;
    updateMutation.mutate({
      teamId,
      playerId,
      data: {
        name: editValues.name.trim(),
        number: editValues.number ? parseInt(editValues.number) : null,
        position: editValues.position || null,
        email: editValues.email.trim() || null,
        phone: editValues.phone.trim() || null,
      },
    });
  };

  return (
    <div className="mt-5 border-t pt-4 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Squad ({players?.length ?? 0})
        </span>
      </div>

      {/* Player list */}
      {isLoading ? (
        <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : players && players.length > 0 ? (
        <div className="grid gap-2">
          {players.map((p) => (
            <div key={p.id} className="bg-muted/50 rounded-lg px-3 py-2">
              {editingId === p.id ? (
                /* Edit mode */
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex-1 min-w-32 space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={editValues.name}
                        onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                        className="h-7 text-sm"
                      />
                    </div>
                    <div className="w-16 space-y-1">
                      <Label className="text-xs">#</Label>
                      <Input
                        type="number" min={1} max={99}
                        value={editValues.number}
                        onChange={(e) => setEditValues((v) => ({ ...v, number: e.target.value }))}
                        className="h-7 text-sm"
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Role</Label>
                      <Select value={editValues.position} onValueChange={(val) => setEditValues((v) => ({ ...v, position: val }))}>
                        <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Role" /></SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map((pos) => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex-1 min-w-32 space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={editValues.email}
                        onChange={(e) => setEditValues((v) => ({ ...v, email: e.target.value }))}
                        className="h-7 text-sm"
                        placeholder="optional"
                      />
                    </div>
                    <div className="flex-1 min-w-32 space-y-1">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        type="tel"
                        value={editValues.phone}
                        onChange={(e) => setEditValues((v) => ({ ...v, phone: e.target.value }))}
                        className="h-7 text-sm"
                        placeholder="optional"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="h-7" onClick={() => saveEdit(p.id)} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1" /> Save</>}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    {p.number != null && (
                      <span
                        className="text-xs font-black w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: teamColor }}
                      >
                        {p.number}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{p.name}</span>
                        {p.position && (
                          <span className="text-xs bg-background border rounded px-1.5 py-0.5 text-muted-foreground font-mono">
                            {p.position}
                          </span>
                        )}
                      </div>
                      {(p.email || p.phone) && (
                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                          {p.email && <span>✉ {p.email}</span>}
                          {p.phone && <span>📞 {p.phone}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => startEdit(p)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
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
        <p className="text-xs text-muted-foreground italic text-center py-2">No players yet</p>
      )}

      {/* Add player form */}
      <div className="pt-2 space-y-2 border-t mt-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add Player</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1 flex-1 min-w-32">
            <Label className="text-xs">Name *</Label>
            <Input
              placeholder="Player name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="space-y-1 w-16">
            <Label className="text-xs">#</Label>
            <Input
              placeholder="No."
              type="number" min={1} max={99}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1 w-28">
            <Label className="text-xs">Role</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                {POSITIONS.map((pos) => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="space-y-1 flex-1 min-w-32">
            <Label className="text-xs">Email (optional)</Label>
            <Input
              type="email" placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1 flex-1 min-w-32">
            <Label className="text-xs">Phone (optional)</Label>
            <Input
              type="tel" placeholder="+358 …"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <Button
            size="sm" className="h-8 self-end"
            onClick={handleAdd}
            disabled={!name.trim() || addMutation.isPending}
          >
            {addMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <><UserPlus className="h-3.5 w-3.5 mr-1" /> Add</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTeams() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: teams, isLoading } = useListTeams();
  const [edits, setEdits] = useState<Record<number, { name: string; shortName: string; primaryColor: string; logoUrl: string }>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (teams) {
      const initialEdits: Record<number, { name: string; shortName: string; primaryColor: string; logoUrl: string }> = {};
      teams.forEach((team) => {
        initialEdits[team.id] = {
          name: team.name,
          shortName: team.shortName,
          primaryColor: team.primaryColor || "#16a34a",
          logoUrl: team.logoUrl ?? "",
        };
      });
      setEdits(initialEdits);
    }
  }, [teams]);

  const updateMutation = useUpdateTeam({
    mutation: {
      onSuccess: () => {
        toast({ title: "Team updated successfully" });
        queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
      },
    },
  });

  const handleSave = (id: number) => {
    const edit = edits[id];
    if (edit) updateMutation.mutate({
      id,
      data: {
        name: edit.name,
        shortName: edit.shortName,
        primaryColor: edit.primaryColor,
        logoUrl: edit.logoUrl || null,
      },
    });
  };

  const handleEditChange = (id: number, field: string, value: string) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Team Management
        </h1>
        <p className="text-muted-foreground mt-1">Edit team info and manage squad rosters</p>
      </div>

      <div className="grid gap-6">
        {teams?.map((team) => (
          <Card
            key={team.id}
            className="overflow-hidden border-l-4"
            style={{ borderLeftColor: edits[team.id]?.primaryColor || team.primaryColor }}
          >
            <CardContent className="p-6">
              <div className="grid md:grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor={`name-${team.id}`}>Full Name</Label>
                  <Input
                    id={`name-${team.id}`}
                    value={edits[team.id]?.name || ""}
                    onChange={(e) => handleEditChange(team.id, "name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`short-${team.id}`}>Short Name</Label>
                  <Input
                    id={`short-${team.id}`}
                    value={edits[team.id]?.shortName || ""}
                    onChange={(e) => handleEditChange(team.id, "shortName", e.target.value)}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`color-${team.id}`}>Color</Label>
                  <Input
                    id={`color-${team.id}`}
                    type="color"
                    value={edits[team.id]?.primaryColor || "#000000"}
                    onChange={(e) => handleEditChange(team.id, "primaryColor", e.target.value)}
                    className="w-16 p-1 h-10"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`logo-${team.id}`}>Logo URL</Label>
                  <div className="flex gap-2 items-center">
                    {edits[team.id]?.logoUrl && (
                      <img
                        src={edits[team.id].logoUrl}
                        alt="logo preview"
                        className="h-9 w-9 rounded-full object-contain border flex-shrink-0"
                      />
                    )}
                    <Input
                      id={`logo-${team.id}`}
                      placeholder="/onsl-official-logo.png or https://…"
                      value={edits[team.id]?.logoUrl || ""}
                      onChange={(e) => handleEditChange(team.id, "logoUrl", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <Button
                  onClick={() => handleSave(team.id)}
                  disabled={updateMutation.isPending && updateMutation.variables?.id === team.id}
                  className="w-full md:w-auto"
                >
                  {updateMutation.isPending && updateMutation.variables?.id === team.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleExpanded(team.id)}
                  className="w-full md:w-auto"
                >
                  {expanded[team.id] ? (
                    <><ChevronUp className="h-4 w-4 mr-1" /> Hide Squad</>
                  ) : (
                    <><ChevronDown className="h-4 w-4 mr-1" /> Manage Squad</>
                  )}
                </Button>
              </div>

              {expanded[team.id] && (
                <PlayerSection
                  teamId={team.id}
                  teamColor={edits[team.id]?.primaryColor || team.primaryColor}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
