const { createClient } = require('@supabase/supabase-js');
const url = 'https://xicsacodwtyakmzxbioc.supabase.co';
const key = 'sb_publishable_FAAPAgPmxkI1fX11hSiOoA_l9u0Ux9N';
const supabase = createClient(url, key);

async function check() {
  const { data: ph } = await supabase.from("point_histories").select("*");
  const { data: players } = await supabase.from("players").select("id, full_name, ranking_points");
  console.log('Point Histories:', ph);
  console.log('Players:', players);
}
check();
