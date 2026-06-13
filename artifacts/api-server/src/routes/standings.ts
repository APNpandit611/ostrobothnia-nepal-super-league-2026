import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, teamsTable, matchesTable, playersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/standings", async (_req, res): Promise<void> => {
  // Only include teams that have at least one registered player
  const playerRows = await db.selectDistinct({ teamId: playersTable.teamId }).from(playersTable);
  const registeredTeamIds = playerRows.map(r => r.teamId);

  if (registeredTeamIds.length === 0) {
    res.json([]);
    return;
  }

  const teams = await db.select().from(teamsTable)
    .where(inArray(teamsTable.id, registeredTeamIds))
    .orderBy(teamsTable.id);
  const matches = await db.select().from(matchesTable).where(eq(matchesTable.status, "finished"));

  // Build standings map
  const standingsMap = new Map<number, {
    teamId: number; teamName: string; teamShortName: string; primaryColor: string;
    played: number; won: number; drawn: number; lost: number;
    goalsFor: number; goalsAgainst: number;
  }>();

  for (const team of teams) {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      teamShortName: team.shortName,
      primaryColor: team.primaryColor,
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0,
    });
  }

  for (const match of matches) {
    const home = standingsMap.get(match.homeTeamId);
    const away = standingsMap.get(match.awayTeamId);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++; away.lost++;
    } else if (match.homeScore < match.awayScore) {
      away.won++; home.lost++;
    } else {
      home.drawn++; away.drawn++;
    }
  }

  // Sort: Points → GD → GF → name
  const rows = Array.from(standingsMap.values()).map(s => ({
    ...s,
    goalDifference: s.goalsFor - s.goalsAgainst,
    points: s.won * 3 + s.drawn,
  })).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });

  const withPositions = rows.map((r, idx) => ({ ...r, position: idx + 1 }));
  res.json(withPositions);
});

export default router;
