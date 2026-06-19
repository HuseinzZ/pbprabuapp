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

export const KNOCKOUT_PHASES = ['RR', 'R32', 'R16', 'QF', 'SF', 'F'];

function getPhaseIndex(phase: string | null): number {
  if (!phase) return 0;
  const idx = KNOCKOUT_PHASES.indexOf(phase);
  return idx === -1 ? 0 : idx;
}

export function getCurrentDeepestPhase(matches: MatchRow[]): string {
  let deepest = 0;
  for (const m of matches) {
    if (m.phase === 'F') return 'F';
    const idx = getPhaseIndex(m.phase);
    if (idx > deepest) deepest = idx;
  }
  return KNOCKOUT_PHASES[deepest];
}

export function getNextPhaseLabel(teamCount: number): string {
  if (teamCount > 16) return 'R32';
  if (teamCount > 8) return 'R16';
  if (teamCount > 4) return 'QF';
  if (teamCount > 2) return 'SF';
  return 'F';
}

export function isPhaseComplete(matches: MatchRow[], phase: string, teams: TeamRow[]): boolean {
  if (phase === 'RR') {
    return isAllRRComplete(matches, teams);
  }
  const phaseMatches = matches.filter((m) => m.phase === phase);
  if (phaseMatches.length === 0) return false;
  return phaseMatches.every((m) => m.status === 'completed' || m.is_bye);
}

// ─── Generate Generic First Knockout Bracket ─────────────────────────────

export function generateFirstKnockoutRoundInserts(
  tournamentId: string,
  sessionId: string | null,
  activeTeams: any[],
  category: string | null
): any[] {
  const teamCount = activeTeams.length;
  if (teamCount < 2) return [];

  let P = 1;
  while (P < teamCount) P *= 2;

  const byes = P - teamCount;
  const matchCount = P / 2;
  const phase = getNextPhaseLabel(P);

  const matchHasBye = new Array(matchCount).fill(false);
  if (byes > 0) matchHasBye[0] = true;
  if (byes > 1) matchHasBye[matchCount - 1] = true;
  if (byes > 2) matchHasBye[Math.floor(matchCount / 2)] = true;
  if (byes > 3) matchHasBye[Math.floor(matchCount / 2) - 1] = true;
  
  let currentByes = matchHasBye.filter(Boolean).length;
  let idx = 0;
  while (currentByes < byes) {
    if (!matchHasBye[idx]) {
      matchHasBye[idx] = true;
      currentByes++;
    }
    idx++;
  }

  const matchInserts: any[] = [];
  let teamIdx = 0;

  for (let m = 1; m <= matchCount; m++) {
    if (matchHasBye[m - 1]) {
      const t = activeTeams[teamIdx++];
      matchInserts.push({
        tournament_id: tournamentId,
        spin_session_id: sessionId,
        phase,
        group_name: null,
        round_number: 1,
        match_number: m,
        team1_id: t.id,
        team2_id: null,
        status: 'completed',
        winner_team_id: t.id,
        is_bye: true,
        category: category || null
      });
    } else {
      const t1 = activeTeams[teamIdx++];
      const t2 = activeTeams[teamIdx++];
      matchInserts.push({
        tournament_id: tournamentId,
        spin_session_id: sessionId,
        phase,
        group_name: null,
        round_number: 1,
        match_number: m,
        team1_id: t1.id,
        team2_id: t2.id,
        status: 'scheduled',
        is_bye: false,
        category: category || null
      });
    }
  }

  return matchInserts;
}

// ─── Generate Next Knockout Phase ───────────────────────────────────────────────

