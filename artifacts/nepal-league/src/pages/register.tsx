import { useState } from "react";
import { useListTeams, useAddPlayer } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Trash2, CheckCircle2, ClipboardList } from "lucide-react";
import { Link } from "wouter";

const POSITIONS = ["GK", "C", "V.C", "Manager"];

interface PlayerRow {
  id: string;
  name: string;
  number: string;
  position: string;
  email: string;
  phone: string;
}

function newRow(): PlayerRow {
  return { id: crypto.randomUUID(), name: "", number: "", position: "", email: "", phone: "" };
}

export default function Register() {
  const { toast } = useToast();
  const { data: teams, isLoading: teamsLoading } = useListTeams();
  const [teamId, setTeamId] = useState<string>("");
  const [rows, setRows] = useState<PlayerRow[]>([newRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const addPlayerMutation = useAddPlayer({ mutation: {} });

  const updateRow = (id: string, field: keyof PlayerRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const addRow = () => setRows((prev) => [...prev, newRow()]);

  const handleSubmit = async () => {
    if (!teamId) {
      toast({ variant: "destructive", title: "Please select your team" });
      return;
    }
    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length === 0) {
      toast({ variant: "destructive", title: "Add at least one player name" });
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of validRows) {
      try {
        await new Promise<void>((resolve, reject) => {
          addPlayerMutation.mutate(
            {
              teamId: parseInt(teamId),
              data: {
                name: row.name.trim(),
                number: row.number ? parseInt(row.number) : null,
                position: row.position || null,
                email: row.email.trim() || null,
                phone: row.phone.trim() || null,
              },
            },
            { onSuccess: () => resolve(), onError: () => reject() }
          );
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setSubmitting(false);

    if (failCount === 0) {
      setSubmitted(true);
    } else {
      toast({
        variant: "destructive",
        title: `${failCount} player(s) failed to register`,
        description: `${successCount} were registered successfully.`,
      });
    }
  };

  if (submitted) {
    const team = teams?.find((t) => t.id === parseInt(teamId));
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Registered!</h1>
            <p className="text-muted-foreground mt-2">
              Your squad for <span className="font-bold text-foreground">{team?.name}</span> has been submitted.
              Only the admin can make changes from here.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/teams">
              <Button variant="outline">
                <ClipboardList className="h-4 w-4 mr-2" /> View Teams
              </Button>
            </Link>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src="/onsl-official-logo.png"
            alt="ONSL 2026"
            className="h-16 w-16 rounded-full object-contain mx-auto"
          />
          <h1 className="text-3xl font-black tracking-tight uppercase italic">Player Registration</h1>
          <p className="text-muted-foreground">
            Register your squad for the Ostrobothnia Nepal Super League 2026.
            <br />
            Once submitted, only admin can make changes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Your Team</CardTitle>
            <CardDescription>Choose the team you are registering players for</CardDescription>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="— Select a team —" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.primaryColor ?? "#888" }}
                        />
                        {t.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Players
            </CardTitle>
            <CardDescription>
              Name and jersey number are required. Email and phone are optional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.map((row, idx) => (
              <div key={row.id} className="border rounded-xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Player {idx + 1}
                  </span>
                  {rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Full Name *</Label>
                    <Input
                      placeholder="e.g. Suman Thapa"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Jersey Number</Label>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      placeholder="e.g. 10"
                      value={row.number}
                      onChange={(e) => updateRow(row.id, "number", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Role</Label>
                    <Select value={row.position} onValueChange={(v) => updateRow(row.id, "position", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email (optional)</Label>
                    <Input
                      type="email"
                      placeholder="player@email.com"
                      value={row.email}
                      onChange={(e) => updateRow(row.id, "email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone (optional)</Label>
                    <Input
                      type="tel"
                      placeholder="+358 …"
                      value={row.phone}
                      onChange={(e) => updateRow(row.id, "phone", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full" onClick={addRow}>
              <UserPlus className="h-4 w-4 mr-2" /> Add Another Player
            </Button>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full font-bold uppercase tracking-wider"
          onClick={handleSubmit}
          disabled={submitting || !teamId}
        >
          {submitting ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Registering…</>
          ) : (
            "Submit Registration"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Already registered?{" "}
          <Link href="/teams" className="underline hover:text-foreground">
            View squads
          </Link>
          {" · "}
          <Link href="/" className="underline hover:text-foreground">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
