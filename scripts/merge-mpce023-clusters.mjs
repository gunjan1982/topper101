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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('=== MPCE-023 Cluster Merger Migration ===');

  // 1. Get course ID for MPCE-023
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('id')
    .eq('code', 'MPCE-023')
    .single();

  if (courseErr || !course) {
    console.error('Could not find course MPCE-023 in database:', courseErr);
    process.exit(1);
  }

  const courseId = course.id;
  console.log(`Found course MPCE-023. ID: ${courseId}`);

  // 2. Fetch the target clusters
  const { data: clusters, error: clustersErr } = await supabase
    .from('topic_clusters')
    .select('id, cluster_name, frequency_count')
    .eq('course_id', courseId)
    .in('cluster_name', [
      'Behaviour Modification and Techniques',
      'Self-Management and Cognitive Behaviour Modification'
    ]);

  if (clustersErr) {
    console.error('Error fetching clusters:', clustersErr);
    process.exit(1);
  }

  console.log(`Found ${clusters.length} matching clusters to merge.`);
  
  const primaryCluster = clusters.find(c => c.cluster_name === 'Behaviour Modification and Techniques');
  const redundantCluster = clusters.find(c => c.cluster_name === 'Self-Management and Cognitive Behaviour Modification');

  if (!primaryCluster) {
    console.log('Primary cluster "Behaviour Modification and Techniques" not found in DB. Skipping merge.');
    return;
  }

  if (!redundantCluster) {
    console.log('Redundant cluster already merged or missing. Skipping merge.');
    return;
  }

  console.log(`Primary Cluster: "${primaryCluster.cluster_name}" (ID: ${primaryCluster.id})`);
  console.log(`Redundant Cluster: "${redundantCluster.cluster_name}" (ID: ${redundantCluster.id})`);

  // 3. Update questions pointing to redundant topic name
  console.log('\nUpdating questions referencing redundant topic name...');
  const { data: updatedQs, error: updateErr } = await supabase
    .from('questions')
    .update({ topic: 'Behaviour Modification and Techniques' })
    .eq('course_id', courseId)
    .eq('topic', 'Self-Management and Cognitive Behaviour Modification')
    .select('id');

  if (updateErr) {
    console.error('Failed to update questions:', updateErr);
    process.exit(1);
  }

  console.log(`Successfully re-routed ${updatedQs.length} questions to the primary topic.`);

  // 4. Delete the redundant cluster row
  console.log('\nDeleting redundant cluster from DB...');
  const { error: deleteErr } = await supabase
    .from('topic_clusters')
    .delete()
    .eq('id', redundantCluster.id);

  if (deleteErr) {
    console.error('Failed to delete redundant cluster:', deleteErr);
    process.exit(1);
  }
  console.log('Redundant cluster deleted successfully.');

  // 5. Recalculate frequency_count for primary cluster
  console.log('\nRecalculating frequency counts for primary cluster...');
  const { data: currentQuestions, error: countErr } = await supabase
    .from('questions')
    .select('id')
    .eq('course_id', courseId)
    .eq('topic', 'Behaviour Modification and Techniques');

  if (countErr) {
    console.error('Failed to count questions:', countErr);
    process.exit(1);
  }

  const newCount = currentQuestions.length;
  console.log(`Total questions now in primary cluster: ${newCount}`);

  // Determine new frequency tier based on count (e.g. >10 high, >5 medium, else low)
  const newTier = newCount > 10 ? 'HIGH' : newCount > 5 ? 'MEDIUM' : 'LOW';

  const { error: updateClusterErr } = await supabase
    .from('topic_clusters')
    .update({
      frequency_count: newCount,
      frequency_tier: newTier
    })
    .eq('id', primaryCluster.id);

  if (updateClusterErr) {
    console.error('Failed to update primary cluster count:', updateClusterErr);
    process.exit(1);
  }

  console.log(`Primary cluster updated with count: ${newCount}, tier: ${newTier}`);
  console.log('\n=== Merge Completed Successfully ===');
}

run();
