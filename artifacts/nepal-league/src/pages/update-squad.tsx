import { useState, useEffect } from "react";
import { useSearch, Link } from "wouter";
import { useListTeams, useListPlayers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, CheckCircle2, ChevronRight, Shield, Users,
  UserPlus, Trash2, Mail, KeyRound, RefreshCw, Pencil,
} from "lucide-react";

const POSITIONS = ["GK", "C", "V.C", "Player", "Manager"];
const MIN_PLAYERS = 7;
const MAX_PLAYERS = 15;

interface PlayerRow {
  localId: string;
  name: string;
  number: string;
  position: string;
}

function newRow(): PlayerRow {
  return { localId: crypto.randomUUID(), name: "", number: "", position: "" };
}

async function sendOtp(contact: string): Promise<{ id: string; devCode?: string }> {
  const res = await fetch("/api/register/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contact, type: "email" }),
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

async function submitSquadUpdate(teamId: number, otpId: string, players: PlayerRow[]): Promise<void> {
  const res = await fetch("/api/register/update-squad", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teamId,
      otpId,
      players: players.map(p => ({
        name: p.name.trim(),
        number: p.number ? parseInt(p.number) : null,
        position: p.position || null,
      })),
    }),
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to update squad");
  }
}

const steps = ["Select Team", "Verify Identity", "Update Squad"];

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
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
}

