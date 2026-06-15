import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, teamsTable, matchesTable, goalsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/top-scorers", async (_req, res): Promise<void> => {
  // Only approved teams are part of the tournament
  const teams = await db.select().from(teamsTable).where(eq(teamsTable.squadStatus, "approved"));
  const approvedIds = new Set(teams.map(t => t.id));

  const goals = (await db.select().from(goalsTable).where(eq(goalsTable.isOwnGoal, false)))
    .filter(g => approvedIds.has(g.teamId));
  const teamsMap = new Map(teams.map(t => [t.id, t]));

  // Aggregate by scorer name + team
  const scoreMap = new Map<string, { scorerName: string; teamId: number; teamName: string; goals: number }>();
  for (const goal of goals) {
    const scorer = goal.scorerName || "Unknown Player";
    const key = `${scorer}__${goal.teamId}`;
    const existing = scoreMap.get(key);
    if (existing) {
      existing.goals++;
    } else {
      scoreMap.set(key, {
        scorerName: scorer,
        teamId: goal.teamId,
        teamName: teamsMap.get(goal.teamId)?.name ?? "Unknown",
        goals: 1,
      });
    }
  }

  const topScorers = Array.from(scoreMap.values())
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10);

  res.json(topScorers);
});

router.get("/stats", async (_req, res): Promise<void> => {
  // Only approved teams are part of the tournament
  const teams = await db.select().from(teamsTable).where(eq(teamsTable.squadStatus, "approved"));
  const registeredSet = new Set(teams.map(t => t.id));

  const allMatchesRaw = await db.select().from(matchesTable);
  // Only count matches where both teams are registered
  const allMatches = allMatchesRaw.filter(m => registeredSet.has(m.homeTeamId) && registeredSet.has(m.awayTeamId));
  const finishedMatches = allMatches.filter(m => m.status === "finished" && m.matchType !== "final");
  const liveMatches = allMatches.filter(m => m.status === "live");
  const allGoals = (await db.select().from(goalsTable)).filter(g => registeredSet.has(g.teamId));

  const totalGoals = allGoals.length;
  const matchesPlayed = finishedMatches.length;
  const averageGoalsPerMatch = matchesPlayed > 0 ? totalGoals / matchesPlayed : 0;

  // Highest scoring match
  let highestScoringMatch = null;
  let maxGoals = 0;
  for (const m of finishedMatches) {
    const total = m.homeScore + m.awayScore;
    if (total > maxGoals) {
      maxGoals = total;
      const homeTeam = teams.find(t => t.id === m.homeTeamId);
      const awayTeam = teams.find(t => t.id === m.awayTeamId);
      const matchGoals = allGoals.filter(g => g.matchId === m.id);
      const homeScorers = matchGoals.filter(g => g.teamId === m.homeTeamId && !g.isOwnGoal).map(g => g.scorerName ?? "Unknown");
      const awayScorers = matchGoals.filter(g => g.teamId === m.awayTeamId && !g.isOwnGoal).map(g => g.scorerName ?? "Unknown");
      const ownGoalsForHome = matchGoals.filter(g => g.teamId === m.awayTeamId && g.isOwnGoal).map(g => g.scorerName ?? "Unknown");
      const ownGoalsForAway = matchGoals.filter(g => g.teamId === m.homeTeamId && g.isOwnGoal).map(g => g.scorerName ?? "Unknown");
      highestScoringMatch = {
        matchId: m.id,
        homeTeam: homeTeam?.name ?? "Unknown",
        awayTeam: awayTeam?.name ?? "Unknown",
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        totalGoals: total,
        homeScorers,
        awayScorers,
        ownGoalsForHome,
        ownGoalsForAway,
      };
    }
  }

  // Goals per team (for/against)
  const teamGoalsFor = new Map<number, number>();
  const teamGoalsAgainst = new Map<number, number>();
  const teamWins = new Map<number, number>();
  const teamDraws = new Map<number, number>();
  const teamCleanSheets = new Map<number, number>();
  for (const t of teams) {
    teamGoalsFor.set(t.id, 0);
    teamGoalsAgainst.set(t.id, 0);
    teamWins.set(t.id, 0);
    teamDraws.set(t.id, 0);
    teamCleanSheets.set(t.id, 0);
  }
  for (const m of finishedMatches) {
    teamGoalsFor.set(m.homeTeamId, (teamGoalsFor.get(m.homeTeamId) ?? 0) + m.homeScore);
    teamGoalsFor.set(m.awayTeamId, (teamGoalsFor.get(m.awayTeamId) ?? 0) + m.awayScore);
    teamGoalsAgainst.set(m.homeTeamId, (teamGoalsAgainst.get(m.homeTeamId) ?? 0) + m.awayScore);
    teamGoalsAgainst.set(m.awayTeamId, (teamGoalsAgainst.get(m.awayTeamId) ?? 0) + m.homeScore);
    if (m.homeScore > m.awayScore) teamWins.set(m.homeTeamId, (teamWins.get(m.homeTeamId) ?? 0) + 1);
    else if (m.awayScore > m.homeScore) teamWins.set(m.awayTeamId, (teamWins.get(m.awayTeamId) ?? 0) + 1);
    else { teamDraws.set(m.homeTeamId, (teamDraws.get(m.homeTeamId) ?? 0) + 1); teamDraws.set(m.awayTeamId, (teamDraws.get(m.awayTeamId) ?? 0) + 1); }
    if (m.awayScore === 0) teamCleanSheets.set(m.homeTeamId, (teamCleanSheets.get(m.homeTeamId) ?? 0) + 1);
    if (m.homeScore === 0) teamCleanSheets.set(m.awayTeamId, (teamCleanSheets.get(m.awayTeamId) ?? 0) + 1);
  }

  let mostGoalsTeam = null;
  let bestDefenseTeam = null;
  let mostWinsTeam = null;
  let mostDrawsTeam = null;
  let mostCleanSheetsTeam = null;
  let maxGF = -1;
  let minGA = Infinity;
  let maxWins = -1;
  let maxDraws = -1;
  let maxCleanSheets = -1;

  for (const t of teams) {
    const gf = teamGoalsFor.get(t.id) ?? 0;
    const ga = teamGoalsAgainst.get(t.id) ?? 0;
    const wins = teamWins.get(t.id) ?? 0;
    const draws = teamDraws.get(t.id) ?? 0;
    const cleanSheets = teamCleanSheets.get(t.id) ?? 0;

    if (gf > maxGF) {
      maxGF = gf;
      mostGoalsTeam = { teamId: t.id, teamName: t.name, goals: gf };
    }
    if (ga < minGA && matchesPlayed > 0) {
      minGA = ga;
      bestDefenseTeam = { teamId: t.id, teamName: t.name, goalsAgainst: ga };
    }
    if (wins > maxWins) {
      maxWins = wins;
      mostWinsTeam = { teamId: t.id, teamName: t.name, wins };
    }
    if (draws > maxDraws) {
      maxDraws = draws;
      mostDrawsTeam = { teamId: t.id, teamName: t.name, draws };
    }
    if (cleanSheets > maxCleanSheets) {
      maxCleanSheets = cleanSheets;
      mostCleanSheetsTeam = { teamId: t.id, teamName: t.name, cleanSheets };
    }
  }

  // Biggest win
  let biggestWin = null;
  let maxDiff = -1;
  for (const m of finishedMatches) {
    const diff = Math.abs(m.homeScore - m.awayScore);
    if (diff > maxDiff) {
      maxDiff = diff;
      const homeTeam = teams.find(t => t.id === m.homeTeamId);
      const awayTeam = teams.find(t => t.id === m.awayTeamId);
      const winner = m.homeScore > m.awayScore ? homeTeam?.name : awayTeam?.name;
      const loser = m.homeScore > m.awayScore ? awayTeam?.name : homeTeam?.name;
      biggestWin = {
        matchId: m.id,
        winner: winner ?? "Unknown",
        loser: loser ?? "Unknown",
        winnerScore: Math.max(m.homeScore, m.awayScore),
        loserScore: Math.min(m.homeScore, m.awayScore),
        goalDifference: diff,
      };
    }
  }

  res.json({
    totalMatches: allMatches.length,
    matchesPlayed,
    liveMatches: liveMatches.length,
    totalGoals,
    averageGoalsPerMatch: parseFloat(averageGoalsPerMatch.toFixed(2)),
    highestScoringMatch,
    mostGoalsTeam,
    bestDefenseTeam,
    mostWinsTeam,
    mostDrawsTeam,
    mostCleanSheetsTeam,
    biggestWin,
  });
});

export default router;
