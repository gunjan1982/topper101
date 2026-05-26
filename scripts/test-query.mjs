import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, error } = await supabase.rpc('get_columns', { table_name: 'concept_tree' });
  if (error) {
    // If get_columns RPC doesn't exist, run a raw query using select.
    // Since we don't have direct SQL runner, we can do a query to information_schema if there is a function or we can just try to fetch a row and see what keys are returned.
    const { data: rowData, error: rowError } = await supabase.from('concept_tree').select('*').limit(1);
    if (rowError) {
      console.error('Row fetch error:', rowError);
    } else {
      console.log('Fetched columns from empty row:', rowData);
    }
  } else {
    console.log('Columns:', data);
  }
}

run();
