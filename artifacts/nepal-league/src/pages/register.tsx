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
  Shield, ChevronRight, Upload, X, Mail, Phone, KeyRound, RefreshCw,
} from "lucide-react";
import { Link } from "wouter";

const POSITIONS = ["GK", "C", "V.C", "Player", "Manager"];
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
  });
  if (!res.ok) throw new Error("Failed to send OTP");
  return res.json();
}

async function verifyOtp(id: string, code: string): Promise<boolean> {
  const res = await fetch("/api/register/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, code }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.verified === true;
}

export default function Register() {
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // step: 1=Team Details, 2=OTP Verify, 3=Add Players
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Step 1: Team form state ──
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

  // ── Step 2: OTP state ──
  const [otpMethod, setOtpMethod] = useState<"email" | "phone">("email");
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  // ── Step 3: Team + players ──
  const [createdTeamId, setCreatedTeamId] = useState<number | null>(null);
  const [createdTeamName, setCreatedTeamName] = useState("");
  const [rows, setRows] = useState<PlayerRow[]>(Array.from({ length: MIN_PLAYERS }, newRow));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const createTeamMutation = useCreateTeam({ mutation: {} });
  const addPlayerMutation = useAddPlayer({ mutation: {} });

  /* ── Logo upload ── */
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

  /* ── Step 1 → Step 2 ── */
  const handleStep1Next = () => {
    if (!teamName.trim()) {
      toast({ variant: "destructive", title: "Team name is required" });
      return;
    }
    if (!managerEmail.trim() && !managerPhone.trim()) {
      toast({ variant: "destructive", title: "Manager contact required", description: "Provide at least an email or phone number to verify your identity." });
      return;
    }
    // default OTP method based on what's provided
    if (managerEmail.trim()) {
      setOtpMethod("email");
    } else {
      setOtpMethod("phone");
    }
    setStep(2);
  };

  /* ── Send OTP ── */
  const handleSendOtp = async () => {
    const contact = otpMethod === "email" ? managerEmail.trim() : managerPhone.trim();
    if (!contact) {
      toast({ variant: "destructive", title: `No ${otpMethod === "email" ? "email" : "phone"} provided`, description: "Go back and add one in the team details." });
      return;
    }
    setOtpSending(true);
    try {
      const result = await sendOtp(contact, otpMethod);
      setOtpId(result.id);
      setOtpSent(true);
      setOtpCode("");
      if (result.devCode) {
        setDevCode(result.devCode);
      }
      toast({ title: "Code sent!", description: otpMethod === "email" ? `Check ${contact}` : `Code sent to ${contact}` });
    } catch {
      toast({ variant: "destructive", title: "Failed to send code", description: "Please try again." });
    } finally {
      setOtpSending(false);
    }
  };

  /* ── Verify OTP ── */
  const handleVerifyOtp = async () => {
    if (!otpId || otpCode.length !== 6) {
      toast({ variant: "destructive", title: "Enter the 6-digit code" });
      return;
    }
    setOtpVerifying(true);
    try {
      const ok = await verifyOtp(otpId, otpCode);
      if (ok) {
        setStep(3);
        toast({ title: "Identity verified!", description: "Now register your players." });
      } else {
        toast({ variant: "destructive", title: "Incorrect or expired code", description: "Check the code and try again, or resend." });
      }
    } catch {
      toast({ variant: "destructive", title: "Verification failed", description: "Please try again." });
    } finally {
      setOtpVerifying(false);
    }
  };

  /* ── Step 3: Create team + add players ── */
  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length < MIN_PLAYERS) {
      toast({ variant: "destructive", title: `At least ${MIN_PLAYERS} players required`, description: `You have ${validRows.length} named. Please fill in at least ${MIN_PLAYERS} player names.` });
      return;
    }
    setSubmitting(true);

    const sn = shortName.trim() || autoShortName(teamName);

    let teamId = createdTeamId;

    // Create team if not yet created
    if (!teamId) {
      try {
        await new Promise<void>((resolve, reject) => {
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
                teamId = team.id;
                setCreatedTeamId(team.id);
                setCreatedTeamName(team.name);
                resolve();
              },
              onError: () => reject(new Error("Failed to create team")),
            }
          );
        });
      } catch {
        toast({ variant: "destructive", title: "Failed to register team", description: "Please try again." });
        setSubmitting(false);
        return;
      }
    }

    if (!teamId) {
      setSubmitting(false);
      return;
    }

    const finalTeamId: number = teamId;
    let failCount = 0;
    for (const row of validRows) {
      try {
        await new Promise<void>((resolve, reject) => {
          addPlayerMutation.mutate(
            {
              teamId: finalTeamId,
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
      toast({ variant: "destructive", title: `${failCount} player(s) failed`, description: "Some players could not be registered." });
    }
  };

  /* ── Success screen ── */
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

  const otpContact = otpMethod === "email" ? managerEmail.trim() : managerPhone.trim();
  const hasEmail = !!managerEmail.trim();
  const hasPhone = !!managerPhone.trim();

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
              <CardDescription>Fill in your team information. You'll verify your identity next.</CardDescription>
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
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
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
                <p className="text-xs text-muted-foreground -mt-1">
                  At least one of email or phone is required — it will be used to verify your identity.
                </p>
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
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full font-bold uppercase tracking-wider"
                onClick={handleStep1Next}
                disabled={!teamName.trim()}
              >
                Continue — Verify Identity <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ══════════ STEP 2: OTP Verification ══════════ */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Verify Your Identity
              </CardTitle>
              <CardDescription>
                We'll send a 6-digit code to confirm you're the team manager.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Method toggle */}
              <div className="space-y-2">
                <Label>Send code via</Label>
                <div className="flex gap-2">
                  {hasEmail && (
                    <button
                      onClick={() => { setOtpMethod("email"); setOtpSent(false); setOtpCode(""); setDevCode(null); }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${otpMethod === "email" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      <Mail className="h-4 w-4" /> Email
                    </button>
                  )}
                  {hasPhone && (
                    <button
                      onClick={() => { setOtpMethod("phone"); setOtpSent(false); setOtpCode(""); setDevCode(null); }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${otpMethod === "phone" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      <Phone className="h-4 w-4" /> Phone
                    </button>
                  )}
                </div>
              </div>

              {/* Contact display */}
              <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center gap-3">
                {otpMethod === "email" ? <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                <div>
                  <p className="text-xs text-muted-foreground">Sending to</p>
                  <p className="font-semibold text-sm">{otpContact || <span className="text-muted-foreground italic">not provided</span>}</p>
                </div>
              </div>

              {/* Dev code hint */}
              {devCode && (
                <div className="rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-yellow-700 dark:text-yellow-400 mb-1">Dev mode — no SMTP configured</p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Your code is: <span className="font-mono font-black text-lg tracking-widest">{devCode}</span>
                  </p>
                </div>
              )}

              {/* Send button / code input */}
              {!otpSent ? (
                <Button
                  size="lg"
                  className="w-full font-bold"
                  onClick={handleSendOtp}
                  disabled={otpSending || !otpContact}
                >
                  {otpSending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending…</> : <>Send Verification Code</>}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Enter 6-digit code</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="— — — — — —"
                      className="text-center text-2xl font-mono tracking-[0.4em] h-14"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      onKeyDown={(e) => { if (e.key === "Enter" && otpCode.length === 6) handleVerifyOtp(); }}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground text-center">Code expires in 10 minutes</p>
                  </div>

                  <Button
                    size="lg"
                    className="w-full font-bold"
                    onClick={handleVerifyOtp}
                    disabled={otpVerifying || otpCode.length !== 6}
                  >
                    {otpVerifying ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying…</> : "Verify Code"}
                  </Button>

                  <button
                    className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => { setOtpSent(false); setDevCode(null); setOtpCode(""); }}
                    disabled={otpSending}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Resend code
                  </button>
                </div>
              )}

              <button
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                onClick={() => { setStep(1); setOtpSent(false); setOtpCode(""); setDevCode(null); setOtpId(null); }}
              >
                ← Back to Team Details
              </button>
            </CardContent>
          </Card>
        )}

        {/* ══════════ STEP 3: Add Players ══════════ */}
        {step === 3 && (
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
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Register Players
                  </span>
                  <span className={`text-sm font-semibold tabular-nums ${rows.length >= MAX_PLAYERS ? "text-destructive" : "text-muted-foreground"}`}>
                    {rows.length} / {MAX_PLAYERS}
                  </span>
                </CardTitle>
                <CardDescription>
                  Min {MIN_PLAYERS} players required · Max {MAX_PLAYERS} · Manager can also be a player.
                </CardDescription>
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
                {rows.length >= MAX_PLAYERS && (
                  <p className="text-center text-xs text-muted-foreground">Maximum {MAX_PLAYERS} players reached</p>
                )}
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
