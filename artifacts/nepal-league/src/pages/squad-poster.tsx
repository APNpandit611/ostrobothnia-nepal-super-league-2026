import { useParams, Link } from "wouter";
import { useGetTeam, useListPlayers } from "@workspace/api-client-react";
import { Loader2, ArrowLeft } from "lucide-react";

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

const POSITION_ORDER = ["GK", "C", "V.C", "Manager", "Player"];

const POSITION_LABEL: Record<string, string> = {
  GK: "Goalkeeper",
  C: "Captain",
  "V.C": "Vice Captain",
  Manager: "Manager",
  Player: "Player",
};

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
    const posA = POSITION_ORDER.indexOf(a.position ?? "Player");
    const posB = POSITION_ORDER.indexOf(b.position ?? "Player");
    if (posA !== posB) return (posA === -1 ? 99 : posA) - (posB === -1 ? 99 : posB);
    return (a.number ?? 99) - (b.number ?? 99);
  });

  // Group by position
  const grouped: Record<string, typeof sorted> = {};
  for (const p of sorted) {
    const pos = p.position ?? "Player";
    if (!grouped[pos]) grouped[pos] = [];
    grouped[pos].push(p);
  }
  const positionGroups = POSITION_ORDER.filter((pos) => grouped[pos]?.length);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `linear-gradient(160deg, #06070f 0%, #0c0e1f 50%, #070814 100%)`,
      }}
    >
      {/* Subtle diagonal stripes */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, rgba(${rgb},1) 0px, rgba(${rgb},1) 1px, transparent 1px, transparent 48px)`,
        }}
      />

      {/* Big faded logo as background watermark */}
      {team.logoUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={team.logoUrl}
            alt=""
            className="w-[70vw] max-w-[500px] object-contain opacity-[0.04]"
            style={{ filter: `drop-shadow(0 0 60px rgba(${rgb},0.3))` }}
          />
        </div>
      )}

      {/* Top colour line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-10"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${color} 40%, ${color} 60%, transparent 100%)` }}
      />

      {/* Back button */}
      <Link href="/teams">
        <div className="absolute top-5 left-5 z-20 flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" />
          Teams
        </div>
      </Link>

      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-14 pb-10">

        {/* ── HERO HEADER ── */}
        <div className="flex flex-col items-center text-center mb-10">

          {/* Logo */}
          <div className="relative mb-5">
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{ backgroundColor: color, transform: "scale(1.3)" }}
            />
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 shadow-2xl"
                style={{
                  borderColor: color,
                  boxShadow: `0 0 0 8px rgba(${rgb},0.12), 0 20px 60px rgba(0,0,0,0.7)`,
                }}
              />
            ) : (
              <div
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center font-black text-3xl text-white border-4 shadow-2xl"
                style={{
                  backgroundColor: color,
                  borderColor: `rgba(${rgb},0.5)`,
                  boxShadow: `0 0 0 8px rgba(${rgb},0.12), 0 20px 60px rgba(0,0,0,0.7)`,
                }}
              >
                {team.shortName}
              </div>
            )}
          </div>

          {/* Team name */}
          <h1
            className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-white leading-tight"
            style={{ textShadow: `0 0 40px rgba(${rgb},0.6)` }}
          >
            {team.name}
          </h1>

          {/* Short name pill */}
          <div
            className="mt-2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest"
            style={{
              color,
              background: `rgba(${rgb}, 0.12)`,
              border: `1px solid rgba(${rgb}, 0.35)`,
            }}
          >
            {team.shortName} · Nepal Super League 2026
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb},0.6))` }} />
          <span className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Squad</span>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, rgba(${rgb},0.6), transparent)` }} />
        </div>

        {/* ── PLAYERS by position ── */}
        {sorted.length === 0 ? (
          <p className="text-white/30 italic text-sm text-center py-12">No players registered yet</p>
        ) : (
          <div className="space-y-6">
            {positionGroups.map((pos) => (
              <div key={pos}>
                {/* Position header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-sm"
                    style={{
                      color,
                      background: `rgba(${rgb}, 0.15)`,
                      border: `1px solid rgba(${rgb}, 0.3)`,
                    }}
                  >
                    {POSITION_LABEL[pos] ?? pos}
                  </div>
                  <div className="flex-1 h-px" style={{ background: `rgba(${rgb}, 0.15)` }} />
                  <span className="text-white/20 text-xs font-bold">{grouped[pos].length}</span>
                </div>

                {/* Player cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {grouped[pos].map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 rounded-lg overflow-hidden"
                      style={{
                        background: `linear-gradient(90deg, rgba(${rgb},0.08) 0%, rgba(${rgb},0.03) 100%)`,
                        border: `1px solid rgba(${rgb},0.12)`,
                      }}
                    >
                      {/* Jersey number */}
                      <div
                        className="w-12 h-12 flex items-center justify-center font-black text-xl text-white flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, rgba(${rgb},0.6) 0%, rgba(${rgb},0.35) 100%)`,
                          borderRight: `1px solid rgba(${rgb},0.2)`,
                          textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                        }}
                      >
                        {player.number ?? "—"}
                      </div>

                      {/* Name */}
                      <span
                        className="flex-1 font-bold text-sm text-white uppercase tracking-wide truncate px-1"
                        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                      >
                        {player.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FOOTER ── */}
        <div className="mt-10 pt-5" style={{ borderTop: `1px solid rgba(${rgb},0.2)` }}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/35 text-xs italic">One Team. One Family.</p>
              <p
                className="text-2xl font-black italic leading-tight"
                style={{ color, textShadow: `0 0 20px rgba(${rgb},0.5)` }}
              >
                One Goal.
              </p>
            </div>
            {team.logoUrl && (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="h-12 w-12 rounded-full object-cover opacity-50"
                style={{ border: `2px solid rgba(${rgb},0.4)` }}
              />
            )}
          </div>
          <p className="text-white/20 text-[10px] uppercase tracking-widest mt-3">
            Santahaka Tekonurmikenttä · Kokkola · 28 June 2026
          </p>
        </div>
      </div>
    </div>
  );
}
