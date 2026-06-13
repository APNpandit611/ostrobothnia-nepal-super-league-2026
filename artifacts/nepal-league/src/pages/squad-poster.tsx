import { useParams, Link } from "wouter";
import { useGetTeam, useListPlayers } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export default function SquadPoster() {
  const params = useParams<{ id: string }>();
  const teamId = Number(params.id);

  const { data: team, isLoading: teamLoading } = useGetTeam(teamId);
  const { data: players, isLoading: playersLoading } = useListPlayers(teamId);

  if (teamLoading || playersLoading) {
    return (
      <div className="min-h-screen bg-[#070714] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#070714] flex items-center justify-center text-white">
        <p>Team not found. <Link href="/teams" className="underline">Go back</Link></p>
      </div>
    );
  }

  const color = team.primaryColor || "#2563eb";
  const rgb = color.startsWith("#") && color.length === 7 ? hexToRgb(color) : "37, 99, 235";

  const sorted = [...(players ?? [])].sort((a, b) => {
    return (a.number ?? 99) - (b.number ?? 99);
  });

  const nameParts = team.name.trim().split(" ");
  const lastName = nameParts.pop() ?? "";
  const firstPart = nameParts.join(" ");

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `radial-gradient(ellipse 120% 80% at 70% 30%, rgba(${rgb}, 0.35) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 20% 80%, rgba(${rgb}, 0.15) 0%, transparent 50%), linear-gradient(160deg, #08091a 0%, #0d0e26 40%, #070714 100%)`,
      }}
    >
      {/* Diagonal stripe accent */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, rgba(${rgb},1) 0px, rgba(${rgb},1) 2px, transparent 2px, transparent 40px)`,
        }}
      />
      {/* Top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb},1), transparent)` }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-6 py-8 min-h-screen flex flex-col">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between mb-6">
          {/* Title */}
          <div>
            <h1
              className="text-5xl font-black italic uppercase leading-none tracking-tight text-white"
              style={{
                textShadow: `0 0 40px rgba(${rgb}, 0.8), 0 2px 0 rgba(0,0,0,0.8)`,
                WebkitTextStroke: "1px rgba(255,255,255,0.15)",
              }}
            >
              PLAYER
            </h1>
            <h1
              className="text-5xl font-black italic uppercase leading-none tracking-tight"
              style={{
                color: color,
                textShadow: `0 0 60px rgba(${rgb}, 1), 0 2px 0 rgba(0,0,0,0.8)`,
                WebkitTextStroke: "1px rgba(255,255,255,0.1)",
              }}
            >
              LIST
            </h1>
          </div>

          {/* Team badge */}
          <div className="flex flex-col items-center gap-1">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="w-20 h-20 rounded-full object-cover border-4 shadow-2xl"
                style={{ borderColor: color, boxShadow: `0 0 30px rgba(${rgb}, 0.6)` }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-xl border-4 shadow-2xl"
                style={{ backgroundColor: color, borderColor: `rgba(${rgb},0.5)`, boxShadow: `0 0 30px rgba(${rgb}, 0.6)` }}
              >
                {team.shortName}
              </div>
            )}
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: color }}
            >
              {team.shortName}
            </span>
          </div>
        </div>

        {/* ── TEAM NAME ── */}
        <div className="mb-6">
          {firstPart && (
            <p className="text-lg font-bold uppercase tracking-[0.2em] text-white/70 leading-none mb-0.5">
              {firstPart}
            </p>
          )}
          <h2
            className="text-5xl font-black uppercase italic leading-none"
            style={{
              color: color,
              textShadow: `0 0 80px rgba(${rgb}, 0.8)`,
              WebkitTextStroke: "1px rgba(255,255,255,0.1)",
            }}
          >
            {lastName}
          </h2>
        </div>

        {/* ── DIVIDER ── */}
        <div
          className="h-0.5 w-full mb-5 rounded-full opacity-60"
          style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
        />

        {/* ── PLAYER LIST ── */}
        <div className="flex-1 space-y-2">
          {sorted.length === 0 && (
            <p className="text-white/40 italic text-sm text-center py-8">No players registered yet</p>
          )}
          {sorted.map((player) => (
            <div key={player.id} className="flex items-center gap-3">
              {/* Number box */}
              <div
                className="w-12 h-9 flex items-center justify-center font-black text-lg text-white flex-shrink-0 rounded-sm"
                style={{
                  background: `linear-gradient(135deg, ${color}, rgba(${rgb},0.7))`,
                  boxShadow: `2px 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)`,
                }}
              >
                {player.number ?? "—"}
              </div>
              {/* Name */}
              <span
                className="flex-1 font-black uppercase tracking-wider text-white text-base leading-none"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
              >
                {player.name}
              </span>
              {/* Position badge */}
              {player.position && player.position !== "Player" && (
                <span
                  className="text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm"
                  style={{
                    color: color,
                    background: `rgba(${rgb}, 0.15)`,
                    border: `1px solid rgba(${rgb}, 0.4)`,
                  }}
                >
                  {player.position}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <div className="mt-6 pt-4" style={{ borderTop: `1px solid rgba(${rgb}, 0.3)` }}>
          <p className="text-white/50 text-sm font-medium italic">One Team. One Family.</p>
          <p
            className="text-2xl font-black italic"
            style={{ color, textShadow: `0 0 20px rgba(${rgb}, 0.6)` }}
          >
            One Goal.
          </p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-white/25 text-xs uppercase tracking-widest">ONSL 2026 · Santahaka Kokkola</p>
            <Link href="/teams" className="text-white/30 text-xs hover:text-white/60 transition-colors">← Back</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
