import { Shield, Users, MapPin, Star, Heart, Trophy, Mail, Phone, CalendarDays, Clock, ListChecks, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useGetActiveTournament } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

const VALUES = [
  {
    icon: Heart,
    title: "Community",
    description:
      "Founded by Nepalese living in Kokkola, KSB is more than a football club — it is a gathering place for culture, friendship, and belonging.",
  },
  {
    icon: Shield,
    title: "Sportsmanship",
    description:
      "We play with passion and respect. On and off the pitch, our players represent the values of fair play and team spirit.",
  },
  {
    icon: Star,
    title: "Excellence",
    description:
      "From grassroots training to competitive tournaments, we push each other to grow as players and as people.",
  },
  {
    icon: Users,
    title: "Inclusion",
    description:
      "Everyone is welcome. KSB opens its doors to all who share a love for the beautiful game and the Nepalese community in Finland.",
  },
];

export default function About() {
  const { data: tournament, isLoading: tournamentLoading } = useGetActiveTournament();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">

      {/* Hero */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src="/ksb-logo.png"
          alt="Kokkola Soccer Boys"
          className="w-28 h-28 rounded-2xl object-contain bg-muted border p-2 flex-shrink-0"
        />
        <div className="text-center sm:text-left space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Est. Kokkola, Finland</p>
          <h1 className="text-3xl font-black tracking-tight leading-tight">
            Kokkola Soccer Boys
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            A Nepalese football club rooted in community, culture, and the love of the game — representing the Nepalese diaspora in Ostrobothnia.
          </p>
        </div>
      </div>

      {/* Story */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full" />
          <h2 className="text-xl font-black uppercase tracking-wide">Our Story</h2>
        </div>
        <div className="space-y-4 text-muted-foreground leading-relaxed pl-4 border-l border-border">
          <p>
            Kokkola Soccer Boys was born out of a simple idea: bring the Nepalese community in Kokkola together through football. What started as informal matches between friends quickly grew into an organised club with a shared identity and a green jersey to call our own.
          </p>
          <p>
            Over the years, KSB has become a cornerstone of the Nepalese community in Central Ostrobothnia — organising matches, tournaments, and social events that connect people across generations and backgrounds.
          </p>
          <p>
            In 2026, KSB proudly hosts the <span className="text-foreground font-semibold">Ostrobothnia Nepal Super League</span> — bringing together five clubs from across Finland for a day of top-level Nepalese football at Santahaka Tekonurmikenttä.
          </p>
        </div>
      </div>

      {/* Tournament Info + Rules */}
      {tournamentLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : tournament ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-primary rounded-full" />
            <h2 className="text-xl font-black uppercase tracking-wide">Tournament Info</h2>
          </div>

          {/* Quick facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: CalendarDays, label: "Date", value: new Date(tournament.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) },
              { icon: Clock, label: "Kick-off", value: tournament.kickoffTime ?? "TBC" },
              { icon: MapPin, label: "Venue", value: `${tournament.venue}${tournament.city ? `, ${tournament.city}` : ""}` },
              { icon: Users, label: "Format", value: `${tournament.format} · ${tournament.maxTeams ?? 5} teams` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/50 border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  <Icon className="h-3.5 w-3.5 text-primary" /> {label}
                </div>
                <p className="font-semibold text-sm leading-snug">{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {tournament.description && (
            <p className="text-muted-foreground leading-relaxed pl-4 border-l border-border">{tournament.description}</p>
          )}

          {/* Rules */}
          {tournament.rules && tournament.rules.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                <h3 className="font-black uppercase tracking-wide text-base">Rules</h3>
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
          {tournament.prizes && tournament.prizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <h3 className="font-black uppercase tracking-wide text-base">Prizes</h3>
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
        </div>
      ) : null}

      {/* Values */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full" />
          <h2 className="text-xl font-black uppercase tracking-wide">What We Stand For</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {VALUES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-border/60">
              <CardContent className="p-5 flex gap-4">
                <div className="p-2 rounded-xl bg-primary/10 h-fit">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Identity strip */}
      <div className="rounded-2xl border overflow-hidden">
        <div className="h-2 bg-[#16a34a]" />
        <div className="p-6 grid sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Club Colours</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-[#16a34a] border-2 border-white/20" />
              <span className="text-sm font-semibold">KSB Green</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Home Ground</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Kokkola, Finland</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Tournament</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-semibold">ONSL 2026 Hosts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full" />
          <h2 className="text-xl font-black uppercase tracking-wide">Get in Touch</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="mailto:ksoccerboys@gmail.com"
            className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border hover:border-primary transition-colors flex-1"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Email</p>
              <p className="font-semibold text-sm">ksoccerboys@gmail.com</p>
            </div>
          </a>
          <a
            href="tel:+358413174494"
            className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border hover:border-primary transition-colors flex-1"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Phone</p>
              <p className="font-semibold text-sm">+358 413 174 494</p>
            </div>
          </a>
        </div>
      </div>

    </div>
  );
}
