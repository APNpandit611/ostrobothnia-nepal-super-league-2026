import { useState, useRef } from "react";
import { useCreateTeam, useAddPlayer } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, UserPlus, Trash2, CheckCircle2, ClipboardList,
  Shield, ChevronRight, Upload, X,
} from "lucide-react";
import { Link } from "wouter";

const POSITIONS = ["GK", "C", "V.C", "Manager"];
const CATEGORIES = ["Open", "U18", "U21", "Veterans", "Mixed", "Other"];

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

function autoShortName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 4).toUpperCase();
}

export default function Register() {
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step state
  const [step, setStep] = useState<1 | 2>(1);

  // Team form
  const [teamName, setTeamName] = useState("");
  const [shortName, setShortName] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#16a34a");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  // Created team id
  const [createdTeamId, setCreatedTeamId] = useState<number | null>(null);
  const [createdTeamName, setCreatedTeamName] = useState("");

  // Players
  const [rows, setRows] = useState<PlayerRow[]>([newRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const createTeamMutation = useCreateTeam({ mutation: {} });
  const addPlayerMutation = useAddPlayer({ mutation: {} });

  /* ── Logo upload ── */
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Logo too large", description: "Please use an image under 2 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setLogoPreview(result);
      setLogoDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    setLogoPreview(null);
    setLogoDataUrl(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  /* ── Step 1 submit ── */
  const handleTeamNext = () => {
    if (!teamName.trim()) {
      toast({ variant: "destructive", title: "Team name is required" });
      return;
    }
    const sn = shortName.trim() || autoShortName(teamName);

    createTeamMutation.mutate(
      {
        data: {
          name: teamName.trim(),
          shortName: sn,
          primaryColor,
          logoUrl: logoDataUrl ?? null,
          city: city.trim() || null,
          category: category || null,
          managerName: managerName.trim() || null,
          managerPhone: managerPhone.trim() || null,
          managerEmail: managerEmail.trim() || null,
        },
      },
      {
        onSuccess: (team) => {
          setCreatedTeamId(team.id);
          setCreatedTeamName(team.name);
          setStep(2);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to register team", description: "Please try again." });
        },
      }
    );
  };

  /* ── Step 2 submit ── */
  const handleSubmit = async () => {
    if (!createdTeamId) return;
    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length === 0) {
      toast({ variant: "destructive", title: "Add at least one player name" });
      return;
    }

    setSubmitting(true);
    let failCount = 0;

    for (const row of validRows) {
      try {
        await new Promise<void>((resolve, reject) => {
          addPlayerMutation.mutate(
            {
              teamId: createdTeamId,
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
        title: `${failCount} player(s) failed`,
        description: "Some players could not be registered.",
      });
    }
  };

  /* ── Success ── */
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Registration Complete!</h1>
            <p className="text-muted-foreground mt-2">
              <span className="font-bold text-foreground">{createdTeamName}</span> has been
              registered for ONSL 2026. Only the admin can make changes from here.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/teams">
              <Button variant="outline"><ClipboardList className="h-4 w-4 mr-2" /> View Squads</Button>
            </Link>
            <Link href="/"><Button>Back to Home</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step indicator ── */
  const StepIndicator = () => (
    <div className="flex items-center gap-2 justify-center text-sm mb-6">
      {(["Team Details", "Add Players"] as const).map((label, i) => {
        const num = i + 1;
        const active = step === num;
        const done = step > num;
        return (
          <div key={label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
            <div className={`flex items-center gap-1.5 font-semibold ${active ? "text-primary" : done ? "text-primary/60" : "text-muted-foreground"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${active ? "bg-primary text-primary-foreground" : done ? "bg-primary/30 text-primary" : "bg-muted text-muted-foreground"}`}>
                {done ? "✓" : num}
              </span>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <img src="/onsl-official-logo.png" alt="ONSL 2026" className="h-16 w-16 rounded-full object-contain mx-auto" />
          <h1 className="text-3xl font-black tracking-tight uppercase italic">Team Registration</h1>
          <p className="text-muted-foreground text-sm">
            Register your team for the Ostrobothnia Nepal Super League 2026.<br />
            Once submitted, only admin can make changes.
          </p>
        </div>

        <StepIndicator />

        {/* ══════════ STEP 1: Team Details ══════════ */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Team Details
              </CardTitle>
              <CardDescription>Fill in your team information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Logo upload */}
              <div className="space-y-2">
                <Label>Team Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-16 h-16 rounded-full object-cover border-2"
                        style={{ borderColor: primaryColor }}
                      />
                      <button
                        onClick={clearLogo}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary transition-colors"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" /> Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2 MB</p>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>
              </div>

              {/* Team name + short name + color */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
                <div className="space-y-1">
                  <Label>Team Name *</Label>
                  <Input
                    placeholder="e.g. Kokkola Soccer Boys"
                    value={teamName}
                    onChange={(e) => {
                      setTeamName(e.target.value);
                      if (!shortName) setShortName(autoShortName(e.target.value));
                    }}
                  />
                </div>
                <div className="space-y-1 w-20">
                  <Label>Short</Label>
                  <Input
                    placeholder="KSB"
                    maxLength={5}
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Colour</Label>
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 p-1 h-10 cursor-pointer"
                  />
                </div>
              </div>

              {/* City + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>City / Club</Label>
                  <Input
                    placeholder="e.g. Kokkola"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Manager */}
              <div className="space-y-3 pt-1 border-t">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-2">
                  Manager / Contact
                </p>
                <div className="space-y-1">
                  <Label>Manager Name</Label>
                  <Input
                    placeholder="e.g. Raj Kumar"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Manager Phone</Label>
                    <Input
                      type="tel"
                      placeholder="+358 …"
                      value={managerPhone}
                      onChange={(e) => setManagerPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Manager Email</Label>
                    <Input
                      type="email"
                      placeholder="manager@email.com"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full font-bold uppercase tracking-wider"
                onClick={handleTeamNext}
                disabled={createTeamMutation.isPending || !teamName.trim()}
              >
                {createTeamMutation.isPending ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Saving…</>
                ) : (
                  <>Continue — Add Players <ChevronRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ══════════ STEP 2: Add Players ══════════ */}
        {step === 2 && (
          <>
            {/* Team banner */}
            <div
              className="rounded-xl p-4 flex items-center gap-4"
              style={{ backgroundColor: `${primaryColor}22`, borderLeft: `4px solid ${primaryColor}` }}
            >
              {logoPreview ? (
                <img src={logoPreview} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
              ) : (
                <span
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-black text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {shortName || autoShortName(teamName)}
                </span>
              )}
              <div>
                <div className="font-black">{createdTeamName}</div>
                {city && <div className="text-xs text-muted-foreground">{city}{category ? ` · ${category}` : ""}</div>}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Register Players
                </CardTitle>
                <CardDescription>Name is required. Email and phone are optional.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {rows.map((row, idx) => (
                  <div key={row.id} className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Player {idx + 1}</span>
                      {rows.length > 1 && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Full Name *</Label>
                      <Input placeholder="e.g. Suman Thapa" value={row.name} onChange={(e) => setRows((r) => r.map((x) => x.id === row.id ? { ...x, name: e.target.value } : x))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Jersey Number</Label>
                        <Input type="number" min={1} max={99} placeholder="e.g. 10" value={row.number} onChange={(e) => setRows((r) => r.map((x) => x.id === row.id ? { ...x, number: e.target.value } : x))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Role</Label>
                        <Select value={row.position} onValueChange={(v) => setRows((r) => r.map((x) => x.id === row.id ? { ...x, position: v } : x))}>
                          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>{POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email (optional)</Label>
                        <Input type="email" placeholder="player@email.com" value={row.email} onChange={(e) => setRows((r) => r.map((x) => x.id === row.id ? { ...x, email: e.target.value } : x))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone (optional)</Label>
                        <Input type="tel" placeholder="+358 …" value={row.phone} onChange={(e) => setRows((r) => r.map((x) => x.id === row.id ? { ...x, phone: e.target.value } : x))} />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => setRows((r) => [...r, newRow()])}>
                  <UserPlus className="h-4 w-4 mr-2" /> Add Another Player
                </Button>
              </CardContent>
            </Card>

            <Button size="lg" className="w-full font-bold uppercase tracking-wider" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Registering…</> : "Submit Team Registration"}
            </Button>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground pb-4">
          <Link href="/teams" className="underline hover:text-foreground">View squads</Link>
          {" · "}
          <Link href="/" className="underline hover:text-foreground">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
