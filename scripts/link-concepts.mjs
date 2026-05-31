import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// Load environment variables manually from .env.local
const envPath = path.join(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    let value = trimmed.slice(index + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const STOP_WORDS = new Set([
  'the', 'of', 'and', 'in', 'to', 'a', 'is', 'for', 'with', 'on', 'at', 'by', 'an', 'be', 'as',
  'theory', 'model', 'approach', 'stages', 'process', 'type', 'types', 'perspective', 'framework',
  'concept', 'concepts', 'core', 'basic', 'foundations', 'foundation', 'introduction', 'overview',
  'other', 'miscellaneous', 'application', 'applications', 'critique', 'comparison', 'limitations',
  'ethics', 'ethical', 'exam', 'synthesis', 'indian', 'context', 'advanced', 'key', 'special',
  'topics', 'methods', 'techniques', 'issues', 'principles'
]);

function normalizeText(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

async function fetchAllConcepts() {
  const pageSize = 1000;
  const concepts = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('concept_tree')
      .select('id, name, definition, key_theorists, domain, course_primary_code')
      .order('id', { ascending: true })
      .range(from, to);

    if (error) {
      throw error;
    }

    concepts.push(...(data ?? []));

    if (!data || data.length < pageSize) {
      return concepts;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const writeToDb = args.includes('--write');
  
  console.log('Fetching all concepts from concept_tree...');
  const concepts = await fetchAllConcepts();
  
  console.log(`Fetched ${concepts.length} concepts.`);
  
  // Build lookup lists
  const processed = concepts.map(c => {
    const theorists = Array.isArray(c.key_theorists) 
      ? c.key_theorists.map(t => t.toLowerCase().trim()) 
      : [];
    const tokens = normalizeText(c.name);
    return {
      ...c,
      theorists,
      tokens
    };
  });
  
  console.log('Analyzing connections...');
  const links = new Map(); // id -> set of related ids
  
  for (let i = 0; i < processed.length; i++) {
    const a = processed[i];
    if (!links.has(a.id)) links.set(a.id, new Set());
    
    for (let j = i + 1; j < processed.length; j++) {
      const b = processed[j];
      if (!links.has(b.id)) links.set(b.id, new Set());
      
      // Skip linking within same course
      if (a.course_primary_code === b.course_primary_code && a.course_primary_code !== null) {
        continue;
      }
      
      let isRelated = false;
      
      // Rule 1: Shared Theorists
      if (a.theorists.length > 0 && b.theorists.length > 0) {
        const shared = a.theorists.filter(t => b.theorists.includes(t));
        if (shared.length > 0) {
          isRelated = true;
        }
      }
      
      // Rule 2: Title word matches (high overlap)
      if (!isRelated && a.tokens.length > 0 && b.tokens.length > 0) {
        const sharedTokens = a.tokens.filter(t => b.tokens.includes(t));
        const minLength = Math.min(a.tokens.length, b.tokens.length);
        
        if (sharedTokens.length >= 2 || (sharedTokens.length >= 1 && minLength === 1 && sharedTokens[0].length >= 5)) {
          isRelated = true;
        }
      }
      
      // Rule 3: Name mention in description/definition
      if (!isRelated) {
        const aNameLower = a.name.toLowerCase();
        const bNameLower = b.name.toLowerCase();
        
        if (b.definition && b.definition.toLowerCase().includes(aNameLower)) {
          isRelated = true;
        } else if (a.definition && a.definition.toLowerCase().includes(bNameLower)) {
          isRelated = true;
        }
      }
      
      if (isRelated) {
        links.get(a.id).add(b.id);
        links.get(b.id).add(a.id);
      }
    }
  }
  
  // Summarize matches
  let totalLinks = 0;
  const sampleLinks = [];
  
  for (const [id, relatedSet] of links.entries()) {
    if (relatedSet.size > 0) {
      totalLinks += relatedSet.size;
      const c = processed.find(x => x.id === id);
      const relatedNames = Array.from(relatedSet).map(rid => {
        const rc = processed.find(x => x.id === rid);
        return `${rc.name} (${rc.course_primary_code})`;
      });
      if (sampleLinks.length < 15) {
        sampleLinks.push({
          concept: `${c.name} (${c.course_primary_code})`,
          related: relatedNames.slice(0, 3).join(', ') + (relatedNames.length > 3 ? ` (+${relatedNames.length - 3} more)` : '')
        });
      }
    }
  }
  
  console.log(`\nFound ${totalLinks / 2} total bi-directional semantic connections.`);
  console.log('\nSample Connections:');
  console.table(sampleLinks);
  
  if (!writeToDb) {
    console.log('\n[DRY RUN] No database changes made. Run with --write flag to update database.');
    return;
  }
  
  console.log('\nWriting links to database...');
  let updatedCount = 0;
  for (const [id, relatedSet] of links.entries()) {
    const relatedIds = Array.from(relatedSet);
    const { error: updateError } = await supabase
      .from('concept_tree')
      .update({ related_nodes: relatedIds })
      .eq('id', id);

    if (updateError) {
      console.error(`Failed to update concept ${id}:`, updateError);
    } else {
      updatedCount++;
    }
  }
  
  console.log(`Successfully updated related_nodes for ${updatedCount} concept rows.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
