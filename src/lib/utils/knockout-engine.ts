import { createClient } from '@/lib/supabase/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface TeamStanding {
  teamId: string;
  teamName: string;
  groupName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  matchPoints: number; // W=3, D=1, L=0
  scoreFor: number;
  scoreAgainst: number;
  scoreDiff: number;
  position: number;
}

export interface KnockoutMatchInsert {
  tournament_id: string;
  phase: string;          // 'SF' | 'F' | '3RD'
  group_name: string | null;
  round_number: number;
  match_number: number;
  team1_id: string;
  team2_id: string;
  status: string;
  is_bye: boolean;
}

interface MatchRow {
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

interface TeamRow {
  id: string;
  name: string;
  group_name: string | null;
  is_bye_team: boolean;
}

// ─── Compute Group Standings ───────────────────────────────────────────────────

export function computeGroupStandings(
  matches: MatchRow[],
  teams: TeamRow[]
): Record<string, TeamStanding[]> {
  const activeTeams = teams.filter((t) => !t.is_bye_team);
  const groups = [...new Set(activeTeams.map((t) => t.group_name).filter(Boolean) as string[])].sort();
  const result: Record<string, TeamStanding[]> = {};

  for (const group of groups) {
    const groupTeams = activeTeams.filter((t) => t.group_name === group);
    const rrMatches = matches.filter(
      (m) => (m.phase === 'RR' || !m.phase) && m.group_name === group && !m.is_bye
    );

    const standings: Record<string, TeamStanding> = {};
    groupTeams.forEach((t) => {
      standings[t.id] = {
        teamId: t.id,
        teamName: t.name,
        groupName: group,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        matchPoints: 0,
        scoreFor: 0,
        scoreAgainst: 0,
        scoreDiff: 0,
        position: 0,
      };
    });

    // Accumulate from completed matches
    const completedRR = rrMatches.filter((m) => m.status === 'completed');
    completedRR.forEach((m) => {
      const { team1_id, team2_id, score_team1, score_team2, winner_team_id } = m;
      if (!team1_id || !team2_id) return;
      if (!standings[team1_id] || !standings[team2_id]) return;

      const s1 = score_team1 ?? 0;
      const s2 = score_team2 ?? 0;

      standings[team1_id].played++;
      standings[team2_id].played++;
      standings[team1_id].scoreFor += s1;
      standings[team1_id].scoreAgainst += s2;
      standings[team2_id].scoreFor += s2;
      standings[team2_id].scoreAgainst += s1;
      standings[team1_id].scoreDiff += s1 - s2;
      standings[team2_id].scoreDiff += s2 - s1;

      if (winner_team_id === team1_id) {
        standings[team1_id].wins++;
        standings[team1_id].matchPoints += 3;
        standings[team2_id].losses++;
      } else if (winner_team_id === team2_id) {
        standings[team2_id].wins++;
        standings[team2_id].matchPoints += 3;
        standings[team1_id].losses++;
      } else {
        standings[team1_id].draws++;
        standings[team1_id].matchPoints += 1;
        standings[team2_id].draws++;
        standings[team2_id].matchPoints += 1;
      }
    });

    // Sort: matchPoints desc → scoreDiff desc → wins desc
    const sorted = Object.values(standings).sort((a, b) => {
      if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
      if (b.scoreDiff !== a.scoreDiff) return b.scoreDiff - a.scoreDiff;
      return b.wins - a.wins;
    });

    sorted.forEach((s, i) => (s.position = i + 1));
    result[group] = sorted;
  }

  return result;
}

// ─── Check if all RR in a group are completed ──────────────────────────────────

export function isGroupRRComplete(matches: MatchRow[], group: string): boolean {
  const rrMatches = matches.filter(
    (m) => (m.phase === 'RR' || !m.phase) && m.group_name === group && !m.is_bye
  );
  return rrMatches.length > 0 && rrMatches.every((m) => m.status === 'completed');
}

// ─── Check if ALL groups' RR are complete ──────────────────────────────────────

export function isAllRRComplete(matches: MatchRow[], teams: TeamRow[]): boolean {
  const groups = [...new Set(teams.filter((t) => !t.is_bye_team).map((t) => t.group_name).filter(Boolean) as string[])];
  return groups.length > 0 && groups.every((g) => isGroupRRComplete(matches, g));
}

// ─── Check if knockout phase already exists ────────────────────────────────────

export function hasKnockoutPhase(matches: MatchRow[]): boolean {
  return matches.some((m) => m.phase === 'SF' || m.phase === 'F' || m.phase === '3RD');
}

export function hasFinalPhase(matches: MatchRow[]): boolean {
  return matches.some((m) => m.phase === 'F');
}

export function isSFComplete(matches: MatchRow[]): boolean {
  const sfMatches = matches.filter((m) => m.phase === 'SF');
  return sfMatches.length > 0 && sfMatches.every((m) => m.status === 'completed');
}

// ─── Generate Semi Final Matches ───────────────────────────────────────────────

export async function generateSemiFinals(tournamentId: string) {
  const supabase = createClient();

  try {
    // Fetch all matches and teams
    const { data: matchesData, error: mErr } = await supabase
      .from('matches')
      .select('id, phase, group_name, team1_id, team2_id, score_team1, score_team2, winner_team_id, status, is_bye')
      .eq('tournament_id', tournamentId);
    if (mErr) throw new Error(mErr.message);

    const { data: teamsData, error: tErr } = await supabase
      .from('teams')
      .select('id, name, group_name, is_bye_team')
      .eq('tournament_id', tournamentId);
    if (tErr) throw new Error(tErr.message);

    const matches = (matchesData ?? []) as MatchRow[];
    const teams = (teamsData ?? []) as TeamRow[];

    // Safety checks
    if (!isAllRRComplete(matches, teams)) {
      throw new Error('Semua pertandingan RR harus selesai terlebih dahulu.');
    }
    if (hasKnockoutPhase(matches)) {
      throw new Error('Babak knockout sudah pernah di-generate.');
    }

    const standings = computeGroupStandings(matches, teams);
    const groups = Object.keys(standings).sort();

    let sfInserts: KnockoutMatchInsert[] = [];

    if (groups.length >= 2) {
      // Multi-group: A1 vs B2, B1 vs A2 (cross-over)
      // If more than 2 groups, take top 2 from each and create bracket
      const qualifiedTeams: { teamId: string; groupRank: number; groupName: string }[] = [];
      for (const g of groups) {
        const top2 = standings[g].slice(0, 2);
        top2.forEach((s) => qualifiedTeams.push({ teamId: s.teamId, groupRank: s.position, groupName: s.groupName }));
      }

      if (qualifiedTeams.length === 4) {
        // 2 groups: A1 vs B2, B1 vs A2
        const a1 = qualifiedTeams.find((t) => t.groupName === groups[0] && t.groupRank === 1)!;
        const a2 = qualifiedTeams.find((t) => t.groupName === groups[0] && t.groupRank === 2)!;
        const b1 = qualifiedTeams.find((t) => t.groupName === groups[1] && t.groupRank === 1)!;
        const b2 = qualifiedTeams.find((t) => t.groupName === groups[1] && t.groupRank === 2)!;

        sfInserts = [
          {
            tournament_id: tournamentId,
            phase: 'SF',
            group_name: null,
            round_number: 1,
            match_number: 1,
            team1_id: a1.teamId,
            team2_id: b2.teamId,
            status: 'scheduled',
            is_bye: false,
          },
          {
            tournament_id: tournamentId,
            phase: 'SF',
            group_name: null,
            round_number: 1,
            match_number: 2,
            team1_id: b1.teamId,
            team2_id: a2.teamId,
            status: 'scheduled',
            is_bye: false,
          },
        ];
      } else {
        // More than 2 groups: seed bracket by group rank
        // Sort: group rank 1 first, then alternating
        const rank1 = qualifiedTeams.filter((t) => t.groupRank === 1).sort((a, b) => a.groupName.localeCompare(b.groupName));
        const rank2 = qualifiedTeams.filter((t) => t.groupRank === 2).sort((a, b) => a.groupName.localeCompare(b.groupName)).reverse();

        // Pair rank1[i] vs rank2[i]
        const sfCount = Math.min(rank1.length, rank2.length);
        for (let i = 0; i < sfCount; i++) {
          sfInserts.push({
            tournament_id: tournamentId,
            phase: 'SF',
            group_name: null,
            round_number: 1,
            match_number: i + 1,
            team1_id: rank1[i].teamId,
            team2_id: rank2[i].teamId,
            status: 'scheduled',
            is_bye: false,
          });
        }
      }
    } else {
      // Single group: #1 vs #4, #2 vs #3
      const g = groups[0];
      const s = standings[g];
      if (s.length === 4) {
        // Only 4 teams: top 2 go straight to Final
        sfInserts = [
          {
            tournament_id: tournamentId,
            phase: 'F',
            group_name: null,
            round_number: 1,
            match_number: 1,
            team1_id: s[0].teamId,
            team2_id: s[1].teamId,
            status: 'scheduled',
            is_bye: false,
          },
        ];
      } else if (s.length > 4) {
        sfInserts = [
          {
            tournament_id: tournamentId,
            phase: 'SF',
            group_name: null,
            round_number: 1,
            match_number: 1,
            team1_id: s[0].teamId,
            team2_id: s[3].teamId,
            status: 'scheduled',
            is_bye: false,
          },
          {
            tournament_id: tournamentId,
            phase: 'SF',
            group_name: null,
            round_number: 1,
            match_number: 2,
            team1_id: s[1].teamId,
            team2_id: s[2].teamId,
            status: 'scheduled',
            is_bye: false,
          },
        ];
      } else if (s.length >= 2) {
        // Only 2-3 teams: direct final
        sfInserts = [
          {
            tournament_id: tournamentId,
            phase: 'F',
            group_name: null,
            round_number: 1,
            match_number: 1,
            team1_id: s[0].teamId,
            team2_id: s[1].teamId,
            status: 'scheduled',
            is_bye: false,
          },
        ];
      }
    }

    if (sfInserts.length === 0) {
      throw new Error('Tidak cukup tim untuk babak knockout.');
    }

    const { error: insertErr } = await supabase.from('matches').insert(sfInserts);
    if (insertErr) throw new Error(insertErr.message);

    return { success: true, matchesCreated: sfInserts.length, phase: sfInserts[0].phase };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ─── Generate Final from SF results ────────────────────────────────────────────

export async function generateFinal(tournamentId: string) {
  const supabase = createClient();

  try {
    const { data: matchesData, error: mErr } = await supabase
      .from('matches')
      .select('id, phase, group_name, team1_id, team2_id, score_team1, score_team2, winner_team_id, status, is_bye')
      .eq('tournament_id', tournamentId);
    if (mErr) throw new Error(mErr.message);

    const matches = (matchesData ?? []) as MatchRow[];
    const sfMatches = matches.filter((m) => m.phase === 'SF');

    if (sfMatches.length === 0) {
      throw new Error('Tidak ada pertandingan Semi Final.');
    }
    if (!sfMatches.every((m) => m.status === 'completed')) {
      throw new Error('Semua pertandingan Semi Final harus selesai terlebih dahulu.');
    }
    if (hasFinalPhase(matches)) {
      throw new Error('Babak Final sudah pernah di-generate.');
    }

    // Winners go to Final, losers go to 3rd place
    const winners: string[] = [];
    const losers: string[] = [];

    sfMatches.forEach((m) => {
      if (m.winner_team_id) {
        winners.push(m.winner_team_id);
        const loserId = m.team1_id === m.winner_team_id ? m.team2_id : m.team1_id;
        if (loserId) losers.push(loserId);
      }
    });

    if (winners.length < 2) {
      throw new Error('Minimal 2 pemenang SF dibutuhkan untuk Final.');
    }

    const finalInserts: KnockoutMatchInsert[] = [
      {
        tournament_id: tournamentId,
        phase: 'F',
        group_name: null,
        round_number: 1,
        match_number: 1,
        team1_id: winners[0],
        team2_id: winners[1],
        status: 'scheduled',
        is_bye: false,
      },
    ];

    // 3rd place match if we have 2 losers
    if (losers.length >= 2) {
      finalInserts.push({
        tournament_id: tournamentId,
        phase: '3RD',
        group_name: null,
        round_number: 1,
        match_number: 1,
        team1_id: losers[0],
        team2_id: losers[1],
        status: 'scheduled',
        is_bye: false,
      });
    }

    const { error: insertErr } = await supabase.from('matches').insert(finalInserts);
    if (insertErr) throw new Error(insertErr.message);

    return { success: true, matchesCreated: finalInserts.length };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
