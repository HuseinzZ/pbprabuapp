import { createClient } from '@/lib/supabase/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PlayerSlot {
  id: string;
  full_name: string;
  isBye?: boolean;
}

export interface Pair {
  p1: PlayerSlot;
  p2: PlayerSlot;
}

export interface GroupResult {
  groupName: string;
  teams: Pair[];
  matches: null[];
}

// ─── Assign Groups ─────────────────────────────────────────────────────────────

export function assignGroups(pairs: { p1: PlayerSlot; p2: PlayerSlot; spinOrder: number }[]): GroupResult[] {
  const groups: GroupResult[] = [];
  const groupNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < pairs.length; i += 4) {
    const chunk = pairs.slice(i, i + 4);
    const teamCount = chunk.length;
    const matchCount = (teamCount * (teamCount - 1)) / 2;
    groups.push({
      groupName: groupNames[groups.length] || `G${groups.length + 1}`,
      teams: chunk,
      matches: Array.from({ length: matchCount }, () => null),
    });
  }
  return groups;
}

// ─── Round-Robin Match Generator ───────────────────────────────────────────────

function generateRoundRobinPairs(count: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < count - 1; i++) {
    for (let j = i + 1; j < count; j++) {
      pairs.push([i, j]);
    }
  }
  return pairs;
}

// ─── Generate Schedule From Spin ───────────────────────────────────────────────

export async function generateScheduleFromSpin(
  tournamentId: string,
  sessionId: string,
  pairs: Pair[]
) {
  const supabase = createClient();

  try {
    // 1. Hapus data lama untuk sesi ini (idempotent)
    await supabase.from('matches').delete().eq('spin_session_id', sessionId);
    await supabase.from('teams').delete().eq('spin_session_id', sessionId);

    let totalMatchesCreated = 0;

    // DIRECT KNOCKOUT LOGIC IF <= 2 TEAMS
    if (pairs.length <= 2) {
      const teamInserts = pairs.map((pair, pos) => ({
        tournament_id: tournamentId,
        spin_session_id: sessionId,
        name: pair.p2.isBye
          ? `${pair.p1.full_name} (BYE)`
          : `${pair.p1.full_name} / ${pair.p2.full_name}`,
        player1_id: pair.p1.isBye ? null : pair.p1.id,
        player2_id: pair.p2.isBye ? null : pair.p2.id,
        is_bye_team: pair.p2.isBye || pair.p1.isBye || false,
        group_name: null,
        group_position: pos + 1,
        spin_order: pos + 1,
      }));

      const { data: insertedTeams, error: teamError } = await supabase
        .from('teams')
        .insert(teamInserts)
        .select('id, player1_id, player2_id, is_bye_team, group_position');

      if (teamError) throw new Error(`Gagal insert teams: ${teamError.message}`);
      if (!insertedTeams) return { success: false, error: 'Gagal mendapatkan data tim.' };

      const activeTeams = insertedTeams.filter(t => !t.is_bye_team);
      const matchInserts: any[] = [];

      if (activeTeams.length <= 2) {
        // Direct Final
        if (activeTeams.length === 2) {
          matchInserts.push({
            tournament_id: tournamentId, spin_session_id: sessionId,
            phase: 'F', group_name: null, round_number: 1, match_number: 1,
            team1_id: activeTeams[0].id, team2_id: activeTeams[1].id,
            status: 'scheduled', is_bye: false,
          });
        }
      } else {
        // Semi Final
        matchInserts.push({
          tournament_id: tournamentId, spin_session_id: sessionId,
          phase: 'SF', group_name: null, round_number: 1, match_number: 1,
          team1_id: activeTeams[0].id, team2_id: activeTeams[1].id,
          status: 'scheduled', is_bye: false,
        });

        if (activeTeams.length === 4) {
          matchInserts.push({
            tournament_id: tournamentId, spin_session_id: sessionId,
            phase: 'SF', group_name: null, round_number: 1, match_number: 2,
            team1_id: activeTeams[2].id, team2_id: activeTeams[3].id,
            status: 'scheduled', is_bye: false,
          });
        } else if (activeTeams.length === 3) {
          matchInserts.push({
            tournament_id: tournamentId, spin_session_id: sessionId,
            phase: 'SF', group_name: null, round_number: 1, match_number: 2,
            team1_id: activeTeams[2].id, team2_id: null,
            status: 'completed', winner_team_id: activeTeams[2].id, is_bye: true,
          });
        }
      }

      if (matchInserts.length > 0) {
        const { error: matchError } = await supabase.from('matches').insert(matchInserts);
        if (matchError) throw new Error(`Gagal insert matches: ${matchError.message}`);
        totalMatchesCreated += matchInserts.length;
      }

      return { success: true, totalMatches: totalMatchesCreated };
    }

    // ROUND ROBIN LOGIC IF > 4 TEAMS
    const groups = assignGroups(pairs.map((p, i) => ({ ...p, spinOrder: i + 1 })));



    for (const group of groups) {
      // 2. Insert teams untuk grup ini
      const teamInserts = group.teams.map((pair, pos) => ({
        tournament_id: tournamentId,
        spin_session_id: sessionId,
        name: pair.p2.isBye
          ? `${pair.p1.full_name} (BYE)`
          : `${pair.p1.full_name} / ${pair.p2.full_name}`,
        player1_id: pair.p1.isBye ? null : pair.p1.id,
        player2_id: pair.p2.isBye ? null : pair.p2.id,
        is_bye_team: pair.p2.isBye || pair.p1.isBye || false,
        group_name: group.groupName,
        group_position: pos + 1,
        spin_order: pos + 1,
      }));

      const { data: insertedTeams, error: teamError } = await supabase
        .from('teams')
        .insert(teamInserts)
        .select('id, player1_id, player2_id, is_bye_team, group_position');

      if (teamError) throw new Error(`Gagal insert teams grup ${group.groupName}: ${teamError.message}`);
      if (!insertedTeams) continue;

      // Filter out BYE teams dari pertandingan
      const activeTeams = insertedTeams.filter(t => !t.is_bye_team);

      // 3. Generate jadwal Round-Robin antar tim aktif dalam grup
      const rrPairs = generateRoundRobinPairs(activeTeams.length);
      let roundNumber = 1;

      const matchInserts = rrPairs.map(([ i, j ], matchIdx) => ({
        tournament_id: tournamentId,
        spin_session_id: sessionId,
        phase: 'RR',
        group_name: group.groupName,
        round_number: roundNumber++,
        match_number: matchIdx + 1,
        team1_id: activeTeams[i].id,
        team2_id: activeTeams[j].id,
        status: 'scheduled',
        is_bye: false,
      }));

      if (matchInserts.length > 0) {
        const { error: matchError } = await supabase.from('matches').insert(matchInserts);
        if (matchError) throw new Error(`Gagal insert matches grup ${group.groupName}: ${matchError.message}`);
        totalMatchesCreated += matchInserts.length;
      }
    }

    return { success: true, totalMatches: totalMatchesCreated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}
