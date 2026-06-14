import { useListPublishedAnnouncements, useGetActiveTournament } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone, CalendarDays, Calendar, MapPin, Clock, Users,
  ListChecks, Award,
} from "lucide-react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  "Match Update": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Tournament: "bg-primary/15 text-primary border-primary/20",
  Training: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  Membership: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

function EventInfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border">
      <div className="p-1.5 rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="font-semibold text-sm mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Announcements() {
  const { data: announcements, isLoading } = useListPublishedAnnouncements();
  const { data: tournament } = useGetActiveTournament();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" /> News & Events
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Latest news, tournament info, and updates from Kokkola Soccer Boys
        </p>
      </div>

      {/* Upcoming Event */}
      {tournament && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Upcoming Event</h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="font-bold text-base">{tournament.name}</p>
          <div className="grid grid-cols-2 gap-2">
            <EventInfoCard
              icon={Calendar}
              label="Date"
              value={new Date(tournament.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
            />
            <EventInfoCard icon={Clock} label="Kick-off" value={tournament.kickoffTime ?? "TBC"} />
            <EventInfoCard
              icon={MapPin}
              label="Venue"
              value={`${tournament.venue}${tournament.city ? `, ${tournament.city}` : ""}`}
            />
            <EventInfoCard icon={Users} label="Format" value={`${tournament.format} · ${tournament.maxTeams ?? 5} teams`} />
          </div>
          {tournament.description && (
            <p className="text-sm text-muted-foreground leading-relaxed pl-3 border-l border-border">{tournament.description}</p>
          )}
        </div>
      )}

      {/* Tournament Rules */}
      {tournament?.rules && tournament.rules.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <ListChecks className="h-4 w-4 text-primary" /> Tournament Rules
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <ol className="space-y-2">
            {tournament.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-black flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{rule}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Prizes */}
      {tournament?.prizes && tournament.prizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Award className="h-4 w-4 text-yellow-500" /> Prizes
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <ol className="space-y-2">
            {tournament.prizes.map((prize, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/15 text-yellow-500 text-xs font-black flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{prize}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Announcements */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Announcements</h2>
        <div className="flex-1 h-px bg-border" />
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
