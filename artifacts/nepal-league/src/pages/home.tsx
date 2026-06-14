import {
  useListTeams,
  useListMatches,
  useGetStandings,
  useGetActiveTournament,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays, MapPin, Clock, ArrowRight, Users,
  Trophy, Facebook, Mail, Phone, UserPlus, Activity,
} from "lucide-react";
import { Link } from "wouter";
import { differenceInDays, differenceInHours, differenceInMinutes, format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

const APP_URL = "http://kokkolasoccerboys.cc/";

function parseTournamentDate(date: string, kickoffTime: string | null | undefined): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, min] = (kickoffTime ?? "10:00").split(":").map(Number);
  return new Date(year, month - 1, day, hour, min, 0);
}

function Countdown({ target }: { target: Date }) {
  const now = new Date();
  if (target <= now) return null;
  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  const minutes = differenceInMinutes(target, now) % 60;

  return (
    <div className="flex flex-wrap justify-center gap-4 md:gap-6">
      {[
        { value: days, label: "Days" },
        { value: hours, label: "Hours" },
        { value: minutes, label: "Minutes" },
      ].map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center">
          <div className="bg-primary text-primary-foreground font-black text-3xl md:text-5xl w-20 md:w-28 h-20 md:h-28 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 tabular-nums">
            {String(value).padStart(2, "0")}
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { data: allTeams } = useListTeams();
  const { data: standings } = useGetStandings();
  const { data: liveMatches } = useListMatches({ status: "live" });
  const { data: tournament } = useGetActiveTournament();

  const registeredIds = new Set((standings ?? []).map((s) => s.teamId));
  const registeredTeams = (allTeams ?? []).filter((t) => registeredIds.has(t.id));

  const tournamentDate = tournament
    ? parseTournamentDate(tournament.date, tournament.kickoffTime)
    : new Date(2026, 5, 28, 10, 0, 0);
  const tournamentStarted = tournamentDate <= new Date();

  const displayDate = tournament
    ? format(parseTournamentDate(tournament.date, null), "d MMMM yyyy")
    : "28 June 2026";
  const displayVenue = tournament
    ? [tournament.venue, tournament.city].filter(Boolean).join(", ")
    : "Santahaka Tekonurmikenttä, Kokkola";
  const displayName = tournament?.name ?? "Ostrobothnia Nepal Super League 2026";
  const displayShortName = tournament?.shortName ?? "ONSL 2026";
  const displayKickoff = tournament?.kickoffTime ?? "10:00";
  const displayFormat = tournament?.format ?? "7-a-side";
  const displayMaxTeams = tournament?.maxTeams ?? 5;
  const displayDescription = tournament?.description ??
    `The ${displayName} is a one-day ${displayMaxTeams}-team football tournament bringing together Nepali football clubs from across Ostrobothnia, Finland. Hosted and organised by Kokkola Soccer Boys at ${tournament?.venue ?? "Santahaka Tekonurmikenttä"}, ${tournament?.city ?? "Kokkola"} on ${displayDate}.`;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Live alert */}
      {liveMatches && liveMatches.length > 0 && (
        <Link href="/live">
          <div className="bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              <span className="font-bold uppercase tracking-wider">
                {liveMatches.length} Live Match{liveMatches.length > 1 ? "es" : ""} Happening Now
              </span>
            </div>
            <ArrowRight className="h-5 w-5" />
          </div>
        </Link>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-primary/5 pointer-events-none" />
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/5 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-primary/5 pointer-events-none" />

        <div className="relative p-6 md:p-12 flex flex-col items-center text-center space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary font-bold uppercase tracking-widest px-4 py-1.5 text-xs">
              🏆 Hosting the Tournament
            </Badge>
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 font-bold uppercase tracking-widest px-4 py-1.5 text-xs bg-yellow-500/10">
              ⭐ Defending Champions
            </Badge>
          </div>

          {/* Logo */}
          <img
            src="/ksb-logo.jpg"
            alt="Kokkola Soccer Boys"
            className="h-32 w-32 md:h-44 md:w-44 object-contain rounded-full shadow-xl ring-4 ring-primary/25"
          />

          {/* Club name */}
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase italic leading-none">
              Kokkola Soccer Boys
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-2 font-medium uppercase tracking-wider">
              presents
            </p>
          </div>

          {/* League name */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-primary leading-tight">
              {displayName}
            </h2>
          </div>

          {/* Event details */}
          <div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-full">
              <CalendarDays className="h-4 w-4 text-primary" />
              {displayDate}
            </span>
            <span className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-full">
              <MapPin className="h-4 w-4 text-primary" />
              {displayVenue}
            </span>
            <span className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-full">
              <Users className="h-4 w-4 text-primary" />
              {registeredTeams.length}/{displayMaxTeams} Teams · Round-Robin
            </span>
          </div>

          {/* Countdown */}
          {!tournamentStarted && (
            <div className="w-full space-y-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" /> Tournament starts in
              </p>
              <Countdown target={tournamentDate} />
            </div>
          )}
        </div>
      </div>

      {/* About the tournament */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-sm">
              <Trophy className="h-5 w-5" />
              About the Tournament
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displayDescription}
            </p>
            <ul className="text-sm space-y-1.5 text-muted-foreground">
              {[
                `Round-robin format — every team plays each other`,
                `${displayFormat} football`,
                `Kick-off at ${displayKickoff} · Finals in the afternoon`,
                "Live scores & stats on this app",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/about">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline cursor-pointer">
                Full rules & tournament info <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-sm">
              <MapPin className="h-5 w-5" />
              Venue
            </div>
            <div>
              <p className="font-bold text-lg">{tournament?.venue ?? "Santahaka Tekonurmikenttä"}</p>
              <p className="text-sm text-muted-foreground">{tournament?.city ?? "Kokkola, Finland"}</p>
            </div>
            <div className="rounded-xl overflow-hidden border h-40 bg-muted flex items-center justify-center">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${tournament?.venue ?? "Santahaka Tekonurmikenttä"} ${tournament?.city ?? "Kokkola Finland"}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
              >
                <MapPin className="h-8 w-8" />
                Open in Google Maps
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Free entry · All matches on {displayDate}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Participating teams */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black uppercase tracking-tight">Participating Teams</h2>
          <Link href="/teams">
            <span className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>

        {registeredTeams.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No teams registered yet</p>
              <p className="text-sm mt-1">Teams will appear here once they register their squad.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {registeredTeams.map((team) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer group overflow-hidden">
                  <div className="h-1.5 w-full" style={{ backgroundColor: team.primaryColor }} />
                  <CardContent className="p-4 flex items-center gap-3">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="h-12 w-12 rounded-full object-contain flex-shrink-0 border"
                      />
                    ) : (
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                        style={{ backgroundColor: team.primaryColor }}
                      >
                        {team.shortName}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{team.name}</p>
                      <p className="text-xs text-muted-foreground">{team.shortName}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight mb-4">Tournament Hub</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/fixtures", icon: CalendarDays, label: "Fixtures" },
            { href: "/standings", icon: Trophy, label: "Standings" },
            { href: "/live", icon: Activity, label: "Live Scores" },
            { href: "/teams", icon: Users, label: "Teams" },
            { href: "/results", icon: ArrowRight, label: "Results" },
            { href: "/register", icon: UserPlus, label: "Register Team", highlight: true },
          ].map(({ href, icon: Icon, label, highlight }) => (
            <Link key={href} href={href}>
              <Card className={`hover:border-primary cursor-pointer transition-colors group ${highlight ? "border-primary/40 bg-primary/5" : ""}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${highlight ? "bg-primary/10 text-primary" : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`font-bold text-sm ${highlight ? "text-primary" : ""}`}>{label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Register CTA */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden relative">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 pointer-events-none" />
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-sm">
              <UserPlus className="h-5 w-5" />
              Register Your Team
            </div>
            <h3 className="text-xl md:text-2xl font-black">Is your club joining {displayShortName}?</h3>
            <p className="text-muted-foreground text-sm">
              Register your team and squad before the tournament. You'll need a team manager email for OTP verification and at least 7 players.
            </p>
          </div>
          <Link href="/register">
            <div className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap">
              Register Now <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Share / QR */}
      <Card className="border-dashed">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-xl shadow-sm flex-shrink-0">
            <QRCodeSVG
              value={APP_URL}
              size={120}
              bgColor="#ffffff"
              fgColor="#111827"
              level="M"
              imageSettings={{
                src: "/ksb-logo.jpg",
                x: undefined,
                y: undefined,
                height: 28,
                width: 28,
                excavate: true,
              }}
            />
          </div>
          <div className="text-center md:text-left space-y-2">
            <h3 className="font-bold text-lg">Share with your teammates</h3>
            <p className="text-muted-foreground text-sm">
              Scan to follow live scores, fixtures and standings during the tournament day.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <a href={APP_URL} target="_blank" rel="noopener noreferrer"
                className="text-primary text-sm font-medium hover:underline break-all">
                {APP_URL}
              </a>
            </div>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-1">
              <a href="https://www.facebook.com/people/Kokkola-Soccer-Boys/61589834992626/"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Facebook className="h-3.5 w-3.5" /> Follow us on Facebook
              </a>
              <a href="mailto:ksoccerboys@gmail.com"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-3.5 w-3.5" /> ksoccerboys@gmail.com
              </a>
              <a href="tel:+358413174494"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="h-3.5 w-3.5" /> +358 413 174 494
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
