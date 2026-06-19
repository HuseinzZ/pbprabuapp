// src/lib/utils/point-system.ts

export interface PointConfig {
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
  fullname: string;
  username: string | null;
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
  const qfMatches = matches.filter((m) => m.phase === "QF" && m.status === "completed");
  const r16Matches = matches.filter((m) => m.phase === "R16" && m.status === "completed");
  const r32Matches = matches.filter((m) => m.phase === "R32" && m.status === "completed");

  const hasFullKnockout = finalMatches.length > 0;

  if (hasFullKnockout) {
    const assigned = new Set<string>();

    const assignTeam = (teamId: string, position: number, tier: string, groupName: string) => {
      if (assigned.has(teamId)) return;
      const ts = teamStats[teamId] ?? { wins: 0, draws: 0, losses: 0, scoreFor: 0, scoreAgainst: 0 };
      result[teamId] = {
        position, tier, groupName,
        wins: ts.wins, draws: ts.draws, losses: ts.losses,
        scoreDiff: ts.scoreFor - ts.scoreAgainst,
      };
      assigned.add(teamId);
    };

    // 1. Final
    if (finalMatches.length > 0) {
      const f = finalMatches[0];
      if (f.winner_team_id) {
        assignTeam(f.winner_team_id, 1, "Juara 1", "Final");
        const loserId = f.team1_id === f.winner_team_id ? f.team2_id : f.team1_id;
        if (loserId) assignTeam(loserId, 2, "Juara 2", "Final");
      }
    }

    // 2. 3RD Place or SF Losers
    if (thirdMatches.length > 0) {
      const f = thirdMatches[0];
      if (f.winner_team_id) {
        assignTeam(f.winner_team_id, 3, "Juara 3", "Juara 3");
        const loserId = f.team1_id === f.winner_team_id ? f.team2_id : f.team1_id;
        if (loserId) assignTeam(loserId, 4, "Juara 4", "Juara 3");
      }
    } else {
      const sfLosers: string[] = [];
      sfMatches.forEach((m) => {
        if (m.winner_team_id) {
          const loserId = m.team1_id === m.winner_team_id ? m.team2_id : m.team1_id;
          if (loserId) sfLosers.push(loserId);
        }
      });

      if (sfLosers.length === 2) {
        const l1 = sfLosers[0];
        const l2 = sfLosers[1];
        const ts1 = teamStats[l1];
        const ts2 = teamStats[l2];
        const diff1 = (ts1?.scoreFor ?? 0) - (ts1?.scoreAgainst ?? 0);
        const diff2 = (ts2?.scoreFor ?? 0) - (ts2?.scoreAgainst ?? 0);
        
        let juara3Id = l1;
        let juara4Id = l2;

        if (diff1 > diff2) {
           juara3Id = l1; juara4Id = l2;
        } else if (diff2 > diff1) {
           juara3Id = l2; juara4Id = l1;
        } else {
           // If score difference is same, highest scoreFor wins
           const score1 = ts1?.scoreFor ?? 0;
           const score2 = ts2?.scoreFor ?? 0;
           if (score2 > score1) {
               juara3Id = l2; juara4Id = l1;
           }
        }

        assignTeam(juara3Id, 3, "Juara 3", "SF");
        assignTeam(juara4Id, 4, "Semi Final", "SF");
      } else {
        sfLosers.forEach((loserId) => assignTeam(loserId, 3, "Semi Final", "SF"));
      }
    }

    // 3. QF Losers (pos 5-8)
    qfMatches.forEach((m) => {
      if (m.winner_team_id) {
        const loserId = m.team1_id === m.winner_team_id ? m.team2_id : m.team1_id;
        if (loserId) assignTeam(loserId, 5, "Perempat Final", "QF");
      }
    });

    // 4. R16 Losers (pos 9-16)
    r16Matches.forEach((m) => {
      if (m.winner_team_id) {
        const loserId = m.team1_id === m.winner_team_id ? m.team2_id : m.team1_id;
        if (loserId) assignTeam(loserId, 9, "Round of 16", "R16");
      }
    });

    // 5. R32 Losers (pos 17-32)
    r32Matches.forEach((m) => {
      if (m.winner_team_id) {
        const loserId = m.team1_id === m.winner_team_id ? m.team2_id : m.team1_id;
        if (loserId) assignTeam(loserId, 17, "Round of 32", "R32");
      }
    });

    // 6. Group Stage Losers
    let nextPos = Object.keys(result).length + 1;
    
    let groupLoserTier = "Peserta";
    const tCount = activeTeams.length;
    if (tCount > 0) {
      if (tCount <= 4) groupLoserTier = "Semi Final";
      else if (tCount <= 8) groupLoserTier = "Perempat Final";
      else if (tCount <= 16) groupLoserTier = "Round of 16";
      else if (tCount <= 32) groupLoserTier = "Round of 32";
      else if (tCount <= 64) groupLoserTier = "Round of 64";
    }

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
        if (!assigned.has(t.id)) {
          assignTeam(t.id, nextPos, groupLoserTier, group);
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

export function getPointsFromPosition(position: number, tier: string, type: PointConfig): number {
  if (tier === "Juara 1") return type.points_winner;
  if (tier === "Juara 2") return type.points_finalist;
  if (tier === "Juara 3" || tier === "Semi Final") return type.points_semifinalist;
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
  pointConfig: PointConfig,
  force: boolean = false
): PointEntry[] {
  const positions = computeFinalPositions(matches, teams);
  const entries: PointEntry[] = [];
  const activeTeams = teams.filter((t) => !t.is_bye_team);

  const hasFinal = matches.some((m) => m.phase === "F" && m.status === "completed");
  const tournamentDecided = hasFinal || force;

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
      entries.push({ ...base, playerId: p1.id, playerName: p1.fullname, partnerName: p2?.fullname ?? null });
    }
    if (p2) {
      entries.push({ ...base, playerId: p2.id, playerName: p2.fullname, partnerName: p1?.fullname ?? null });
    }
  }

  entries.sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.playerName.localeCompare(b.playerName);
  });
  return entries;
}
