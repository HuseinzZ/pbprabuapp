// src/lib/utils/point-system.ts

export interface TournamentTypeConfig {
  points_winner: number;
  points_finalist: number;
  points_semifinalist: number;
  points_quarterfinalist: number;
  points_r16: number | null;
  points_r32: number | null;
  points_r64: number | null;
  points_rr: number | null;
}

export interface MatchRow {
  id: string;
  phase: string;
  group_name: string | null;
  team1_id: string | null;
  team2_id: string | null;
  score_team1: number | null;
  score_team2: number | null;
  winner_team_id: string | null;
  status: string | null;
  is_bye: boolean | null;
}

export interface TeamRow {
  id: string;
  name: string;
  player1_id: string | null;
  player2_id: string | null;
  group_name: string | null;
  is_bye_team: boolean;
}

export interface PlayerRow {
  id: string;
  full_name: string;
  nickname: string | null;
  avatar_url: string | null;
  ranking_points: number | null;
}

export interface PointEntry {
  playerId: string;
  playerName: string;
  partnerName: string | null;
  groupName: string;
  wins: number;
  draws: number;
  losses: number;
  scoreDiff: number;
  position: number;
  tier: string;
  points: number;
  groupComplete: boolean;
}

/**
 * Determine final position based on the tournament phases.
 * Priority: F > 3RD > SF > RR standings
 */
