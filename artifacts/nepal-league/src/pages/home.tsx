import { useMemo } from "react";
import {
  useListTeams,
  useListMatches,
  useGetStandings,
  useGetActiveTournament,
} from "@workspace/api-client-react";
import type { Match } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays, MapPin, Clock, ArrowRight, Users,
  Trophy, Facebook, Mail, Phone, UserPlus, Activity,
  Crown, Goal,
} from "lucide-react";
import { Link } from "wouter";
import { differenceInDays, differenceInHours, differenceInMinutes, format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { TeamLogo } from "@/components/team-logo";

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

/* ─── Featured Match Card ───────────────────────────────────────────────── */
function FeaturedMatch({ match }: { match: Match }) {
  const isFinal = match.matchType === "final";
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const isUpcoming = match.status === "upcoming";

  const linkHref = isLive ? "/live" : isFinished ? "/results" : "/fixtures";

  return (
    <Link href={linkHref}>
      <Card
        className={`overflow-hidden cursor-pointer transition-transform hover:scale-[1.01] shadow-lg ${
          isFinal
            ? "border-2 border-amber-500/60 shadow-amber-500/15"
            : isLive
            ? "border-2 border-primary/60 shadow-primary/20"
            : "border-2 border-emerald-500/60 shadow-emerald-500/15"
        }`}
      >
        <CardContent className="p-0">
          {/* Top bar */}
          <div
            className={`flex items-center justify-between px-4 py-2 text-sm font-bold uppercase tracking-widest text-white ${
              isFinal
                ? "bg-amber-500"
                : isLive
                ? "bg-primary"
                : "bg-emerald-500"
            }`}
          >
            <div className="flex items-center gap-2">
              {isFinal && <Crown className="h-4 w-4" />}
              {isLive && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                </span>
              )}
              {isFinal ? "Championship Final" : isLive ? "Live Now" : isFinished ? "Match Finished" : "Next Match"}
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Pitch {match.pitch}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(new Date(match.scheduledTime), "HH:mm")}
              </span>
            </div>
          </div>

          {/* Teams & Score */}
          <div className="px-4 py-5 md:py-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-6">
            {/* Home */}
            <div className="flex items-center justify-end gap-3 min-w-0">
              <TeamLogo
                name={match.homeTeamName}
                shortName={match.homeTeamShortName}
                logoUrl={match.homeTeamLogo}
                size="lg"
              />
              <h2 className="text-xl md:text-2xl font-black truncate min-w-0">{match.homeTeamName}</h2>
            </div>

            {/* Score / VS */}
            <div className="text-center">
              {isUpcoming ? (
                <div className="bg-muted px-5 py-2 rounded-lg font-mono text-2xl font-bold tracking-widest text-muted-foreground">
                  VS
                </div>
              ) : (
                <div className="bg-background border-2 border-border shadow-inner px-5 py-2 rounded-xl font-mono text-4xl md:text-5xl font-black tracking-tighter">
                  {match.homeScore} – {match.awayScore}
                </div>
              )}
              {isFinished && (
                <p className="text-xs font-medium text-muted-foreground mt-1.5 uppercase tracking-wider">
                  Full Time
                </p>
              )}
              {isLive && (
                <p className="text-xs font-medium text-primary mt-1.5 uppercase tracking-wider animate-pulse">
                  In Progress
                </p>
              )}
            </div>

            {/* Away */}
            <div className="flex items-center justify-start gap-3 min-w-0">
              <h2 className="text-xl md:text-2xl font-black text-left truncate min-w-0">{match.awayTeamName}</h2>
              <TeamLogo
                name={match.awayTeamName}
                shortName={match.awayTeamShortName}
                logoUrl={match.awayTeamLogo}
                size="lg"
              />
            </div>
          </div>

          {/* Bottom strip */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {match.matchType === "final" ? "Final" : `Match ${match.matchNumber}`}
              </span>
              {isUpcoming && (
                <span className="text-muted-foreground/60">
                  {format(new Date(match.scheduledTime), "HH:mm")}
                </span>
              )}
            </div>
            <span className="font-semibold text-primary flex items-center gap-1">
              View details <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Home() {
  const { data: allTeams } = useListTeams();
  const { data: standings } = useGetStandings();
  const { data: liveMatches } = useListMatches({ status: "live" });
  const { data: allMatches } = useListMatches();
  const { data: tournament } = useGetActiveTournament();

  const registeredIds = new Set((standings ?? []).map((s) => s.teamId));
  const registeredTeams = (allTeams ?? []).filter((t) => registeredIds.has(t.id));

  // Champion banner: final match finished → show winner
  const finalMatch = (allMatches ?? []).find((m) => m.matchType === "final" && m.status === "finished");
  const winnerTeam = finalMatch
    ? (finalMatch.homeScore ?? 0) > (finalMatch.awayScore ?? 0)
      ? allTeams?.find((t) => t.id === finalMatch.homeTeamId)
      : (finalMatch.homeScore ?? 0) < (finalMatch.awayScore ?? 0)
        ? allTeams?.find((t) => t.id === finalMatch.awayTeamId)
        : null
    : null;

  const tournamentDate = tournament
    ? parseTournamentDate(tournament.date, tournament.kickoffTime)
    : new Date(2026, 5, 28, 10, 0, 0);
  const tournamentStarted = tournamentDate <= new Date();

  // Featured match: live > final finished > upcoming (by matchNumber)
  const featuredMatch = useMemo(() => {
    const list = allMatches ?? [];
    const live = list.find((m) => m.status === "live");
    if (live) return live;
    const finalFinished = list.find((m) => m.matchType === "final" && m.status === "finished");
    if (finalFinished) return finalFinished;
    const upcoming = list
      .filter((m) => m.status === "upcoming")
      .sort((a, b) => a.matchNumber - b.matchNumber);
    return upcoming[0] ?? null;
  }, [allMatches]);

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
            src="/onsl-logo.jpeg"
            alt="ONSL 2026"
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

      {/* Featured Match */}
      {featuredMatch && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary" />
              {featuredMatch.status === "live"
                ? "Match Live Now"
                : featuredMatch.matchType === "final" && featuredMatch.status === "finished"
                ? "Championship Final"
                : "Next Match"}
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <FeaturedMatch match={featuredMatch} />
        </div>
      )}

      {/* Champion Banner */}
      {winnerTeam && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 shadow-xl shadow-amber-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-transparent to-amber-500/5 pointer-events-none" />
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-amber-500/5 pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-amber-500/5 pointer-events-none" />
          <div className="relative p-6 md:p-12 flex flex-col items-center text-center space-y-5">
            <div className="flex items-center gap-2 text-amber-600 font-black uppercase tracking-widest text-sm">
              <Crown className="h-5 w-5" />
              Championship Winner
              <Crown className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <TeamLogo
                size="lg"
                name={winnerTeam.name}
                shortName={winnerTeam.shortName}
                logoUrl={winnerTeam.logoUrl}
              />
              <div className="text-left">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tight leading-none">
                  {winnerTeam.name}
                </h2>
                <p className="text-amber-600 font-black uppercase tracking-widest text-sm mt-2">
                  {winnerTeam.shortName} — ONSL 2026 Champions
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-full">
                <Trophy className="h-4 w-4 text-amber-500" />
                Champion of Ostrobothnia Nepal Super League 2026
              </span>
            </div>
            <p className="text-muted-foreground max-w-md text-sm">
              Congratulations to {winnerTeam.name} for winning the championship final!
              A brilliant display of football throughout the tournament.
            </p>
          </div>
        </div>
      )}

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
          <Link href="/register-team">
            <div className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap">
              Register Now <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </CardContent>
      </Card>

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
            <Link href="/announcements">
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

      {/* All Matches */}
      {allMatches && allMatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Goal className="h-5 w-5 text-primary" />
              All Matches
            </h2>
            <Link href="/fixtures">
              <span className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                Full schedule <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
          <div className="space-y-3">
            {allMatches
              .slice()
              .sort((a, b) => {
                if (a.matchType === "final" && b.matchType !== "final") return -1;
                if (b.matchType === "final" && a.matchType !== "final") return 1;
                return a.matchNumber - b.matchNumber;
              })
              .map((match) => {
                const isFinal = match.matchType === "final";
                const isLive = match.status === "live";
                const isFinished = match.status === "finished";
                const isUpcoming = match.status === "upcoming";
                const linkHref = isLive ? "/live" : isFinished ? "/results" : "/fixtures";
                return (
                  <Link key={match.id} href={linkHref}>
                    <Card
                      className={`overflow-hidden cursor-pointer transition-colors hover:border-primary/50 ${
                        isFinal
                          ? "border-amber-500/40 shadow-sm shadow-amber-500/10"
                          : isLive
                          ? "border-primary/40 shadow-sm shadow-primary/10"
                          : ""
                      }`}
                    >
                      <CardContent className="p-0">
                        {/* Header bar */}
                        <div className={`flex items-center justify-between px-4 py-2 text-xs font-bold uppercase tracking-wider text-white ${
                          isFinal ? "bg-amber-500" : isLive ? "bg-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(match.scheduledTime), "HH:mm")}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Pitch {match.pitch}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isFinal && <Crown className="h-3 w-3" />}
                            {isLive && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                              </span>
                            )}
                            {isFinal ? "Final" : isLive ? "Live" : isFinished ? "Full Time" : "Upcoming"}
                          </div>
                        </div>
                        {/* Teams row */}
                        <div className="px-4 py-5 md:py-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
                          {/* Home */}
                          <div className="flex items-center justify-end gap-3 min-w-0">
                            <div className="text-right min-w-0 space-y-0.5">
                              <p className="font-bold text-sm md:text-lg truncate leading-tight">{match.homeTeamName}</p>
                              <p className="text-xs text-muted-foreground hidden sm:block">{match.homeTeamShortName}</p>
                            </div>
                            <TeamLogo
                              name={match.homeTeamName}
                              shortName={match.homeTeamShortName}
                              logoUrl={match.homeTeamLogo}
                              size="lg"
                            />
                          </div>
                          {/* Score / VS */}
                          <div className="text-center flex-shrink-0 px-2">
                            {isUpcoming ? (
                              <div className="bg-muted px-4 py-2 rounded-lg font-mono text-lg font-bold tracking-[0.2em] text-muted-foreground">
                                VS
                              </div>
                            ) : (
                              <div className="bg-background border-2 border-border shadow-inner px-4 py-2 rounded-xl font-mono text-3xl md:text-4xl font-black tracking-widest">
                                {match.homeScore} – {match.awayScore}
                              </div>
                            )}
                          </div>
                          {/* Away */}
                          <div className="flex items-center justify-start gap-3 min-w-0">
                            <TeamLogo
                              name={match.awayTeamName}
                              shortName={match.awayTeamShortName}
                              logoUrl={match.awayTeamLogo}
                              size="lg"
                            />
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-bold text-sm md:text-lg truncate leading-tight">{match.awayTeamName}</p>
                              <p className="text-xs text-muted-foreground hidden sm:block">{match.awayTeamShortName}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

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
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <Card className="hover:border-primary cursor-pointer transition-colors group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg transition-colors bg-muted group-hover:bg-primary/10 group-hover:text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-sm">{label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

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
                src: "/ksb-logo.png",
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
              <a href="mailto:info@kokkolasoccerboys.cc"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-3.5 w-3.5" /> info@kokkolasoccerboys.cc
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
