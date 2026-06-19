import { createClient } from '@/lib/supabase/client';

export interface KnockoutMatchInsert {
  tournament_id: string;
  phase: string;
  group_name: string | null;
  round_number: number;
  match_number: number;
  team1_id: string;
  team2_id: string;
  status: string;
  is_bye: boolean;
}

export const KNOCKOUT_PHASES = ['RR', 'R32', 'R16', 'QF', 'SF', 'F', '3RD'];

function getPhaseIndex(phase: string | null): number {
  if (!phase) return 0;
  return KNOCKOUT_PHASES.indexOf(phase);
}

export function getCurrentDeepestPhase(matches: { phase: string | null }[]): string {
  let deepest = 0;
  for (const m of matches) {
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

function getExpectedMatchCount(phase: string): number {
  switch (phase) {
    case 'R32': return 16;
    case 'R16': return 8;
    case 'QF': return 4;
    case 'SF': return 2;
    case 'F': return 1;
    default: return 0;
  }
}