export function computeFinalPositions(
  matches: MatchRow[],
  teams: TeamRow[],
): Record<string, { position: number; tier: string; groupName: string; wins: number; draws: number; losses: number; scoreDiff: number }> {
  const activeTeams = teams.filter((t) => !t.is_bye_team);
  const result: Record<string, { position: number; tier: string; groupName: string; wins: number; draws: number; losses: number; scoreDiff: number }> = {};

  const groups = [...new Set(activeTeams.map((t) => t.group_name).filter(Boolean) as string[])].sort();

  const teamStats: Record<string, { wins: number; draws: number; losses: number; scoreFor: number; scoreAgainst: number }> = {};
  activeTeams.forEach((t) => {
    teamStats[t.id] = { wins: 0, draws: 0, losses: 0, scoreFor: 0, scoreAgainst: 0 };
  });

  const completed = matches.filter((m) => m.status === "completed" && !m.is_bye);
  completed.forEach((m) => {
    const { team1_id, team2_id, score_team1, score_team2, winner_team_id } = m;
    if (!team1_id || !team2_id) return;
    if (!teamStats[team1_id] || !teamStats[team2_id]) return;
    const s1 = score_team1 ?? 0;
    const s2 = score_team2 ?? 0;
    teamStats[team1_id].scoreFor += s1;
    teamStats[team1_id].scoreAgainst += s2;
    teamStats[team2_id].scoreFor += s2;
    teamStats[team2_id].scoreAgainst += s1;
    if (winner_team_id === team1_id) {
      teamStats[team1_id].wins++;
      teamStats[team2_id].losses++;
    } else if (winner_team_id === team2_id) {
      teamStats[team2_id].wins++;
      teamStats[team1_id].losses++;
    } else {
      teamStats[team1_id].draws++;
      teamStats[team2_id].draws++;
    }
  });

  const finalMatches = matches.filter((m) => m.phase === "F" && m.status === "completed");
  const thirdMatches = matches.filter((m) => m.phase === "3RD" && m.status === "completed");
  const sfMatches = matches.filter((m) => m.phase === "SF" && m.status === "completed");

  const hasFullKnockout = finalMatches.length > 0;

  if (hasFullKnockout) {
    const assigned = new Set<string>();

    finalMatches.forEach((m) => {
      if (m.winner_team_id) {
        const loserId = m.team1_id === m.winner_team_id ? m.team2_id : m.team1_id;
        assigned.add(m.winner_team_id);
        if (loserId) assigned.add(loserId);
      }
    });

    const finalWinner = finalMatches[0]?.winner_team_id;
    const finalLoser = finalWinner
      ? (finalMatches[0]?.team1_id === finalWinner ? finalMatches[0]?.team2_id : finalMatches[0]?.team1_id)
      : null;

    if (finalWinner) {
      const ts = teamStats[finalWinner] ?? { wins: 0, draws: 0, losses: 0, scoreFor: 0, scoreAgainst: 0 };
      result[finalWinner] = {
        position: 1, tier: "Juara 1", groupName: "Final",
        wins: ts.wins, draws: ts.draws, losses: ts.losses,
        scoreDiff: ts.scoreFor - ts.scoreAgainst,
      };
    }
    if (finalLoser) {
      const ts = teamStats[finalLoser] ?? { wins: 0, draws: 0, losses: 0, scoreFor: 0, scoreAgainst: 0 };
      result[finalLoser] = {
        position: 2, tier: "Juara 2", groupName: "Final",
        wins: ts.wins, draws: ts.draws, losses: ts.losses,
        scoreDiff: ts.scoreFor - ts.scoreAgainst,
      };
    }

    if (thirdMatches.length > 0) {
      const thirdWinner = thirdMatches[0]?.winner_team_id;
      const thirdLoser = thirdWinner
        ? (thirdMatches[0]?.team1_id === thirdWinner ? thirdMatches[0]?.team2_id : thirdMatches[0]?.team1_id)
        : null;
      if (thirdWinner && !result[thirdWinner]) {
        const ts = teamStats[thirdWinner] ?? { wins: 0, draws: 0, losses: 0, scoreFor: 0, scoreAgainst: 0 };
        result[thirdWinner] = {
          position: 3, tier: "Juara 3", groupName: "Juara 3",
          wins: ts.wins, draws: ts.draws, losses: ts.losses,
          scoreDiff: ts.scoreFor - ts.scoreAgainst,
        };
        assigned.add(thirdWinner);
      }
      if (thirdLoser && !result[thirdLoser]) {
        const ts = teamStats[thirdLoser] ?? { wins: 0, draws: 0, losses: 0, scoreFor: 0, scoreAgainst: 0 };
        result[thirdLoser] = {
          position: 4, tier: "Juara 4", groupName: "Juara 3",
          wins: ts.wins, draws: ts.draws, losses: ts.losses,
          scoreDiff: ts.scoreFor - ts.scoreAgainst,
        };
        assigned.add(thirdLoser);
      }
    } else {
      sfMatches.forEach((m) => {
        if (m.winner_team_id) {
          const loserId = m.team1_id === m.winner_team_id ? m.team2_id : m.team1_id;
          if (loserId && !result[loserId]) {
            const ts = teamStats[loserId] ?? { wins: 0, draws: 0, losses: 0, scoreFor: 0, scoreAgainst: 0 };
            result[loserId] = {
              position: 3, tier: "Semi Final", groupName: "SF",
              wins: ts.wins, draws: ts.draws, losses: ts.losses,
              scoreDiff: ts.scoreFor - ts.scoreAgainst,
            };
            assigned.add(loserId);
          }
        }
      });
    }

    let nextPos = Object.keys(result).length + 1;
    for (const group of groups) {
      const groupTeams = activeTeams.filter((t) => t.group_name === group);
      const sorted = [...groupTeams].sort((a, b) => {
        const sa = teamStats[a.id], sb = teamStats[b.id];
        if (!sa || !sb) return 0;
        const mpA = sa.wins * 3 + sa.draws;
        const mpB = sb.wins * 3 + sb.draws;
        if (mpB !== mpA) return mpB - mpA;
        const sdA = sa.scoreFor - sa.scoreAgainst;
        const sdB = sb.scoreFor - sb.scoreAgainst;
        if (sdB !== sdA) return sdB - sdA;
        return sb.wins - sa.wins;
      });

      sorted.forEach((t) => {
        if (!assigned.has(t.id) && !result[t.id]) {
          const ts = teamStats[t.id] ?? { wins: 0, draws: 0, losses: 0, scoreFor: 0, scoreAgainst: 0 };
          const tier = nextPos <= 4 ? "Semi Final"
            : nextPos <= 8 ? "Perempat Final"
            : nextPos <= 16 ? "Round of 16"
            : nextPos <= 32 ? "Round of 32"
            : nextPos <= 64 ? "Round of 64"
            : "Peserta";
          result[t.id] = {
            position: nextPos, tier, groupName: group,
            wins: ts.wins, draws: ts.draws, losses: ts.losses,
            scoreDiff: ts.scoreFor - ts.scoreAgainst,
          };
          nextPos++;
        }
      });
    }
  } else {
    for (const group of groups) {
      const groupTeams = activeTeams.filter((t) => t.group_name === group);
      const rrMatches = matches.filter((m) => (m.phase === "RR" || !m.phase) && m.group_name === group && !m.is_bye);

      const rrStats: Record<string, { matchPoints: number; wins: number; draws: number; losses: number; scoreDiff: number }> = {};
      groupTeams.forEach((t) => { rrStats[t.id] = { matchPoints: 0, wins: 0, draws: 0, losses: 0, scoreDiff: 0 }; });

      const completedRR = rrMatches.filter((m) => m.status === "completed");
      completedRR.forEach((m) => {
        const { team1_id, team2_id, score_team1, score_team2, winner_team_id } = m;
        if (!team1_id || !team2_id || !rrStats[team1_id] || !rrStats[team2_id]) return;
        const s1 = score_team1 ?? 0, s2 = score_team2 ?? 0;
        rrStats[team1_id].scoreDiff += s1 - s2;
        rrStats[team2_id].scoreDiff += s2 - s1;
        if (winner_team_id === team1_id) {
          rrStats[team1_id].wins++; rrStats[team1_id].matchPoints += 3;
          rrStats[team2_id].losses++;
        } else if (winner_team_id === team2_id) {
          rrStats[team2_id].wins++; rrStats[team2_id].matchPoints += 3;
          rrStats[team1_id].losses++;
        } else {
          rrStats[team1_id].draws++; rrStats[team1_id].matchPoints += 1;
          rrStats[team2_id].draws++; rrStats[team2_id].matchPoints += 1;
        }
      });

      const sorted = [...groupTeams].sort((a, b) => {
        const sa = rrStats[a.id], sb = rrStats[b.id];
        if (sb.matchPoints !== sa.matchPoints) return sb.matchPoints - sa.matchPoints;
        if (sb.scoreDiff !== sa.scoreDiff) return sb.scoreDiff - sa.scoreDiff;
        return sb.wins - sa.wins;
      });

      sorted.forEach((t, idx) => {
        const pos = idx + 1;
        const tier = pos === 1 ? "Juara 1"
          : pos === 2 ? "Juara 2"
          : pos <= 4 ? "Semi Final"
          : pos <= 8 ? "Perempat Final"
          : pos <= 16 ? "Round of 16"
          : pos <= 32 ? "Round of 32"
          : pos <= 64 ? "Round of 64"
          : "Peserta";
        const s = rrStats[t.id];
        result[t.id] = {
          position: pos, tier, groupName: group,
          wins: s.wins, draws: s.draws, losses: s.losses, scoreDiff: s.scoreDiff,
        };
      });
    }
  }

  return result;
}

