import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const testPhases = ['RR', 'R32', 'R16', 'QF', 'SF', 'F', '3RD', 'Final', 'Third Place'];
  const results: any = {};

  for (const phase of testPhases) {
    const { data, error } = await supabase
      .from('matches')
      .insert([{
        tournament_id: '11111111-1111-1111-1111-111111111111',
        team1_id: '11111111-1111-1111-1111-111111111111',
        team2_id: '22222222-2222-2222-2222-222222222222',
        phase: phase,
        status: 'scheduled'
      }]);
    
    results[phase] = error ? error.message : 'success';
  }

  return NextResponse.json(results);
}
