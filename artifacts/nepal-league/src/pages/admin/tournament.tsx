import {
  useListTournaments,
  useCreateTournamentInfo,
  useUpdateTournamentInfo,
  useDeleteTournamentInfo,
  getListTournamentsQueryKey,
} from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Trophy,
  CheckSquare,
  PlusCircle,
} from "lucide-react";

interface TournamentForm {
  name: string;
  shortName: string;
  date: string;
  venue: string;
  city: string;
  format: string;
  maxTeams: string;
  kickoffTime: string;
  description: string;
  rules: string[];
  prizes: string[];
  status: "upcoming" | "active" | "completed";
  isActive: boolean;
}

const EMPTY_FORM: TournamentForm = {
  name: "",
  shortName: "",
  date: "",
  venue: "",
  city: "",
  format: "7-a-side",
  maxTeams: "5",
  kickoffTime: "10:00",
  description: "",
  rules: [],
  prizes: [],
  status: "upcoming",
  isActive: false,
};

function formToPayload(f: TournamentForm) {
  return {
    name: f.name.trim(),
    shortName: f.shortName.trim() || null,
    date: f.date,
    venue: f.venue.trim(),
    city: f.city.trim() || null,
    format: f.format.trim() || "7-a-side",
    maxTeams: f.maxTeams ? parseInt(f.maxTeams) : 5,
    kickoffTime: f.kickoffTime.trim() || "10:00",
    description: f.description.trim() || null,
    rules: f.rules.filter(Boolean).length > 0 ? f.rules.filter(Boolean) : null,
    prizes: f.prizes.filter(Boolean).length > 0 ? f.prizes.filter(Boolean) : null,
    status: f.status,
    isActive: f.isActive,
  };
}

function tournamentToForm(t: {
  name: string; shortName?: string | null; date: string; venue: string;
  city?: string | null; format: string; maxTeams?: number | null;
  kickoffTime?: string | null; description?: string | null;
  rules?: string[] | null; prizes?: string[] | null;
  status: string; isActive?: boolean | null;
}): TournamentForm {
  return {
    name: t.name,
    shortName: t.shortName ?? "",
    date: t.date,
    venue: t.venue,
    city: t.city ?? "",
    format: t.format,
    maxTeams: String(t.maxTeams ?? 5),
    kickoffTime: t.kickoffTime ?? "10:00",
    description: t.description ?? "",
    rules: t.rules ?? [],
    prizes: t.prizes ?? [],
    status: (t.status as "upcoming" | "active" | "completed") ?? "upcoming",
    isActive: t.isActive ?? false,
  };
}

function ArrayEditor({ label, icon: Icon, items, onChange, placeholder }: {
  label: string;
  icon: React.ElementType;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-semibold">{label}</Label>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-xs text-muted-foreground font-bold w-5 pt-2.5 flex-shrink-0 text-right">{i + 1}.</span>
            <Input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="text-sm h-9 flex-1"
              placeholder={placeholder}
            />
            <Button
              type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button
          type="button" variant="outline" size="sm" className="w-full text-xs gap-1.5"
          onClick={() => onChange([...items, ""])}
        >
          <PlusCircle className="h-3.5 w-3.5" /> Add {label.replace(/s$/, "")}
        </Button>
      </div>
    </div>
  );
}

