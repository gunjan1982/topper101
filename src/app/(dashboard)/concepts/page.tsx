import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import ConceptTreeClient from './ConceptTreeClient';

export const metadata = {
  title: 'Concept Tree — Topper101',
  description: 'Browse the psychology concept tree, categorized by domain and framework layer.',
};

export default async function ConceptsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  // Get user profile for plan_tier
  const { data: userData } = await supabase
    .from('users')
    .select('plan_tier')
    .eq('id', user.id)
    .single();

  const isPaid = userData?.plan_tier && userData.plan_tier !== 'free';

  // Fetch all concepts from concept_tree table
  const { data: concepts, error } = await supabase
    .from('concept_tree')
    .select('id, name, definition, key_theorists, clinical_relevance, exam_relevance, sample_answer_hook, domain, layer, mapped_courses')
    .order('domain')
    .order('layer');

  if (error) {
    console.error('Error fetching concepts:', error);
  }

  // Safely parse JSON arrays for theorists and mapped courses since Supabase jsonb gets returned as any
  const parsedConcepts = (concepts || []).map((concept) => {
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
    />
  );
}
