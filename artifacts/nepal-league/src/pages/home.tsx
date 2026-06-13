import { useListTeams, useListMatches, useGetStandings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays, MapPin, Clock, ArrowRight, Users,
  Trophy, Facebook, Mail, Phone, UserPlus, Activity,
  Shield, Star,
} from "lucide-react";
import { Link } from "wouter";
import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

const TOURNAMENT_DATE = new Date(2026, 5, 28, 9, 0, 0);
const APP_URL = "http://kokkolasoccerboys.cc/";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

function Countdown() {
  const now = new Date();
  const totalDays = differenceInDays(TOURNAMENT_DATE, now);
  const totalHours = differenceInHours(TOURNAMENT_DATE, now) % 24;
  const totalMinutes = differenceInMinutes(TOURNAMENT_DATE, now) % 60;
  if (TOURNAMENT_DATE <= now) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3 md:gap-5">
      {[
        { value: totalDays, label: "Days" },
        { value: totalHours, label: "Hours" },
        { value: totalMinutes, label: "Mins" },
      ].map(({ value, label }, i) => (
        <motion.div key={label} custom={i} variants={fadeUp} className="flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/40 blur-xl" />
            <div className="relative bg-gradient-to-b from-primary to-primary/80 text-primary-foreground font-black text-4xl md:text-6xl w-24 md:w-32 h-24 md:h-32 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 tabular-nums border border-primary/30">
              {String(value).padStart(2, "0")}
            </div>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mt-2">{label}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const { data: allTeams } = useListTeams();
  const { data: standings } = useGetStandings();
  const { data: liveMatches } = useListMatches({ status: "live" });

  const registeredIds = new Set((standings ?? []).map((s) => s.teamId));
  const registeredTeams = (allTeams ?? []).filter((t) => registeredIds.has(t.id));
  const now = new Date();
  const tournamentStarted = TOURNAMENT_DATE <= now;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Live alert */}
      {liveMatches && liveMatches.length > 0 && (
        <Link href="/live">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
          >
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
          </motion.div>
        </Link>
      )}

      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/10 shadow-2xl shadow-primary/5">
        {/* Football pitch background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#040d08] via-[#0a1208] to-[#050a0a]" />

        {/* Pitch circle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="w-[600px] h-[600px] rounded-full border border-white/[0.03] absolute" />
          <div className="w-[400px] h-[400px] rounded-full border border-white/[0.03] absolute" />
          <div className="w-[200px] h-[200px] rounded-full border border-white/[0.04] absolute" />
          <div className="w-full h-px bg-white/[0.03] absolute" />
          <div className="h-full w-px bg-white/[0.03] absolute" />
        </div>

        {/* Corner arcs */}
        <div className="absolute top-0 left-0 w-24 h-24 rounded-br-full border-b border-r border-white/[0.04] pointer-events-none" />
        <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full border-b border-l border-white/[0.04] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-tr-full border-t border-r border-white/[0.04] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-full border-t border-l border-white/[0.04] pointer-events-none" />

        {/* Green glow at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 px-6 py-10 md:py-16 flex flex-col items-center text-center space-y-6">
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-2"
          >
            <Badge variant="outline" className="border-primary/50 text-primary font-bold uppercase tracking-widest px-4 py-1.5 text-[11px] bg-primary/10">
              🏆 Hosting the Tournament
            </Badge>
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 font-bold uppercase tracking-widest px-4 py-1.5 text-[11px] bg-yellow-500/10">
              ⭐ Defending Champions
            </Badge>
          </motion.div>

          {/* Logo with animated rings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            {/* Pulse rings */}
            <span className="absolute inline-flex h-56 w-56 md:h-64 md:w-64 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "3s" }} />
            <span className="absolute inline-flex h-44 w-44 md:h-52 md:w-52 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
            {/* Glow */}
            <div className="absolute w-40 h-40 rounded-full bg-primary/25 blur-2xl" />
            {/* Logo */}
            <img
              src="/onsl-official-logo.png"
              alt="Kokkola Soccer Boys"
              className="relative w-36 h-36 md:w-44 md:w-44 object-contain rounded-full shadow-2xl ring-4 ring-primary/30 bg-black/20"
              style={{ boxShadow: "0 0 0 8px rgba(34,197,94,0.08), 0 24px 80px rgba(0,0,0,0.8)" }}
            />
          </motion.div>

          {/* Club name */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1
              className="text-4xl md:text-6xl font-black tracking-tight uppercase italic leading-none text-white"
              style={{ textShadow: "0 0 60px rgba(34,197,94,0.3), 0 4px 0 rgba(0,0,0,0.8)" }}
            >
              Kokkola Soccer Boys
            </h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em] mt-2">presents</p>
          </motion.div>

          {/* League name box */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl" />
            <div className="relative bg-primary/10 border border-primary/30 rounded-2xl px-8 py-4 max-w-lg">
              <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tight text-primary leading-tight">
                Ostrobothnia Nepal Super League 2026
              </h2>
            </div>
          </motion.div>

          {/* Event pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-2 text-sm font-medium text-white/60"
          >
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <CalendarDays className="h-3.5 w-3.5 text-primary" /> 28 June 2026
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Santahaka, Kokkola
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <Users className="h-3.5 w-3.5 text-primary" /> 5 Teams · Round-Robin
            </span>
          </motion.div>

          {/* Countdown */}
          {!tournamentStarted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-full space-y-4 pt-2"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/30 flex items-center justify-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Tournament starts in
              </p>
              <Countdown />
            </motion.div>
          )}
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { icon: Users, value: "5", label: "Teams", color: "text-primary" },
          { icon: CalendarDays, value: "10", label: "Matches", color: "text-blue-400" },
          { icon: Shield, value: "Free", label: "Entry", color: "text-yellow-400" },
          { icon: Star, value: "1", label: "Champion", color: "text-orange-400" },
        ].map(({ icon: Icon, value, label, color }) => (
          <motion.div key={label} variants={fadeUp}>
            <Card className="border-white/5 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-6 w-6 flex-shrink-0 ${color}`} />
                <div>
                  <div className="text-2xl font-black leading-none">{value}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{label}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── ABOUT + VENUE ── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="grid md:grid-cols-2 gap-6"
      >
        <motion.div variants={fadeUp}>
          <Card className="h-full border-primary/10 hover:border-primary/25 transition-colors">
            <CardContent className="p-6 space-y-4 h-full flex flex-col">
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-sm">
                <Trophy className="h-5 w-5" />
                About the Tournament
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The <span className="text-foreground font-semibold">Ostrobothnia Nepal Super League 2026</span> brings together 5 Nepali football clubs from across Ostrobothnia for a thrilling one-day competition hosted by Kokkola Soccer Boys at Santahaka on 28 June 2026.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground flex-1">
                {[
                  "Round-robin — every team plays each other",
                  "5-a-side / small-sided football",
                  "Kick-off at 09:00 · Finals in the afternoon",
                  "Live scores & stats on this app",
                  "Free entry for all spectators",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full border-primary/10 hover:border-primary/25 transition-colors overflow-hidden">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-sm mb-3">
                <MapPin className="h-5 w-5" />
                Venue
              </div>
              <p className="font-bold text-lg">Santahaka Sports Ground</p>
              <p className="text-sm text-muted-foreground mb-3">Kokkola, Finland</p>
              <div className="flex-1 rounded-xl overflow-hidden border border-border min-h-[180px]">
                <iframe
                  title="Santahaka Kokkola"
                  src="https://maps.google.com/maps?q=Santahaka,Kokkola,Finland&z=15&output=embed"
                  className="w-full h-full min-h-[180px]"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Free entry · All matches on 28 June 2026</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── PARTICIPATING TEAMS ── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black uppercase tracking-tight">Participating Teams</h2>
          <Link href="/teams">
            <span className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>

        {registeredTeams.length === 0 ? (
          <Card className="border-dashed border-white/10">
            <CardContent className="py-12 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold">No teams registered yet</p>
                <p className="text-muted-foreground text-sm mt-0.5">Teams will appear here once they submit their squad.</p>
              </div>
              <Link href="/register">
                <div className="flex items-center gap-2 text-sm bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer mt-1">
                  <UserPlus className="h-4 w-4" /> Register Your Team
                </div>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          >
            {registeredTeams.map((team) => (
              <motion.div key={team.id} variants={fadeUp}>
                <Link href={`/teams/${team.id}`}>
                  <Card className="hover:border-primary/50 transition-all cursor-pointer group overflow-hidden hover:shadow-lg hover:shadow-primary/5">
                    <div className="h-1.5 w-full" style={{ backgroundColor: team.primaryColor }} />
                    <CardContent className="p-4 flex items-center gap-3">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name}
                          className="h-12 w-12 rounded-full object-contain flex-shrink-0 border border-border" />
                      ) : (
                        <div className="h-12 w-12 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                          style={{ backgroundColor: team.primaryColor }}>
                          {team.shortName}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{team.name}</p>
                        <p className="text-xs text-muted-foreground">{team.shortName}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* ── TOURNAMENT HUB ── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <h2 className="text-xl font-black uppercase tracking-tight mb-4">Tournament Hub</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/fixtures", icon: CalendarDays, label: "Fixtures", desc: "Match schedule" },
            { href: "/standings", icon: Trophy, label: "Standings", desc: "League table" },
            { href: "/live", icon: Activity, label: "Live Scores", desc: "Real-time updates" },
            { href: "/teams", icon: Users, label: "Teams", desc: "Squad details" },
            { href: "/results", icon: Shield, label: "Results", desc: "Finished matches" },
            { href: "/register", icon: UserPlus, label: "Register Team", desc: "Join the league", highlight: true },
          ].map(({ href, icon: Icon, label, desc, highlight }) => (
            <Link key={href} href={href}>
              <Card className={`hover:border-primary/60 cursor-pointer transition-all group hover:shadow-md ${highlight ? "border-primary/40 bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"}`}>
                <CardContent className="p-4 space-y-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${highlight ? "bg-primary/20 text-primary" : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"}`}>
                    <Icon className="h-4.5 w-4.5 h-5 w-5" />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${highlight ? "text-primary" : ""}`}>{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── REGISTER CTA ── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <div className="relative overflow-hidden rounded-2xl border border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-sm">
                <UserPlus className="h-5 w-5" />
                Register Your Team
              </div>
              <h3 className="text-xl md:text-2xl font-black">Is your club joining ONSL 2026?</h3>
              <p className="text-muted-foreground text-sm">
                Register before the tournament. You'll need a manager email for OTP verification and at least 7 players.
              </p>
            </div>
            <Link href="/register">
              <div className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap shadow-lg shadow-primary/20">
                Register Now <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── SHARE / QR ── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <Card className="border-dashed border-white/10">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white p-3 rounded-2xl shadow-lg flex-shrink-0">
              <QRCodeSVG
                value={APP_URL}
                size={120}
                bgColor="#ffffff"
                fgColor="#111827"
                level="M"
                imageSettings={{
                  src: "/onsl-official-logo.png",
                  x: undefined, y: undefined,
                  height: 28, width: 28, excavate: true,
                }}
              />
            </div>
            <div className="text-center md:text-left space-y-2 flex-1">
              <h3 className="font-bold text-lg">Share with your teammates</h3>
              <p className="text-muted-foreground text-sm">
                Scan to follow live scores, fixtures and standings on the tournament day.
              </p>
              <a href={APP_URL} target="_blank" rel="noopener noreferrer"
                className="text-primary text-sm font-medium hover:underline break-all block">
                {APP_URL}
              </a>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-1">
                <a href="https://www.facebook.com/people/Kokkola-Soccer-Boys/61589834992626/"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Facebook className="h-3.5 w-3.5" /> Facebook
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
      </motion.div>

    </div>
  );
}
