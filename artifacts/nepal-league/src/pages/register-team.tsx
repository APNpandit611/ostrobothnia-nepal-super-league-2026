import { useState, useRef, useEffect } from "react";
import { useGetActiveTournament } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, UserPlus, Trash2, CheckCircle2, ClipboardList,
  Shield, ChevronRight, Upload, X,
  CalendarX, Lock, CalendarDays, MapPin, Users, Swords, LogIn,
} from "lucide-react";
import { Link } from "wouter";
import { format, differenceInDays } from "date-fns";

const POSITIONS = ["GK", "C", "V.C", "Player", "Manager"];
const MIN_PLAYERS = 7;
const MAX_PLAYERS = 15;
const CATEGORIES = ["Open", "U18", "U21", "Veterans", "Mixed", "Other"];
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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

function parseTournamentDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59);
}

// ─── Registration closed screen ───────────────────────────────────────────────
function RegistrationClosed({ reason }: { reason: "no-tournament" | "past" }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-20 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
        {reason === "no-tournament"
          ? <CalendarX className="h-9 w-9 text-muted-foreground" />
          : <Lock className="h-9 w-9 text-muted-foreground" />}
      </div>
      <div>
        <h1 className="text-2xl font-black">
          {reason === "no-tournament" ? "No Upcoming Tournament" : "Registration Closed"}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {reason === "no-tournament"
            ? "There is no upcoming tournament open for team registration at the moment. Check back later or follow us for announcements."
            : "The registration window for this tournament has closed. The event has already taken place."}
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/announcements">
          <Button variant="outline">News & Updates</Button>
        </Link>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}

interface RegistrationFormProps {
  tournamentName: string;
  tournamentDate: string;
  venue: string;
  city: string | null | undefined;
  format_: string;
  maxTeams: number | null | undefined;
  kickoffTime: string | null | undefined;
}

