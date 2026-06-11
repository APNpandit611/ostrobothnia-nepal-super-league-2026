import {
  useListTeams,
  useUpdateTeam,
  getListTeamsQueryKey,
  useListPlayers,
  useAddPlayer,
  useDeletePlayer,
  getListPlayersQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Users, UserPlus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";

const POSITIONS = ["GK", "C", "V.C", "Manager"];

function PlayerSection({ teamId, teamColor }: { teamId: number; teamColor: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: players, isLoading } = useListPlayers(teamId);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState("");

  const addMutation = useAddPlayer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Player added" });
        setName(""); setNumber(""); setPosition("");
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(teamId) });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to add player" }),
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
        <div className="grid gap-1.5">
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-3">
                {p.number != null && (
                  <span
                    className="text-xs font-black w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: teamColor }}
                  >
                    {p.number}
                  </span>
                )}
                <span className="font-medium text-sm">{p.name}</span>
                {p.position && (
                  <span className="text-xs bg-background border rounded px-1.5 py-0.5 text-muted-foreground font-mono">
                    {p.position}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => deleteMutation.mutate({ teamId, playerId: p.id })}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic text-center py-2">No players yet</p>
      )}

      {/* Add player form */}
      <div className="flex flex-wrap gap-2 items-end pt-1">
        <div className="space-y-1 flex-1 min-w-32">
          <Label className="text-xs">Name</Label>
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
            type="number"
            min={1}
            max={99}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1 w-28">
          <Label className="text-xs">Position</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Pos." />
            </SelectTrigger>
            <SelectContent>
              {POSITIONS.map((pos) => (
                <SelectItem key={pos} value={pos}>{pos}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          className="h-8"
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
  );
}

export default function AdminTeams() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: teams, isLoading } = useListTeams();
  const [edits, setEdits] = useState<Record<number, { name: string; shortName: string; primaryColor: string }>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (teams) {
      const initialEdits: Record<number, any> = {};
      teams.forEach((team) => {
        initialEdits[team.id] = {
          name: team.name,
          shortName: team.shortName,
          primaryColor: team.primaryColor || "#16a34a",
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
    if (edit) updateMutation.mutate({ id, data: edit });
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
              {/* Team edit row */}
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

              {/* Player section (collapsible) */}
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