export async function generateNextKnockoutPhase(tournamentId: string) {
  const supabase = createClient();

  try {
    const { data: matchesData, error: mErr } = await supabase
      .from('matches')
      .select('id, phase, group_name, team1_id, team2_id, score_team1, score_team2, winner_team_id, status, is_bye, match_number')
      .eq('tournament_id', tournamentId);
    if (mErr) throw new Error(mErr.message);

    const { data: teamsData, error: tErr } = await supabase
      .from('teams')
      .select('id, name, group_name, is_bye_team')
      .eq('tournament_id', tournamentId);
    if (tErr) throw new Error(tErr.message);

    const matches = (matchesData ?? []) as MatchRow[];
    const teams = (teamsData ?? []) as TeamRow[];

    const deepestPhase = getCurrentDeepestPhase(matches);

    if (deepestPhase === 'F') {
      throw new Error('Babak Final sudah pernah di-generate.');
    }

    if (!isPhaseComplete(matches, deepestPhase, teams)) {
      throw new Error(`Semua pertandingan pada babak ${deepestPhase} harus selesai terlebih dahulu.`);
    }

    let matchInserts: KnockoutMatchInsert[] = [];

    if (deepestPhase === 'RR') {
      // ─── Generate Bracket dari Babak Grup ───
      const standings = computeGroupStandings(matches, teams);
      const groups = Object.keys(standings).sort();

      const qualifiedTeams: { teamId: string; groupRank: number; groupName: string }[] = [];
      for (const g of groups) {
        const top2 = standings[g].slice(0, 2);
        top2.forEach((s) => qualifiedTeams.push({ teamId: s.teamId, groupRank: s.position, groupName: s.groupName }));
      }

      if (qualifiedTeams.length < 2) throw new Error('Tidak cukup tim untuk babak knockout.');

      const nextPhase = getNextPhaseLabel(qualifiedTeams.length);

      if (groups.length === 1) {
        // Single group: Juara 1 vs Juara 2 di Final
        const s = standings[groups[0]];
        if (s.length >= 2) {
          matchInserts = [
            { tournament_id: tournamentId, phase: 'F', group_name: null, round_number: 1, match_number: 1, team1_id: s[0].teamId, team2_id: s[1].teamId, status: 'scheduled', is_bye: false },
          ];
        }
      } else if (groups.length === 2) {
        // 2 groups: A1 vs B2, B1 vs A2
        const a1 = qualifiedTeams.find((t) => t.groupName === groups[0] && t.groupRank === 1)!;
        const a2 = qualifiedTeams.find((t) => t.groupName === groups[0] && t.groupRank === 2)!;
        const b1 = qualifiedTeams.find((t) => t.groupName === groups[1] && t.groupRank === 1)!;
        const b2 = qualifiedTeams.find((t) => t.groupName === groups[1] && t.groupRank === 2)!;

        matchInserts = [
          { tournament_id: tournamentId, phase: nextPhase, group_name: null, round_number: 1, match_number: 1, team1_id: a1.teamId, team2_id: b2.teamId, status: 'scheduled', is_bye: false },
          { tournament_id: tournamentId, phase: nextPhase, group_name: null, round_number: 1, match_number: 2, team1_id: b1.teamId, team2_id: a2.teamId, status: 'scheduled', is_bye: false },
        ];
      } else {
        // More than 2 groups: rank 1 vs rank 2 (silang)
        const rank1 = qualifiedTeams.filter((t) => t.groupRank === 1).sort((a, b) => a.groupName.localeCompare(b.groupName));
        const rank2 = qualifiedTeams.filter((t) => t.groupRank === 2).sort((a, b) => a.groupName.localeCompare(b.groupName)).reverse();

        const matchCount = Math.min(rank1.length, rank2.length);
        for (let i = 0; i < matchCount; i++) {
          matchInserts.push({
            tournament_id: tournamentId,
            phase: nextPhase,
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
      // ─── Generate Next Knockout dari Babak Sebelumnya ───
      const currentPhaseMatches = matches.filter((m) => m.phase === deepestPhase);
      const winners: string[] = [];
      const losers: string[] = [];

      // Sortir berdasarkan match_number agar pasangan berurutan (Pemenang M1 vs Pemenang M2)
      // Note: match_number mungkin ada di tipe lain, kita asumsikan ada atau urut id.
      currentPhaseMatches.sort((a: any, b: any) => (a.match_number || 0) - (b.match_number || 0));

      currentPhaseMatches.forEach((m) => {
        if (m.winner_team_id) {
          winners.push(m.winner_team_id);
          const loserId = m.team1_id === m.winner_team_id ? m.team2_id : m.team1_id;
          if (loserId) losers.push(loserId);
        }
      });

      if (winners.length < 2) throw new Error('Minimal 2 pemenang dibutuhkan untuk babak selanjutnya.');

      const nextPhase = getNextPhaseLabel(winners.length);

      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          matchInserts.push({
            tournament_id: tournamentId,
            phase: nextPhase,
            group_name: null,
            round_number: 1,
            match_number: (i / 2) + 1,
            team1_id: winners[i],
            team2_id: winners[i + 1],
            status: 'scheduled',
            is_bye: false,
          });
        }
      }


    }

    if (matchInserts.length === 0) throw new Error('Tidak cukup tim untuk babak selanjutnya.');

    const { error: insertErr } = await supabase.from('matches').insert(matchInserts);
    if (insertErr) throw new Error(insertErr.message);

    return { success: true, matchesCreated: matchInserts.length, phase: matchInserts[0].phase };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

