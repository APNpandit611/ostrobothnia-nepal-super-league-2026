import { useGetActiveTournament } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Users, Clock, Trophy, Shield, Info, CheckCircle2 } from "lucide-react";

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="font-semibold text-sm mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function About() {
  const { data: tournament, isLoading, isError } = useGetActiveTournament();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !tournament) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Info className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>Tournament information not available yet.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    active: "bg-green-500/10 text-green-400 border-green-500/30",
    completed: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`text-xs font-bold uppercase tracking-wider px-3 py-1 ${statusColors[tournament.status] ?? ""}`}>
            {tournament.status}
          </Badge>
          {tournament.shortName && (
            <Badge variant="secondary" className="text-xs font-mono">
              {tournament.shortName}
            </Badge>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
          {tournament.name}
        </h1>
        {tournament.description && (
          <p className="text-muted-foreground leading-relaxed">{tournament.description}</p>
        )}
      </div>

      {/* Key info grid */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard icon={Calendar} label="Date" value={new Date(tournament.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
        <InfoCard icon={Clock} label="Kick-off" value={tournament.kickoffTime ?? "TBC"} />
        <InfoCard icon={MapPin} label="Venue" value={`${tournament.venue}${tournament.city ? `, ${tournament.city}` : ""}`} />
        <InfoCard icon={Users} label="Format" value={`${tournament.format} · ${tournament.maxTeams ?? 5} teams`} />
      </div>

      {/* Rules */}
      {tournament.rules && tournament.rules.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black uppercase tracking-wide">Rules of the Game</h2>
          </div>
          <Card>
            <CardContent className="p-0">
              <ol className="divide-y">
                {tournament.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="flex-shrink-0 text-xs font-black text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prizes */}
      {tournament.prizes && tournament.prizes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-black uppercase tracking-wide">Awards & Prizes</h2>
          </div>
          <div className="space-y-2">
            {tournament.prizes.map((prize, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border">
                <CheckCircle2 className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <span className="text-sm font-medium">{prize}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organiser */}
      <div className="text-center pt-2 pb-6 text-xs text-muted-foreground">
        Organised by <span className="font-semibold text-foreground">Kokkola Soccer Boys</span>
      </div>
    </div>
  );
}