// ─── Main registration form ───────────────────────────────────────────────────
function RegistrationForm({ tournamentName, tournamentDate, venue, city, format_, maxTeams, kickoffTime }: RegistrationFormProps) {
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { isLoaded, isSignedIn, user } = useUser();

  const [step, setStep] = useState<1 | 2>(1);

  const [teamName, setTeamName] = useState("");
  const [shortName, setShortName] = useState("");
  const [teamCity, setTeamCity] = useState("");
  const [category, setCategory] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#16a34a");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  const [rows, setRows] = useState<PlayerRow[]>(Array.from({ length: MIN_PLAYERS }, newRow));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdTeamId, setCreatedTeamId] = useState<number | null>(null);
  const [createdTeamName, setCreatedTeamName] = useState("");

  // Pre-fill manager email from Clerk
  useEffect(() => {
    if (user && !managerEmail) {
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      if (email) setManagerEmail(email);
    }
    if (user && !managerName) {
      const name = user.fullName ?? "";
      if (name) setManagerName(name);
    }
  }, [user]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  const handleStep1Next = () => {
    if (!teamName.trim()) { toast({ variant: "destructive", title: "Team name is required" }); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length < MIN_PLAYERS) {
      toast({ variant: "destructive", title: `At least ${MIN_PLAYERS} players required`, description: `You have ${validRows.length}. Please fill in at least ${MIN_PLAYERS} names.` });
      return;
    }
    setSubmitting(true);
    const sn = shortName.trim() || autoShortName(teamName);
    try {
      const res = await fetch("/api/register/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: teamName.trim(),
          shortName: sn,
          primaryColor,
          logoUrl: logoDataUrl ?? null,
          city: teamCity.trim() || null,
          category: category || null,
          managerName: managerName.trim() || null,
          managerPhone: managerPhone.trim() || null,
          managerEmail: managerEmail.trim() || null,
          players: validRows.map(r => ({
            name: r.name.trim(),
            number: r.number ? parseInt(r.number) : null,
            position: r.position || null,
            email: r.email.trim() || null,
            phone: r.phone.trim() || null,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Registration failed");
      }
      const team = await res.json() as { id: number; name: string };
      setCreatedTeamId(team.id);
      setCreatedTeamName(team.name);
      setSubmitted(true);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to register team", description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Sign-in guard
  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-20 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <LogIn className="h-9 w-9 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Sign In Required</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Sign in with Google or Facebook to verify your identity before registering your team.
          </p>
        </div>
        <Link href={`${basePath}/sign-in?redirect_url=${basePath}/register-team`}>
          <Button size="lg" className="font-bold">
            <LogIn className="h-4 w-4 mr-2" /> Sign In to Continue
          </Button>
        </Link>
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Registration Submitted!</h2>
          <p className="text-muted-foreground mt-2">
            <span className="font-bold text-foreground">{createdTeamName}</span> has been submitted for{" "}
            <span className="font-bold text-foreground">{tournamentName}</span> and is now{" "}
            <span className="font-bold text-foreground">pending admin approval</span>. Your team will appear on the site once an admin approves it.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/teams"><Button variant="outline"><ClipboardList className="h-4 w-4 mr-2" /> View Squads</Button></Link>
          <Link href="/"><Button>Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  const steps = ["Team Details", "Add Players"];
  const StepIndicator = () => (
    <div className="flex items-center gap-1 justify-center text-sm mb-6 flex-wrap">
      {steps.map((label, i) => {
        const num = (i + 1) as 1 | 2;
        const active = step === num;
        const done = step > num;
        return (
          <div key={label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-0.5" />}
            <div className={`flex items-center gap-1.5 font-semibold ${active ? "text-primary" : done ? "text-primary/60" : "text-muted-foreground"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${active ? "bg-primary text-primary-foreground" : done ? "bg-primary/30 text-primary" : "bg-muted text-muted-foreground"}`}>
                {done ? "✓" : num}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const eventDate = parseTournamentDate(tournamentDate);
  const daysLeft = differenceInDays(eventDate, new Date());
  const displayDate = format(eventDate, "EEEE, d MMMM yyyy");
  const displayVenue = [venue, city].filter(Boolean).join(", ");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Event Hero Banner ── */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full border-[40px] border-primary/10 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full border-[30px] border-primary/10 pointer-events-none" />

        <div className="relative px-6 py-8 flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-primary/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground" />
            </span>
            Registration Open
          </div>

          <div className="flex items-center gap-4">
            <img src="/onsl-official-logo.png" alt={tournamentName} className="h-16 w-16 rounded-full object-contain ring-2 ring-primary/40 shadow-xl" />
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Team Registration for</p>
              <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight leading-tight">{tournamentName}</h1>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 bg-background/60 border rounded-full px-3 py-1.5 text-xs font-semibold">
              <CalendarDays className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              {displayDate}
              {kickoffTime && <span className="text-muted-foreground">· Kick-off {kickoffTime}</span>}
            </div>
            {displayVenue && (
              <div className="flex items-center gap-1.5 bg-background/60 border rounded-full px-3 py-1.5 text-xs font-semibold">
                <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                {displayVenue}
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-background/60 border rounded-full px-3 py-1.5 text-xs font-semibold">
              <Swords className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              {format_}
            </div>
            {maxTeams && (
              <div className="flex items-center gap-1.5 bg-background/60 border rounded-full px-3 py-1.5 text-xs font-semibold">
                <Users className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                {maxTeams} Teams
              </div>
            )}
          </div>

          {daysLeft > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-5 py-2.5 mt-1">
              <span className="text-3xl font-black text-primary tabular-nums">{daysLeft}</span>
              <span className="text-sm font-bold text-muted-foreground leading-tight">
                day{daysLeft !== 1 ? "s" : ""}<br />until event
              </span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">Submit your squad below · Once registered, only admin can make changes</p>
        </div>
      </div>

      {/* Signed-in identity badge */}
      {isSignedIn && user && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-sm">
          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-muted-foreground">Registering as</span>
          <span className="font-semibold text-foreground">{user.primaryEmailAddress?.emailAddress}</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <StepIndicator />

        {/* STEP 1 — Team Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Team Details</CardTitle>
              <CardDescription>Fill in your team information and add your players next.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Team Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2" style={{ borderColor: primaryColor }} />
                      <button onClick={clearLogo} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary transition-colors" onClick={() => logoInputRef.current?.click()}>
                      <Upload className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" /> Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2 MB</p>
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
                <div className="space-y-1">
                  <Label>Team Name *</Label>
                  <Input placeholder="e.g. Kokkola Soccer Boys" value={teamName} onChange={(e) => { setTeamName(e.target.value); if (!shortName) setShortName(autoShortName(e.target.value)); }} />
                </div>
                <div className="space-y-1 w-20">
                  <Label>Short</Label>
                  <Input placeholder="KSB" maxLength={5} value={shortName} onChange={(e) => setShortName(e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-1">
                  <Label>Colour</Label>
                  <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 p-1 h-10 cursor-pointer" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>City / Club</Label>
                  <Input placeholder="e.g. Kokkola" value={teamCity} onChange={(e) => setTeamCity(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 pt-1 border-t">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-2">Manager / Contact</p>
                <div className="space-y-1">
                  <Label>Manager Name</Label>
                  <Input placeholder="e.g. Raj Kumar" value={managerName} onChange={(e) => setManagerName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Manager Phone</Label>
                    <Input type="tel" placeholder="+358 …" value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Manager Email</Label>
                    <Input type="email" placeholder="manager@email.com" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Auto-filled from your sign-in</p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="w-full font-bold uppercase tracking-wider" onClick={handleStep1Next} disabled={!teamName.trim()}>
                Continue — Add Players <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 2 — Add Players */}
        {step === 2 && (
          <>
            <div className="p-3 rounded-xl border bg-card flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                {shortName || autoShortName(teamName)}
              </div>
              <div>
                <div className="font-black">{teamName}</div>
                {teamCity && <div className="text-xs text-muted-foreground">{teamCity}{category ? ` · ${category}` : ""}</div>}
              </div>
              <button onClick={() => setStep(1)} className="ml-auto text-xs text-muted-foreground hover:text-foreground underline">Edit</button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Register Players</span>
                  <span className={`text-sm font-semibold tabular-nums ${rows.length >= MAX_PLAYERS ? "text-destructive" : "text-muted-foreground"}`}>{rows.length} / {MAX_PLAYERS}</span>
                </CardTitle>
                <CardDescription>Min {MIN_PLAYERS} players required · Max {MAX_PLAYERS} · Manager can also be a player.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {rows.map((row, idx) => (
                  <div key={row.id} className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Player {idx + 1}</span>
                      {rows.length > MIN_PLAYERS && (
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
                          <SelectContent>{POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input type="email" placeholder="optional" value={row.email} onChange={(e) => setRows((r) => r.map((x) => x.id === row.id ? { ...x, email: e.target.value } : x))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone</Label>
                        <Input type="tel" placeholder="optional" value={row.phone} onChange={(e) => setRows((r) => r.map((x) => x.id === row.id ? { ...x, phone: e.target.value } : x))} />
                      </div>
                    </div>
                  </div>
                ))}

                {rows.length < MAX_PLAYERS && (
                  <Button variant="outline" className="w-full border-dashed" onClick={() => setRows((r) => [...r, newRow()])}>
                    <UserPlus className="h-4 w-4 mr-2" /> Add Player
                  </Button>
                )}
              </CardContent>
            </Card>

            <Button size="lg" className="w-full font-bold uppercase tracking-wider mt-4" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Registering…</> : `Submit Registration for ${tournamentName}`}
            </Button>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground pb-4 mt-4">
          <Link href="/teams" className="underline hover:text-foreground">View squads</Link>
          {" · "}
          <Link href="/" className="underline hover:text-foreground">Back to home</Link>
        </p>
      </div>
    </div>
  );
}

// ─── Page entry point ─────────────────────────────────────────────────────────
export default function RegisterTeam() {
  const { data: tournament, isLoading } = useGetActiveTournament();

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) {
    return <RegistrationClosed reason="no-tournament" />;
  }

  const tournamentDate = parseTournamentDate(tournament.date);
  if (tournamentDate < new Date()) {
    return <RegistrationClosed reason="past" />;
  }

  return (
    <RegistrationForm
      tournamentName={tournament.name}
      tournamentDate={tournament.date}
      venue={tournament.venue}
      city={tournament.city}
      format_={tournament.format}
      maxTeams={tournament.maxTeams}
      kickoffTime={tournament.kickoffTime}
    />
  );
}
