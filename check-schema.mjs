import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xicsacodwtyakmzxbioc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc4NzU3MywiZXhwIjoyMDkwMzYzNTczfQ.mlS-6xEUZXCqI4vTQU031sZSpKFexxvjgRRCceE15CI'
);

async function checkSchema() {
  const { error } = await supabase
    .from('gallery')
    .update({ uploaded_by: 'Admin' })
    .eq('id', '2c1713de-d2b2-4d45-87cb-417e6dfdd97f');
    
  console.log("Error:", error?.message);
}

checkSchema();