export function getPointsFromPosition(position: number, tier: string, type: TournamentTypeConfig): number {
  if (tier === "Juara 1") return type.points_winner;
  if (tier === "Juara 2") return type.points_finalist;
  if (tier === "Semi Final") return type.points_semifinalist;
  if (tier === "Perempat Final") return type.points_quarterfinalist;
  if (tier === "Round of 16") return type.points_r16 ?? type.points_quarterfinalist;
  if (tier === "Round of 32") return type.points_r32 ?? type.points_r16 ?? 0;
  if (tier === "Round of 64") return type.points_r64 ?? type.points_r32 ?? 0;

  // Fallback to position
  if (position === 1) return type.points_winner;
  if (position === 2) return type.points_finalist;
  if (position === 3) return type.points_semifinalist;
  if (position === 4) return type.points_quarterfinalist;
  
  return type.points_rr ?? 0;
}

export function buildPointEntries(
  matches: MatchRow[],
  teams: TeamRow[],
  playerMap: Record<string, PlayerRow>,
  pointConfig: TournamentTypeConfig
): PointEntry[] {
  const positions = computeFinalPositions(matches, teams);
  const entries: PointEntry[] = [];
  const activeTeams = teams.filter((t) => !t.is_bye_team);

  const hasFinal = matches.some((m) => m.phase === "F" && m.status === "completed");
  const groups = [...new Set(activeTeams.map((t) => t.group_name).filter(Boolean) as string[])];
  const allRRComplete = groups.every((g) => {
    const rrMatches = matches.filter((m) => (m.phase === "RR" || !m.phase) && m.group_name === g && !m.is_bye);
    return rrMatches.length > 0 && rrMatches.every((m) => m.status === "completed");
  });

  const tournamentDecided = hasFinal || allRRComplete;

  for (const team of activeTeams) {
    const pos = positions[team.id];
    if (!pos) continue;

    const points = tournamentDecided ? getPointsFromPosition(pos.position, pos.tier, pointConfig) : 0;
    const p1 = team.player1_id ? playerMap[team.player1_id] : null;
    const p2 = team.player2_id ? playerMap[team.player2_id] : null;

    const base = {
      groupName: pos.groupName,
      wins: pos.wins,
      draws: pos.draws,
      losses: pos.losses,
      scoreDiff: pos.scoreDiff,
      position: pos.position,
      tier: pos.tier,
      points,
      groupComplete: tournamentDecided,
    };

    if (p1) {
      entries.push({ ...base, playerId: p1.id, playerName: p1.full_name, partnerName: p2?.full_name ?? null });
    }
    if (p2) {
      entries.push({ ...base, playerId: p2.id, playerName: p2.full_name, partnerName: p1?.full_name ?? null });
    }
  }

  entries.sort((a, b) => a.position - b.position);
  return entries;
}
