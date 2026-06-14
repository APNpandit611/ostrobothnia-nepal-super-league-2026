import { useState } from "react";
import { useSubmitClubApplication } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Heart } from "lucide-react";
import { Link } from "wouter";

const FIELD_POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward", "Any position"];

export default function JoinKsb() {
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
    submitMutation.mutate({
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone || undefined,
        dob: dob || undefined,
        position: position || undefined,
        message: message || undefined,
      },
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Application Received!</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Thanks <span className="font-semibold text-foreground">{name}</span>! We'll review your application and get back to you at{" "}
            <span className="font-semibold text-foreground">{email}</span> soon.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setName(""); setEmail(""); setPhone(""); setDob(""); setPosition(""); setMessage("");
            }}
          >
            Submit Another
          </Button>
          <Link href="/"><Button>Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Heart className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-black uppercase italic tracking-tight">Join Kokkola Soccer Boys</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Interested in joining KSB? Fill in your details and we'll be in touch.
        </p>
      </div>

      <div className="max-w-lg mx-auto">
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

              <Button
                type="submit"
                size="lg"
                className="w-full font-bold uppercase tracking-wider"
                disabled={submitMutation.isPending || !name.trim() || !email.trim()}
              >
                {submitMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending…</>
                  : <><Heart className="h-4 w-4 mr-2" /> Submit Application</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          We aim to respond within a few days. For urgent enquiries email{" "}
          <a href="mailto:ksoccerboys@gmail.com" className="underline hover:text-foreground">ksoccerboys@gmail.com</a>
        </p>

        <p className="text-center text-xs text-muted-foreground mt-2">
          Want to register a team instead?{" "}
          <Link href="/register/team" className="underline hover:text-foreground font-semibold">Register Team →</Link>
        </p>
      </div>
    </div>
  );
}
