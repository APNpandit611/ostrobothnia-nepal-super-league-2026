import { useListPublishedAnnouncements } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  "Match Update": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Tournament: "bg-primary/15 text-primary border-primary/20",
  Training: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  Membership: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

export default function Announcements() {
  const { data: announcements, isLoading } = useListPublishedAnnouncements();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" /> Announcements
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Latest news and updates from Kokkola Soccer Boys
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !announcements?.length ? (
        <div className="rounded-xl border border-dashed py-20 text-center text-muted-foreground">
          <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-semibold">No announcements yet</p>
          <p className="text-sm mt-1">Check back soon for updates from the club.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-0">
                  <div className="w-1.5 bg-primary flex-shrink-0" />
                  <div className="flex-1 p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h2 className="font-bold text-lg leading-tight">{a.title}</h2>
                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${CATEGORY_COLORS[a.category] ?? ""}`}>
                        {a.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{a.content}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{format(new Date(a.createdAt), "d MMMM yyyy")}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span>{a.author}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
