import { useState, useEffect } from "react";
import {
  useGetClubSettings,
  useUpdateClubSettings,
  getGetClubSettingsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, X, PlusCircle, ChevronLeft, BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function AdminClubSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useGetClubSettings();
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setParagraphs(settings.storyParagraphs ?? []);
      setDirty(false);
    }
  }, [settings]);

  const updateMutation = useUpdateClubSettings({
    mutation: {
      onSuccess: () => {
        toast({ title: "About page saved!" });
        queryClient.invalidateQueries({ queryKey: getGetClubSettingsQueryKey() });
        setDirty(false);
      },
      onError: () => toast({ variant: "destructive", title: "Save failed" }),
    },
  });

  const update = (i: number, val: string) => {
    const next = [...paragraphs];
    next[i] = val;
    setParagraphs(next);
    setDirty(true);
  };

  const remove = (i: number) => {
    setParagraphs(paragraphs.filter((_, j) => j !== i));
    setDirty(true);
  };

  const add = () => {
    setParagraphs([...paragraphs, ""]);
    setDirty(true);
  };

  const save = () => {
    updateMutation.mutate({ data: { storyParagraphs: paragraphs.filter(Boolean) } });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4 mr-1" /> Dashboard</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase italic flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> About Page
          </h1>
          <p className="text-muted-foreground text-sm">Edit the story paragraphs shown on the About Us page</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Club Story Paragraphs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Each paragraph appears as a separate block of text in the "Our Story" section of the About page. Add, edit, reorder, or remove paragraphs here.
              </p>

              <div className="space-y-3">
                {paragraphs.map((p, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-xs text-muted-foreground font-bold w-5 pt-2.5 flex-shrink-0 text-right">{i + 1}.</span>
                    <textarea
                      rows={3}
                      value={p}
                      onChange={e => update(i, e.target.value)}
                      placeholder="Write a paragraph about the club's history, achievements, or values…"
                      className="flex-1 min-h-[72px] resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive flex-shrink-0 mt-0.5"
                      onClick={() => remove(i)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={add}>
                <PlusCircle className="h-3.5 w-3.5" /> Add Paragraph
              </Button>

              <div className="pt-2 border-t flex items-center gap-3">
                <Button onClick={save} disabled={!dirty || updateMutation.isPending} className="gap-1.5">
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
                {dirty && (
                  <span className="text-xs text-muted-foreground">Unsaved changes</span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Tip:</span> The static parts of the About page (club values, contact info, identity strip) stay fixed. Only the "Our Story" paragraphs are editable here. If no paragraphs are saved, a default story will be shown.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