export default function UpdateSquad() {
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preTeamId = params.get("team") ? parseInt(params.get("team")!) : null;

  const { data: teams, isLoading: teamsLoading } = useListTeams();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [teamId, setTeamId] = useState<number | null>(preTeamId);
  const [email, setEmail] = useState("");

  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const [rows, setRows] = useState<PlayerRow[]>(Array.from({ length: MIN_PLAYERS }, newRow));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: currentPlayers, isLoading: playersLoading } = useListPlayers(teamId ?? 0);
  const selectedTeam = teams?.find(t => t.id === teamId);

  useEffect(() => {
    if (step === 3 && currentPlayers) {
      if (currentPlayers.length > 0) {
        setRows(currentPlayers.map(p => ({
          localId: crypto.randomUUID(),
          name: p.name,
          number: p.number?.toString() ?? "",
          position: p.position ?? "",
        })));
      } else {
        setRows(Array.from({ length: MIN_PLAYERS }, newRow));
      }
    }
  }, [step, currentPlayers]);

  const handleSendOtp = async () => {
    if (!teamId) { toast({ variant: "destructive", title: "Please select your team" }); return; }
    if (!email.trim()) { toast({ variant: "destructive", title: "Email address is required" }); return; }
    setOtpSending(true);
    try {
      const result = await sendOtp(email.trim());
      setOtpId(result.id);
      setOtpSent(true);
      setOtpCode("");
      if (result.devCode) setDevCode(result.devCode);
      toast({ title: "Code sent!", description: `Check ${email.trim()}` });
      setStep(2);
    } catch {
      toast({ variant: "destructive", title: "Failed to send code. Try again." });
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
        toast({ title: "Identity verified!", description: "Now update your squad." });
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
    if (!teamId || !otpId) return;
    const validRows = rows.filter(r => r.name.trim());
    if (validRows.length < MIN_PLAYERS) {
      toast({ variant: "destructive", title: `At least ${MIN_PLAYERS} players required`, description: `You have ${validRows.length}.` });
      return;
    }
    setSubmitting(true);
    try {
      await submitSquadUpdate(teamId, otpId, validRows);
      setSubmitted(true);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to save squad", description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateRow = (localId: string, field: keyof Omit<PlayerRow, "localId">, value: string) => {
    setRows(rs => rs.map(r => r.localId === localId ? { ...r, [field]: value } : r));
  };
  const removeRow = (localId: string) => {
    if (rows.length <= 1) return;
    setRows(rs => rs.filter(r => r.localId !== localId));
  };
  const addRow = () => {
    if (rows.length >= MAX_PLAYERS) return;
    setRows(rs => [...rs, newRow()]);
  };

  if (submitted && selectedTeam) {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-20 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Squad Updated!</h2>
          <p className="text-muted-foreground mt-2">
            <span className="font-bold text-foreground">{selectedTeam.name}</span>'s squad has been saved for the upcoming tournament.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/teams"><Button variant="outline"><Users className="h-4 w-4 mr-2" /> View All Squads</Button></Link>
          <Link href="/"><Button>Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-3">
          <Pencil className="h-7 w-7 text-primary" /> Update Squad
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Already registered? Update your team's player list for the upcoming tournament.
        </p>
      </div>

      <StepIndicator step={step} />

      {/* ── Step 1: Select team & email ──────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label>Your Team</Label>
              {teamsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading teams…
                </div>
              ) : (
                <Select
                  value={teamId?.toString() ?? ""}
                  onValueChange={val => setTeamId(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.primaryColor ?? "#888" }} />
                          {t.name} ({t.shortName})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> Manager Email
              </Label>
              <Input
                id="manager-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSendOtp(); }}
              />
              <p className="text-xs text-muted-foreground">
                We'll send a verification code to confirm your identity.
              </p>
            </div>

            <Button onClick={handleSendOtp} disabled={otpSending || !teamId || !email.trim()} className="w-full">
              {otpSending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
                : <><Mail className="h-4 w-4 mr-2" /> Send Verification Code</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Verify OTP ───────────────────────────────────────── */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm flex items-start gap-3">
              <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p>A 6-digit code was sent to <span className="font-bold">{email}</span>.</p>
                <p className="text-muted-foreground text-xs mt-1">Check your inbox (and spam folder). Code expires in 10 minutes.</p>
              </div>
            </div>

            {devCode && (
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-4 py-3 text-sm">
                <span className="font-bold text-yellow-600 dark:text-yellow-400">Dev mode — code: </span>
                <span className="font-mono font-black tracking-widest text-lg">{devCode}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="otp-code" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Verification Code
              </Label>
              <Input
                id="otp-code"
                placeholder="000000"
                value={otpCode}
                maxLength={6}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => { if (e.key === "Enter") handleVerifyOtp(); }}
                className="font-mono text-center text-xl tracking-widest"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleVerifyOtp} disabled={otpVerifying || otpCode.length !== 6} className="flex-1">
                {otpVerifying
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</>
                  : "Verify & Continue"}
              </Button>
            </div>

            <button
              onClick={async () => {
                setOtpSent(false);
                setOtpCode("");
                setDevCode(null);
                await handleSendOtp();
              }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 py-1"
            >
              <RefreshCw className="h-3 w-3" /> Resend code
            </button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Squad editor ─────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          {selectedTeam && (
            <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: `${selectedTeam.primaryColor ?? "#888"}40`, background: `${selectedTeam.primaryColor ?? "#888"}08` }}>
              <Shield className="h-5 w-5 flex-shrink-0" style={{ color: selectedTeam.primaryColor ?? "#888" }} />
              <div>
                <p className="font-bold text-sm">{selectedTeam.name}</p>
                <p className="text-xs text-muted-foreground">Edit your squad below. Changes replace the full current list.</p>
              </div>
            </div>
          )}

          {playersLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-[2fr_1fr_1.5fr_auto] gap-2 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">#</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Position</span>
                  <span />
                </div>

                {rows.map((row, i) => (
                  <div key={row.localId} className="grid grid-cols-[2fr_1fr_1.5fr_auto] gap-2 items-center">
                    <Input
                      placeholder={`Player ${i + 1}`}
                      value={row.name}
                      onChange={e => updateRow(row.localId, "name", e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Input
                      placeholder="—"
                      value={row.number}
                      onChange={e => updateRow(row.localId, "number", e.target.value.replace(/\D/g, ""))}
                      className="h-9 text-sm text-center"
                      maxLength={2}
                    />
                    <Select value={row.position} onValueChange={val => updateRow(row.localId, "position", val)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">—</SelectItem>
                        {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => removeRow(row.localId)}
                      disabled={rows.length <= 1}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addRow}
                  disabled={rows.length >= MAX_PLAYERS}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserPlus className="h-4 w-4" /> Add player ({rows.length}/{MAX_PLAYERS})
                </button>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>{rows.filter(r => r.name.trim()).length} of {MIN_PLAYERS}+ players filled</span>
            <span className={rows.filter(r => r.name.trim()).length >= MIN_PLAYERS ? "text-primary font-semibold" : "text-destructive font-semibold"}>
              {rows.filter(r => r.name.trim()).length >= MIN_PLAYERS ? "✓ Minimum met" : `Need ${MIN_PLAYERS - rows.filter(r => r.name.trim()).length} more`}
            </span>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || rows.filter(r => r.name.trim()).length < MIN_PLAYERS}
            className="w-full"
            size="lg"
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving squad…</>
              : <><CheckCircle2 className="h-4 w-4 mr-2" /> Save Squad</>}
          </Button>
        </div>
      )}
    </div>
  );
}
