import { useState, useEffect } from "react";
import {
  useGetClubSettings,
  useUpdateClubSettings,
  getGetClubSettingsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Save, X, PlusCircle, ChevronLeft, BookOpen,
  Mail, Phone, MapPin, Heart, Grip,
} from "lucide-react";
import { Link } from "wouter";

const DEFAULT_VALUES = [
  { title: "Community", description: "Founded by Nepalese living in Kokkola, KSB is more than a football club — it is a gathering place for culture, friendship, and belonging." },
  { title: "Sportsmanship", description: "We play with passion and respect. On and off the pitch, our players represent the values of fair play and team spirit." },
  { title: "Excellence", description: "From grassroots training to competitive tournaments, we push each other to grow as players and as people." },
  { title: "Inclusion", description: "Everyone is welcome. KSB opens its doors to all who share a love for the beautiful game and the Nepalese community in Finland." },
];

interface ValueRow { title: string; description: string; }

export default function AdminClubSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetClubSettings();

  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [tagline, setTagline] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [homeGround, setHomeGround] = useState("");
  const [values, setValues] = useState<ValueRow[]>(DEFAULT_VALUES);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setParagraphs(settings.storyParagraphs ?? []);
      setTagline(settings.tagline ?? "");
      setEmail(settings.email ?? "");
      setPhone(settings.phone ?? "");
      setHomeGround(settings.homeGround ?? "");
      setValues(settings.values && settings.values.length > 0 ? settings.values : DEFAULT_VALUES);
      setDirty(false);
    }
  }, [settings]);

  const mark = () => setDirty(true);

  const updateMutation = useUpdateClubSettings({
    mutation: {
      onSuccess: () => {
        toast({ title: "About Us page saved!" });
        queryClient.invalidateQueries({ queryKey: getGetClubSettingsQueryKey() });
        setDirty(false);
      },
      onError: () => toast({ variant: "destructive", title: "Save failed" }),
    },
  });

  const save = () => {
    updateMutation.mutate({
      data: {
        storyParagraphs: paragraphs.filter(Boolean),
        tagline: tagline.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        homeGround: homeGround.trim() || null,
        values: values.filter((v) => v.title.trim()),
      },
    });
  };

  const updatePara = (i: number, val: string) => { const n = [...paragraphs]; n[i] = val; setParagraphs(n); mark(); };
  const removePara = (i: number) => { setParagraphs(paragraphs.filter((_, j) => j !== i)); mark(); };
  const addPara = () => { setParagraphs([...paragraphs, ""]); mark(); };

  const updateValue = (i: number, field: keyof ValueRow, val: string) => {
    const n = values.map((v, j) => j === i ? { ...v, [field]: val } : v);
    setValues(n); mark();
  };
  const removeValue = (i: number) => { setValues(values.filter((_, j) => j !== i)); mark(); };
  const addValue = () => { setValues([...values, { title: "", description: "" }]); mark(); };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4 mr-1" /> Dashboard</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase italic flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> About Us
          </h1>
          <p className="text-muted-foreground text-sm">Edit everything shown on the public About page</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {dirty && <span className="text-xs text-muted-foreground hidden sm:block">Unsaved changes</span>}
          <Button onClick={save} disabled={!dirty || updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* ── Tagline ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" /> Club Tagline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">Shown as the subtitle under the club name on the About page.</p>
              <Input
                placeholder="e.g. A Nepalese football club rooted in community, culture, and the love of the game."
                value={tagline}
                onChange={(e) => { setTagline(e.target.value); mark(); }}
              />
            </CardContent>
          </Card>

          {/* ── Contact info ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> Contact & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email</Label>
                <Input
                  type="email"
                  placeholder="e.g. info@kokkolasoccerboys.cc"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); mark(); }}
                />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone</Label>
                <Input
                  type="tel"
                  placeholder="e.g. +358 413 174 494"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); mark(); }}
                />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Home Ground / City</Label>
                <Input
                  placeholder="e.g. Kokkola, Finland"
                  value={homeGround}
                  onChange={(e) => { setHomeGround(e.target.value); mark(); }}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Our Story ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Our Story
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Each paragraph appears as a separate block in the "Our Story" section. If empty, a default story is shown.
              </p>
              <div className="space-y-3">
                {paragraphs.map((p, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-xs text-muted-foreground font-bold w-5 pt-2.5 flex-shrink-0 text-right">{i + 1}.</span>
                    <textarea
                      rows={3}
                      value={p}
                      onChange={(e) => updatePara(i, e.target.value)}
                      placeholder="Write a paragraph about the club's history, achievements, or values…"
                      className="flex-1 min-h-[72px] resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive flex-shrink-0 mt-0.5"
                      onClick={() => removePara(i)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={addPara}>
                <PlusCircle className="h-3.5 w-3.5" /> Add Paragraph
              </Button>
            </CardContent>
          </Card>

          {/* ── Club Values ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Grip className="h-4 w-4 text-primary" /> Club Values
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                These appear as cards in the "What We Stand For" section (up to 4 recommended).
              </p>
              <div className="space-y-3">
                {values.map((v, i) => (
                  <div key={i} className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Value {i + 1}</span>
                      <Button
                        type="button" variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeValue(i)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input
                        placeholder="e.g. Community"
                        value={v.title}
                        onChange={(e) => updateValue(i, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <textarea
                        rows={2}
                        value={v.description}
                        onChange={(e) => updateValue(i, "description", e.target.value)}
                        placeholder="Describe this value…"
                        className="w-full min-h-[56px] resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={addValue}>
                <PlusCircle className="h-3.5 w-3.5" /> Add Value Card
              </Button>
            </CardContent>
          </Card>

          {/* Save bar */}
          <div className="flex items-center gap-3 pt-2 pb-8">
            <Button onClick={save} disabled={!dirty || updateMutation.isPending} size="lg" className="gap-2">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
            {dirty && <span className="text-sm text-muted-foreground">You have unsaved changes</span>}
          </div>
        </>
      )}
    </div>
  );
}
