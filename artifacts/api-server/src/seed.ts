import { db, tournamentsTable, teamsTable, clubSettingsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { logger } from "./lib/logger";

const TOURNAMENT = {
  name: "Ostrobothnia Nepal Super League 2026",
  shortName: "ONSL 2026",
  date: "2026-06-28",
  venue: "Santahaka Tekonurmikenttä",
  city: "Kokkola, Finland",
  format: "7-a-side",
  maxTeams: 5,
  kickoffTime: "10:00",
  description:
    "The Ostrobothnia Nepal Super League 2026 is a one-day football tournament bringing together Nepali football clubs from across Ostrobothnia, Finland. Hosted and organised by Kokkola Soccer Boys at Santahaka Tekonurmikenttä, Kokkola on 28 June 2026.",
  rules: [
    "7-a-side format (6 outfield players + 1 goalkeeper)",
    "Each match is 2 × 20 minutes with a 5-minute half-time break",
    "Round-robin — every team plays each other once",
    "3 points for a win, 1 point for a draw, 0 for a loss",
    "Tiebreaker: goal difference, then goals scored, then head-to-head",
    "Rolling substitutions — no limit on changes",
    "Yellow card: caution. Two yellows = red card",
    "Red card: player is sent off and may not be replaced",
    "No offside rule applies",
    "Kick-ins replace throw-ins — ball played in with the foot",
    "Free kicks are direct — no wall required",
    "Goalkeeper may not handle a deliberate back-pass",
    "Fair play and sportsmanship expected from all",
  ],
  prizes: [
    "1st place — Champions Running Trophy",
    "Top Scorer award",
    "Best Goalkeeper award",
  ],
  status: "upcoming" as const,
  isActive: true,
};

const TEAMS = [
  { name: "Kokkola Soccer Boys",           shortName: "KSB", primaryColor: "#16a34a" },
  { name: "Jeppis Nepal Klub",             shortName: "JNK", primaryColor: "#2563eb" },
  { name: "Oulu Nepalese Sports",          shortName: "ONS", primaryColor: "#dc2626" },
  { name: "Seinajoki International Society", shortName: "SIS", primaryColor: "#7c3aed" },
  { name: "Vaasan Nepali Ry",              shortName: "VNR", primaryColor: "#ea580c" },
];

const CLUB_SETTINGS = {
  name: "Kokkola Soccer Boys",
  shortName: "KSB",
  logoUrl: "/ksb-logo.png",
  primaryColor: "#16a34a",
  city: "Kokkola, Finland",
  email: "info@kokkolasoccerboys.cc",
  phone: "+358 413 174 494",
  website: "https://kokkolasoccerboys.cc",
};

export async function seed() {
  try {
    // ── Tournament ──────────────────────────────────────────────────────────
    const [{ n: tCount }] = await db
      .select({ n: count() })
      .from(tournamentsTable);

    if (Number(tCount) === 0) {
      await db.insert(tournamentsTable).values(TOURNAMENT);
      logger.info("Seeded tournament");
    }

    // ── Teams ────────────────────────────────────────────────────────────────
    const [{ n: teamCount }] = await db
      .select({ n: count() })
      .from(teamsTable);

    if (Number(teamCount) === 0) {
      await db.insert(teamsTable).values(TEAMS);
      logger.info("Seeded 5 teams");
    }

    // ── Club settings ────────────────────────────────────────────────────────
    const [{ n: csCount }] = await db
      .select({ n: count() })
      .from(clubSettingsTable);

    if (Number(csCount) === 0) {
      await db.insert(clubSettingsTable).values(CLUB_SETTINGS);
      logger.info("Seeded club settings");
    }
  } catch (err) {
    logger.error({ err }, "Seed failed — continuing anyway");
  }
}
