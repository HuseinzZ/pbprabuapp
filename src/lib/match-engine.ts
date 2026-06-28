import { createClient } from '@/lib/supabase/client';
import { generateFirstKnockoutRoundInserts } from '@/lib/utils/knockout-engine';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PlayerSlot {
  id: string;
  fullname: string;
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

export function assignGroups(teams: any[]): any[] {
  const activeTeams = teams.filter(t => !t.is_bye_team);
  const byes = teams.filter(t => t.is_bye_team);
  
  const groupCount = activeTeams.length <= 5 ? 1 : 2;
  const groupNames = ['A', 'B'];

  activeTeams.forEach((team, i) => {
    team.group_name = groupNames[i % groupCount];
  });

  return [...activeTeams, ...byes];
}

// ─── Round-Robin Match Generator ───────────────────────────────────────────────

export function generateRRMatches(
  tournamentId: string,
  sessionId: string | null,
  teams: any[],
  category: string | null
): any[] {
  const matchInserts: any[] = [];
  const groups = [...new Set(teams.filter(t => !t.is_bye_team).map(t => t.group_name).filter(Boolean))];
  
  let globalMatchNum = 1;

  for (const group of groups) {
    const groupTeams = teams.filter(t => t.group_name === group && !t.is_bye_team);
    
    // Kombinasi RR
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        matchInserts.push({
          tournament_id: tournamentId,
          spin_session_id: sessionId,
          phase: 'RR',
          group_name: group,
          round_number: 1,
          match_number: globalMatchNum++,
          team1_id: groupTeams[i].id,
          team2_id: groupTeams[j].id,
          status: 'scheduled',
          is_bye: false
        });
      }
    }
  }

  return matchInserts;
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

    // DYNAMIC GROUP ASSIGNMENT
    const activePairCount = pairs.filter(p => !p.p2.isBye && !p.p1.isBye).length;
    const groupCount = activePairCount <= 5 ? 1 : 2;
    const groupNames = ['A', 'B'];
    let activeIdx = 0;

    const teamInserts = pairs.map((pair, pos) => {
      const isBye = pair.p2.isBye || pair.p1.isBye || false;
      const gName = isBye ? null : groupNames[activeIdx++ % groupCount];
      
      return {
        tournament_id: tournamentId,
        spin_session_id: sessionId,
        name: isBye
          ? `${pair.p1.fullname} (BYE)`
          : `${pair.p1.fullname} / ${pair.p2.fullname}`,
        player1_id: pair.p1.isBye ? null : pair.p1.id,
        player2_id: pair.p2.isBye ? null : pair.p2.id,
        is_bye_team: isBye,
        group_name: gName,
        group_position: pos + 1,
        spin_order: pos + 1,
      };
    });

    const { data: insertedTeams, error: teamError } = await supabase
      .from('teams')
      .insert(teamInserts)
      .select('id, player1_id, player2_id, is_bye_team, group_name, group_position');

    if (teamError) throw new Error(`Gagal insert teams: ${teamError.message}`);
    if (!insertedTeams) return { success: false, error: 'Gagal mendapatkan data tim.' };

    const activeTeams = insertedTeams.filter(t => !t.is_bye_team);
    const matchInserts = generateRRMatches(tournamentId, sessionId, activeTeams, null);

    if (matchInserts.length > 0) {
      const { error: matchError } = await supabase.from('matches').insert(matchInserts);
      if (matchError) throw new Error(`Gagal insert matches: ${matchError.message}`);
      totalMatchesCreated += matchInserts.length;
    }

    return { success: true, totalMatches: totalMatchesCreated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}

// ─── Generate Schedule From Participants (for Tunggal format) ──────────────────

export interface ParticipantSlot {
  playerId: string;
  fullName: string;
}

export async function generateScheduleFromParticipants(
  tournamentId: string,
  participants: ParticipantSlot[],
  category?: string | null
) {
  const supabase = createClient();

  try {
    // 1. Hapus data lama (idempotent, tanpa spin_session_id)
    await supabase.from('matches').delete()
      .eq('tournament_id', tournamentId)
      .is('spin_session_id', null);
    await supabase.from('teams').delete()
      .eq('tournament_id', tournamentId)
      .is('spin_session_id', null);

    let totalMatchesCreated = 0;

    // DYNAMIC GROUP ASSIGNMENT
    const activeCount = participants.length;
    const groupCount = activeCount <= 5 ? 1 : 2;
    const groupNames = ['A', 'B'];
    let activeIdx = 0;

    const teamInserts = participants.map((p, pos) => ({
      tournament_id: tournamentId,
      spin_session_id: null,
      name: p.fullName,
      player1_id: p.playerId,
      player2_id: null,
      is_bye_team: false,
      group_name: groupNames[activeIdx++ % groupCount],
      group_position: pos + 1,
      spin_order: pos + 1,
    }));

    const { data: insertedTeams, error: teamError } = await supabase
      .from('teams').insert(teamInserts)
      .select('id, player1_id, is_bye_team, group_name, group_position');

    if (teamError) throw new Error(`Gagal insert teams: ${teamError.message}`);
    if (!insertedTeams) return { success: false, error: 'Gagal mendapatkan data tim.' };

    const activeTeams = insertedTeams.filter(t => !t.is_bye_team);
    const matchInserts = generateRRMatches(tournamentId, null, activeTeams, category || null);

    if (matchInserts.length > 0) {
      const { error: matchError } = await supabase.from('matches').insert(matchInserts);
      if (matchError) throw new Error(`Gagal insert matches: ${matchError.message}`);
      totalMatchesCreated += matchInserts.length;
    }

    // (Round Robin logic has been completely removed)

    return { success: true, totalMatches: totalMatchesCreated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}
