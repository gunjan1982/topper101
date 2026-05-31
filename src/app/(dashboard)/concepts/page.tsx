import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import ConceptTreeClient from './ConceptTreeClient';

export const metadata = {
  title: 'Concept Tree — Topper101',
  description: 'Browse the psychology concept tree, categorized by domain and framework layer.',
};

type RawConcept = {
  id: string;
  name: string;
  definition: string | null;
  key_theorists: string[] | string | null;
  clinical_relevance: string | null;
  exam_relevance: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  sample_answer_hook: string | null;
  domain: string;
  layer: number;
  mapped_courses: string[] | string | null;
};

async function fetchAllConcepts(supabase: Awaited<ReturnType<typeof createClient>>) {
  const pageSize = 1000;
  const concepts: RawConcept[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('concept_tree')
      .select('id, name, definition, key_theorists, clinical_relevance, exam_relevance, sample_answer_hook, domain, layer, mapped_courses')
      .order('domain')
      .order('layer')
      .range(from, from + pageSize - 1);

    if (error) {
      return { concepts, error };
    }

    concepts.push(...((data ?? []) as RawConcept[]));

    if (!data || data.length < pageSize) {
      return { concepts, error: null };
    }
  }
}

export default async function ConceptsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  // Get user profile for plan_tier, URNA waitlist status, credits, selected_papers
  const { data: userData } = await supabase
    .from('users')
    .select('plan_tier, urna_opt_in, credits, selected_papers')
    .eq('id', user.id)
    .single();

  const isPaid = userData?.plan_tier && userData.plan_tier !== 'free';
  const selectedPapers = (userData?.selected_papers as string[] | null) ?? [];
  const userCredits = userData?.credits ?? 0;

  // Fetch subject unlocks and concept tree unlocks
  const { data: entitlements } = await supabase
    .from('user_entitlements')
    .select('course_code, entitlement_type')
    .eq('user_id', user.id);

  const unlockedSubjects = (entitlements ?? [])
    .filter(e => e.entitlement_type === 'subject_unlock' && e.course_code)
    .map(e => e.course_code as string);

  const unlockedConceptTrees = (entitlements ?? [])
    .filter(e => e.entitlement_type === 'concept_tree_unlock' && e.course_code)
    .map(e => e.course_code as string);

  // Fetch all concepts from concept_tree table. Supabase caps plain selects at 1000 rows.
  const { concepts, error } = await fetchAllConcepts(supabase);

  if (error) {
    console.error('Error fetching concepts:', error);
  }

  // Safely parse JSON arrays for theorists and mapped courses since Supabase jsonb gets returned as any
  const parsedConcepts = concepts.map((concept) => {
    let theorists: string[] | null = null;
    if (concept.key_theorists) {
      if (Array.isArray(concept.key_theorists)) {
        theorists = concept.key_theorists as string[];
      } else if (typeof concept.key_theorists === 'string') {
        try {
          theorists = JSON.parse(concept.key_theorists);
        } catch {
          theorists = null;
        }
      }
    }

    let mappedCourses: string[] | null = null;
    if (concept.mapped_courses) {
      if (Array.isArray(concept.mapped_courses)) {
        mappedCourses = concept.mapped_courses as string[];
      } else if (typeof concept.mapped_courses === 'string') {
        try {
          mappedCourses = JSON.parse(concept.mapped_courses);
        } catch {
          mappedCourses = null;
        }
      }
    }

    return {
      ...concept,
      key_theorists: theorists,
      mapped_courses: mappedCourses,
    };
  });

  return (
    <ConceptTreeClient
      initialConcepts={parsedConcepts}
      isPaid={isPaid}
      initialUrnaOptIn={userData?.urna_opt_in ?? false}
      userEmail={user?.email ?? null}
      selectedPapers={selectedPapers}
      unlockedSubjects={unlockedSubjects}
      unlockedConceptTrees={unlockedConceptTrees}
      userCredits={userCredits}
    />
  );
}