function TournamentFormPanel({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: TournamentForm;
  onSave: (f: TournamentForm) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<TournamentForm>(initial);
  const set = (key: keyof TournamentForm, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-5 pt-2">
      {/* Basic info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Tournament Name *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ostrobothnia Nepal Super League 2026" />
        </div>
        <div className="space-y-1.5">
          <Label>Short Name</Label>
          <Input value={form.shortName} onChange={(e) => set("shortName", e.target.value)} placeholder="ONSL 2026" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date *</Label>
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Kick-off Time</Label>
          <Input type="time" value={form.kickoffTime} onChange={(e) => set("kickoffTime", e.target.value)} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Venue *</Label>
          <Input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Santahaka Tekonurmikenttä" />
        </div>
        <div className="space-y-1.5">
          <Label>City / Country</Label>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Kokkola, Finland" />
        </div>
        <div className="space-y-1.5">
          <Label>Format</Label>
          <Input value={form.format} onChange={(e) => set("format", e.target.value)} placeholder="7-a-side" />
        </div>
        <div className="space-y-1.5">
          <Label>Max Teams</Label>
          <Input type="number" min={2} value={form.maxTeams} onChange={(e) => set("maxTeams", e.target.value)} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Brief description of the tournament..." />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3 py-1">
          <input
            type="checkbox" id="isActive" checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <Label htmlFor="isActive" className="cursor-pointer text-sm">Mark as the active tournament (shown on the About page)</Label>
        </div>
      </div>

      {/* Rules */}
      <ArrayEditor
        label="Rules"
        icon={CheckSquare}
        items={form.rules}
        onChange={(v) => set("rules", v)}
        placeholder="e.g. 7-a-side format"
      />

      {/* Prizes */}
      <ArrayEditor
        label="Prizes"
        icon={Trophy}
        items={form.prizes}
        onChange={(v) => set("prizes", v)}
        placeholder="e.g. 1st place — Champions Trophy"
      />

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t">
        <Button onClick={() => onSave(form)} disabled={!form.name.trim() || !form.date || !form.venue.trim() || isSaving} className="gap-1.5">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Tournament
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function AdminTournament() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: tournaments, isLoading } = useListTournaments();
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey() });

  const createMutation = useCreateTournamentInfo({
    mutation: {
      onSuccess: () => { toast({ title: "Tournament created" }); setAdding(false); invalidate(); },
      onError: () => toast({ variant: "destructive", title: "Failed to create" }),
    },
  });

  const updateMutation = useUpdateTournamentInfo({
    mutation: {
      onSuccess: () => { toast({ title: "Tournament updated" }); setExpandedId(null); invalidate(); },
      onError: () => toast({ variant: "destructive", title: "Failed to update" }),
    },
  });

  const deleteMutation = useDeleteTournamentInfo({
    mutation: {
      onSuccess: () => { toast({ title: "Tournament deleted" }); invalidate(); },
      onError: () => toast({ variant: "destructive", title: "Failed to delete" }),
    },
  });

  const statusBadge = (s: string) => {
    if (s === "active") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Active</Badge>;
    if (s === "completed") return <Badge variant="secondary" className="text-xs">Completed</Badge>;
    return <Badge variant="outline" className="text-xs">Upcoming</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight">Tournaments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage tournament editions and their rules</p>
        </div>
        {!adding && (
          <Button onClick={() => setAdding(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Tournament
          </Button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New Tournament</CardTitle>
          </CardHeader>
          <CardContent>
            <TournamentFormPanel
              initial={EMPTY_FORM}
              onSave={(f) => createMutation.mutate({ data: formToPayload(f) })}
              onCancel={() => setAdding(false)}
              isSaving={createMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Tournament list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : tournaments && tournaments.length > 0 ? (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Card key={t.id} className={t.isActive ? "border-primary/50" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold truncate">{t.name}</span>
                      {statusBadge(t.status)}
                      {t.isActive && <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Shown on About page</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>📅 {t.date}</span>
                      <span>📍 {t.venue}{t.city ? `, ${t.city}` : ""}</span>
                      <span>⚽ {t.format} · {t.maxTeams ?? 5} teams</span>
                      <span>🕙 {t.kickoffTime ?? "TBC"}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost" size="sm" className="h-8 w-8 p-0"
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    >
                      {expandedId === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate({ id: t.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedId === t.id && (
                  <div className="mt-4 border-t pt-4">
                    <TournamentFormPanel
                      initial={tournamentToForm(t)}
                      onSave={(f) => updateMutation.mutate({ id: t.id, data: formToPayload(f) })}
                      onCancel={() => setExpandedId(null)}
                      isSaving={updateMutation.isPending && (updateMutation.variables as { id: number })?.id === t.id}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No tournaments yet. Create one above.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
