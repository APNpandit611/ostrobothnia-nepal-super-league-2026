import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, seasonArchivesTable, teamsTable, matchesTable, goalsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/season-archives", async (_req, res): Promise<void> => {
  const rows = await db.select().from(seasonArchivesTable).orderBy(seasonArchivesTable.createdAt);
  res.json(rows);
});

router.get("/season-archives/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [row] = await db.select().from(seasonArchivesTable).where(eq(seasonArchivesTable.id, id));
  if (!row) { res.status(404).json({ message: "Not found" }); return; }
  res.json(row);
});

router.post("/admin/season-archives", async (req, res): Promise<void> => {
  const body = req.body as {
    name: string;
    seasonYear: string;
    winnerTeamId?: number;
    winnerTeamName?: string;
    winnerTeamShortName?: string;
    winnerTeamLogo?: string;
    finalScore: string;
    finalHomeTeam: string;
    finalAwayTeam: string;
    topScorerName?: string;
    topScorerGoals?: string;
    topScorerTeam?: string;
    standings?: unknown;
    matches?: unknown;
  };

  const [row] = await db.insert(seasonArchivesTable).values({
    name: body.name,
    seasonYear: body.seasonYear,
    winnerTeamId: body.winnerTeamId ?? null,
    winnerTeamName: body.winnerTeamName ?? null,
    winnerTeamShortName: body.winnerTeamShortName ?? null,
    winnerTeamLogo: body.winnerTeamLogo ?? null,
    finalScore: body.finalScore,
    finalHomeTeam: body.finalHomeTeam,
    finalAwayTeam: body.finalAwayTeam,
    topScorerName: body.topScorerName ?? null,
    topScorerGoals: body.topScorerGoals ?? null,
    topScorerTeam: body.topScorerTeam ?? null,
    standings: body.standings ?? null,
    matches: body.matches ?? null,
  }).returning();

  res.status(201).json(row);
});

router.delete("/admin/season-archives/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [row] = await db.delete(seasonArchivesTable).where(eq(seasonArchivesTable.id, id)).returning();
  if (!row) { res.status(404).json({ message: "Not found" }); return; }
  res.status(204).send();
});

// Auto-archive current season from the database
router.post("/admin/season-archives/archive-current", async (req, res): Promise<void> => {
  const { name, seasonYear } = req.body as { name?: string; seasonYear?: string };

  const teams = await db.select().from(teamsTable).orderBy(teamsTable.id);
  const allMatches = await db.select().from(matchesTable);
  const allGoals = await db.select().from(goalsTable);
  const leagueMatches = allMatches.filter(m => m.matchType !== "final");
  const finals = allMatches.filter(m => m.matchType === "final");
  const finishedLeague = leagueMatches.filter(m => m.status === "finished");

  if (finals.length === 0) {
    res.status(400).json({ message: "No final match found" });
    return;
  }

  const final = finals[0];
  if (final.status !== "finished") {
    res.status(400).json({ message: "Final match is not finished" });
    return;
  }

  // Compute winner
  const winnerTeamId = final.homeScore > final.awayScore ? final.homeTeamId : final.awayTeamId;
  const winnerTeam = teams.find(t => t.id === winnerTeamId);

  // Compute standings
  const standingsMap = new Map<number, { teamId: number; teamName: string; teamShortName: string; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number }>();
  for (const t of teams) {
    standingsMap.set(t.id, { teamId: t.id, teamName: t.name, teamShortName: t.shortName, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 });
  }
  for (const match of finishedLeague) {
    const home = standingsMap.get(match.homeTeamId);
    const away = standingsMap.get(match.awayTeamId);
    if (!home || !away) continue;
    home.played++; away.played++;
    home.goalsFor += match.homeScore; home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore; away.goalsAgainst += match.homeScore;
    if (match.homeScore > match.awayScore) { home.won++; away.lost++; }
    else if (match.homeScore < match.awayScore) { away.won++; home.lost++; }
    else { home.drawn++; away.drawn++; }
  }
  const standings = Array.from(standingsMap.values())
    .map(s => ({ ...s, goalDifference: s.goalsFor - s.goalsAgainst, points: s.won * 3 + s.drawn }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.teamName.localeCompare(b.teamName);
    });

  // Top scorer
  const nonOwnGoals = allGoals.filter(g => !g.isOwnGoal);
  const scoreMap = new Map<string, { name: string; teamId: number; teamName: string; goals: number }>();
  for (const g of nonOwnGoals) {
    const key = `${g.scorerName}__${g.teamId}`;
    const existing = scoreMap.get(key);
    if (existing) {
      existing.goals++;
    } else {
      scoreMap.set(key, {
        name: g.scorerName || "Unknown",
        teamId: g.teamId,
        teamName: teams.find(t => t.id === g.teamId)?.name || "Unknown",
        goals: 1,
      });
    }
  }
  const topScorer = Array.from(scoreMap.values()).sort((a, b) => b.goals - a.goals)[0];

  // Build matches snapshot
  const matchesSnapshot = allMatches.map(m => {
    const home = teams.find(t => t.id === m.homeTeamId);
    const away = teams.find(t => t.id === m.awayTeamId);
    const matchGoals = allGoals.filter(g => g.matchId === m.id);
    return {
      matchNumber: m.matchNumber,
      matchType: m.matchType,
      homeTeam: home?.name || "Unknown",
      awayTeam: away?.name || "Unknown",
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: m.status,
      goals: matchGoals.map(g => ({
        scorer: g.scorerName,
        team: teams.find(t => t.id === g.teamId)?.name || "Unknown",
        minute: g.minute,
        isOwnGoal: g.isOwnGoal,
      })),
    };
  });

  const [row] = await db.insert(seasonArchivesTable).values({
    name: name || `${seasonYear || "2026"} Season Archive`,
    seasonYear: seasonYear || "2026",
    winnerTeamId: winnerTeam?.id ?? null,
    winnerTeamName: winnerTeam?.name ?? null,
    winnerTeamShortName: winnerTeam?.shortName ?? null,
    winnerTeamLogo: winnerTeam?.logoUrl ?? null,
    finalScore: `${final.homeScore} - ${final.awayScore}`,
    finalHomeTeam: teams.find(t => t.id === final.homeTeamId)?.name || "Unknown",
    finalAwayTeam: teams.find(t => t.id === final.awayTeamId)?.name || "Unknown",
    topScorerName: topScorer?.name ?? null,
    topScorerGoals: topScorer?.goals ? String(topScorer.goals) : null,
    topScorerTeam: topScorer?.teamName ?? null,
    standings,
    matches: matchesSnapshot,
  }).returning();

  res.status(201).json(row);
});

export default router;
