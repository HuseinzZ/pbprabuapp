import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xicsacodwtyakmzxbioc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpY3NhY29kd3R5YWttenhiaW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc4NzU3MywiZXhwIjoyMDkwMzYzNTczfQ.mlS-6xEUZXCqI4vTQU031sZSpKFexxvjgRRCceE15CI'
);

async function run() {
  const { data: spinData, error: spinErr } = await supabase.from('spin').select('*');
  console.log('spin table error:', spinErr);
  
  const { data: sData, error: sErr } = await supabase.from('spin_wheel_sessions').select('*');
  console.log('spin_wheel_sessions table error:', sErr);

  const { data: tData, error: tErr } = await supabase.from('tim').select('*');
  console.log('tim table error:', tErr);

  const { data: teamsData, error: teamsErr } = await supabase.from('teams').select('*');
  console.log('teams table error:', teamsErr);
}

run().catch(console.error);
