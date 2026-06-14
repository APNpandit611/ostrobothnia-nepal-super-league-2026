import { useState, useRef } from "react";
import { useCreateTeam, useAddPlayer, useSubmitClubApplication } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, UserPlus, Trash2, CheckCircle2, ClipboardList,
  Shield, ChevronRight, Upload, X, Mail, Phone, KeyRound, RefreshCw, Heart,
} from "lucide-react";
import { Link } from "wouter";

// ─── Constants ────────────────────────────────────────────────────────────────
const POSITIONS = ["GK", "C", "V.C", "Player", "Manager"];
const FIELD_POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward", "Any position"];
const MIN_PLAYERS = 7;
const MAX_PLAYERS = 15;
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

async function sendOtp(contact: string, type: "email" | "phone"): Promise<{ id: string; devCode?: string }> {
  const res = await fetch("/api/register/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contact, type }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to send OTP");
  return res.json();
}

async function verifyOtp(id: string, code: string): Promise<boolean> {
  const res = await fetch("/api/register/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, code }),
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.verified === true;
}

// ─── Tab 1: Join KSB Club ─────────────────────────────────────────────────────
function JoinKsbTab() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [position, setPosition] = useState("");
  const [message, setMessage] = useState("");

  const submitMutation = useSubmitClubApplication({
    mutation: {
      onSuccess: () => setSubmitted(true),
      onError: () => toast({ variant: "destructive", title: "Submission failed", description: "Please try again." }),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({ variant: "destructive", title: "Name and email are required" });
      return;
    }
    submitMutation.mutate({ data: { name: name.trim(), email: email.trim(), phone: phone || undefined, dob: dob || undefined, position: position || undefined, message: message || undefined } });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-16">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Application Received!</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Thanks <span className="font-semibold text-foreground">{name}</span>! We'll review your application and get back to you at <span className="font-semibold text-foreground">{email}</span> soon.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setSubmitted(false); setName(""); setEmail(""); setPhone(""); setDob(""); setPosition(""); setMessage(""); }}>
            Submit Another
          </Button>
          <Link href="/"><Button>Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pt-2">
      <div className="text-center space-y-1">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Heart className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-black">Join Kokkola Soccer Boys</h2>
        <p className="text-sm text-muted-foreground">
          Interested in joining KSB? Fill in your details and we'll be in touch.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Full Name *</Label>
              <Input placeholder="e.g. Suman Thapa" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input type="tel" placeholder="+358 …" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Preferred Position</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {FIELD_POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>About You / Message</Label>
              <Textarea
                placeholder="Tell us a little about yourself — your football background, experience, why you want to join KSB…"
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            <Button type="submit" size="lg" className="w-full font-bold uppercase tracking-wider" disabled={submitMutation.isPending || !name.trim() || !email.trim()}>
              {submitMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending…</> : <><Heart className="h-4 w-4 mr-2" /> Submit Application</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pb-2">
        We aim to respond within a few days. For urgent enquiries email{" "}
        <a href="mailto:ksoccerboys@gmail.com" className="underline hover:text-foreground">ksoccerboys@gmail.com</a>
      </p>
    </div>
  );
}

// ─── Tab 2: Register Team ─────────────────────────────────────────────────────
function RegisterTeamTab() {
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);

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

  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const [createdTeamId, setCreatedTeamId] = useState<number | null>(null);
  const [createdTeamName, setCreatedTeamName] = useState("");
  const [rows, setRows] = useState<PlayerRow[]>(Array.from({ length: MIN_PLAYERS }, newRow));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const createTeamMutation = useCreateTeam({ mutation: {} });
  const addPlayerMutation = useAddPlayer({ mutation: {} });

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
    if (!managerEmail.trim()) { toast({ variant: "destructive", title: "Manager email is required" }); return; }
    setStep(2);
  };

  const handleSendOtp = async () => {
    const contact = managerEmail.trim();
    if (!contact) return;
    setOtpSending(true);
    try {
      const result = await sendOtp(contact, "email");
      setOtpId(result.id);
      setOtpSent(true);
      setOtpCode("");
      if (result.devCode) setDevCode(result.devCode);
      toast({ title: "Code sent!", description: `Check ${contact}` });
    } catch {
      toast({ variant: "destructive", title: "Failed to send code" });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpId || otpCode.length !== 6) { toast({ variant: "destructive", title: "Enter the 6-digit code" }); return; }
    setOtpVerifying(true);
    try {
      const ok = await verifyOtp(otpId, otpCode);
      if (ok) {
        setStep(3);
        toast({ title: "Identity verified!", description: "Now register your players." });
      } else {
        toast({ variant: "destructive", title: "Incorrect or expired code" });
      }
    } catch {
      toast({ variant: "destructive", title: "Verification failed" });
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length < MIN_PLAYERS) {
      toast({ variant: "destructive", title: `At least ${MIN_PLAYERS} players required`, description: `You have ${validRows.length}. Please fill in at least ${MIN_PLAYERS} names.` });
      return;
    }
    setSubmitting(true);
    const sn = shortName.trim() || autoShortName(teamName);
    let teamId = createdTeamId;

    if (!teamId) {
      try {
        await new Promise<void>((resolve, reject) => {
          createTeamMutation.mutate(
            { data: { name: teamName.trim(), shortName: sn, primaryColor, logoUrl: logoDataUrl ?? null, city: city.trim() || null, category: category || null, managerName: managerName.trim() || null, managerPhone: managerPhone.trim() || null, managerEmail: managerEmail.trim() || null } },
            { onSuccess: (team) => { teamId = team.id; setCreatedTeamId(team.id); setCreatedTeamName(team.name); resolve(); }, onError: () => reject() }
          );
        });
      } catch {
        toast({ variant: "destructive", title: "Failed to register team" });
        setSubmitting(false);
        return;
      }
    }

    if (!teamId) { setSubmitting(false); return; }
    const finalTeamId: number = teamId;
    let failCount = 0;
    for (const row of validRows) {
      try {
        await new Promise<void>((resolve, reject) => {
          addPlayerMutation.mutate(
            { teamId: finalTeamId, data: { name: row.name.trim(), number: row.number ? parseInt(row.number) : null, position: row.position || null, email: row.email.trim() || null, phone: row.phone.trim() || null } },
            { onSuccess: () => resolve(), onError: () => reject() }
          );
        });
      } catch { failCount++; }
    }

    setSubmitting(false);
    if (failCount === 0) setSubmitted(true);
    else toast({ variant: "destructive", title: `${failCount} player(s) failed` });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-16">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Registration Complete!</h2>
          <p className="text-muted-foreground mt-2">
            <span className="font-bold text-foreground">{createdTeamName}</span> has been registered for ONSL 2026. Only the admin can make changes from here.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/teams"><Button variant="outline"><ClipboardList className="h-4 w-4 mr-2" /> View Squads</Button></Link>
          <Link href="/"><Button>Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  const steps = ["Team Details", "Verify Identity", "Add Players"];
  const StepIndicator = () => (
    <div className="flex items-center gap-1 justify-center text-sm mb-6 flex-wrap">
      {steps.map((label, i) => {
        const num = (i + 1) as 1 | 2 | 3;
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-2">
      <div className="text-center space-y-2">
        <img src="/onsl-official-logo.png" alt="ONSL 2026" className="h-14 w-14 rounded-full object-contain mx-auto" />
        <h2 className="text-xl font-black uppercase italic">Team Registration</h2>
        <p className="text-muted-foreground text-sm">Register your team for ONSL 2026. Once submitted, only admin can make changes.</p>
      </div>

      <StepIndicator />

      {/* STEP 1 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Team Details</CardTitle>
            <CardDescription>Fill in your team information. You'll verify your identity next.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Logo */}
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

            {/* Name / short / color */}
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

            {/* City + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>City / Club</Label>
                <Input placeholder="e.g. Kokkola" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Manager */}
            <div className="space-y-3 pt-1 border-t">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-2">Manager / Contact</p>
              <p className="text-xs text-muted-foreground -mt-1">Manager email is required — a verification code will be sent to it.</p>
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
                  <Label>Manager Email *</Label>
                  <Input type="email" placeholder="manager@email.com" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} />
                </div>
              </div>
            </div>

            <Button size="lg" className="w-full font-bold uppercase tracking-wider" onClick={handleStep1Next} disabled={!teamName.trim()}>
              Continue — Verify Identity <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Verify Your Identity</CardTitle>
            <CardDescription>We'll send a 6-digit code to confirm you're the team manager.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-primary bg-primary/5 text-primary text-sm font-semibold">
              <Mail className="h-4 w-4" /> Verification code sent by Email
            </div>
            <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{otpSent ? "A code was sent to" : "Code will be sent to"}</p>
                <p className="font-semibold text-sm">{managerEmail.trim()}</p>
              </div>
            </div>
            {devCode && (
              <div className="rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-700 dark:text-yellow-400 mb-1">Dev mode — no SMTP configured</p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">Your code is: <span className="font-mono font-black text-lg tracking-widest">{devCode}</span></p>
              </div>
            )}
            {!otpSent ? (
              <Button size="lg" className="w-full font-bold" onClick={handleSendOtp} disabled={otpSending}>
                {otpSending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending…</> : "Send Verification Code"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Enter 6-digit code</Label>
                  <Input type="text" inputMode="numeric" maxLength={6} placeholder="— — — — — —" className="text-center text-2xl font-mono tracking-[0.4em] h-14" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(e) => { if (e.key === "Enter" && otpCode.length === 6) handleVerifyOtp(); }} autoFocus />
                  <p className="text-xs text-muted-foreground text-center">Code expires in 10 minutes</p>
                </div>
                <Button size="lg" className="w-full font-bold" onClick={handleVerifyOtp} disabled={otpVerifying || otpCode.length !== 6}>
                  {otpVerifying ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying…</> : "Verify Code"}
                </Button>
                <button className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => { setOtpSent(false); setDevCode(null); setOtpCode(""); }} disabled={otpSending}>
                  <RefreshCw className="h-3.5 w-3.5" /> Resend code
                </button>
              </div>
            )}
            <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-xl py-3 transition-colors bg-muted/40 hover:bg-muted" onClick={() => { setStep(1); setOtpSent(false); setOtpCode(""); setDevCode(null); setOtpId(null); }}>
              ← Back to Team Details
            </button>
          </CardContent>
        </Card>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <>
          <div className="rounded-xl p-4 flex items-center gap-4" style={{ backgroundColor: `${primaryColor}22`, borderLeft: `4px solid ${primaryColor}` }}>
            {logoPreview ? (
              <img src={logoPreview} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
            ) : (
              <span className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: primaryColor }}>
                {shortName || autoShortName(teamName)}
              </span>
            )}
            <div>
              <div className="font-black">{teamName}</div>
              {city && <div className="text-xs text-muted-foreground">{city}{category ? ` · ${category}` : ""}</div>}
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-primary font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Verified
            </div>
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
              {rows.length < MAX_PLAYERS && (
                <Button variant="outline" className="w-full" onClick={() => setRows((r) => [...r, newRow()])}>
                  <UserPlus className="h-4 w-4 mr-2" /> Add Another Player
                </Button>
              )}
              {rows.length >= MAX_PLAYERS && <p className="text-center text-xs text-muted-foreground">Maximum {MAX_PLAYERS} players reached</p>}
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
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Register() {
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const defaultTab = hash === "#team" ? "team" : "join";

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="join" className="flex items-center gap-2">
            <Heart className="h-4 w-4" /> Join KSB Club
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Register Team
          </TabsTrigger>
        </TabsList>
        <TabsContent value="join"><JoinKsbTab /></TabsContent>
        <TabsContent value="team"><RegisterTeamTab /></TabsContent>
      </Tabs>
    </div>
  );
}
