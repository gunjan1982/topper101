import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sync() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`Starting recount of cluster frequencies (${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'})...`);

  // Fetch all topic clusters
  const { data: clusters, error: clustersErr } = await supabase
    .from('topic_clusters')
    .select('*');

  if (clustersErr) {
    console.error('Error fetching clusters:', clustersErr);
    return;
  }

  // Fetch all questions with required fields
  const { data: allQuestions, error: questionsErr } = await supabase
    .from('questions')
    .select('course_id, topic, year, session');

  if (questionsErr) {
    console.error('Error fetching questions:', questionsErr);
    return;
  }

  console.log(`Loaded ${clusters.length} clusters and ${allQuestions.length} questions.`);

  let updateCount = 0;

  for (const cluster of clusters) {
    // Filter questions mapped to this cluster
    const clusterQuestions = allQuestions.filter(q => 
      q.course_id === cluster.course_id && q.topic === cluster.cluster_name
    );

    // Calculate unique TEE sessions
    const papers = new Set(clusterQuestions.map(q => `${q.session}-${q.year}`));
    const actualCount = papers.size;

    // Calculate tier
    let actualTier = 'LOW';
    if (actualCount >= 5) {
      actualTier = 'HIGH';
    } else if (actualCount >= 3) {
      actualTier = 'MEDIUM';
    }

    const needsUpdate = 
      cluster.frequency_count !== actualCount || 
      cluster.frequency_tier !== actualTier;

    if (needsUpdate) {
      console.log(`Cluster "${cluster.cluster_name}" (Course ID: ${cluster.course_id}):`);
      console.log(`  Stored: count=${cluster.frequency_count}, tier=${cluster.frequency_tier}`);
      console.log(`  Actual: count=${actualCount}, tier=${actualTier}`);
      updateCount++;

      if (!isDryRun) {
        const { error: updateErr } = await supabase
          .from('topic_clusters')
          .update({
            frequency_count: actualCount,
            frequency_tier: actualTier
          })
          .eq('id', cluster.id);

        if (updateErr) {
          console.error(`  Failed to update cluster ${cluster.id}:`, updateErr.message);
        } else {
          console.log(`  Updated successfully.`);
        }
      }
    }
  }

  console.log(`\nRecount complete. Total clusters needing updates: ${updateCount}`);
}

sync();
