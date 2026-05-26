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
  // Clear any existing concepts (should be 0 anyway)
  await supabase.from('concept_tree').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const sampleConcepts = [
    {
      layer: 1,
      domain: 'Cognitive Architecture',
      name: 'Working Memory Model',
      definition: 'A multi-component system responsible for the temporary storage and manipulation of information during cognitive tasks.',
      key_theorists: ['Baddeley', 'Hitch'],
      clinical_relevance: 'Deficits in working memory are associated with ADHD, schizophrenia, and reading difficulties.',
      exam_relevance: 'HIGH',
      mapped_courses: ['MPC-001'],
      sample_answer_hook: 'According to Baddeley and Hitch, working memory consists of the central executive, phonological loop, visoyspatial sketchpad, and episodic buffer.'
    },
    {
      layer: 2,
      domain: 'Cognitive Architecture',
      name: 'Phonological Loop',
      definition: 'A component of working memory that deals with spoken and written material, consisting of the phonological store and articulatory control process.',
      key_theorists: ['Baddeley'],
      clinical_relevance: 'Crucial for language acquisition; impairment leads to developmental language disorders.',
      exam_relevance: 'MEDIUM',
      mapped_courses: ['MPC-001'],
      sample_answer_hook: 'The phonological loop acts as an "inner voice" to rehearse verbal information.'
    },
    {
      layer: 1,
      domain: 'Neuropsychology',
      name: 'Neuroplasticity',
      definition: 'The ability of the brain to reorganize itself by forming new neural connections throughout life in response to learning or experience.',
      key_theorists: ['Donald Hebb', 'Michael Merzenich'],
      clinical_relevance: 'Underpins stroke rehabilitation, learning therapy, and recovery from traumatic brain injury.',
      exam_relevance: 'HIGH',
      mapped_courses: ['MPC-001'],
      sample_answer_hook: 'Donald Hebb famously summarized neuroplasticity with the phrase: "neurons that fire together, wire together."'
    },
    {
      layer: 3,
      domain: 'Developmental Frameworks',
      name: 'Stages of Cognitive Development',
      definition: 'Piagets theory proposing that children progress through four distinct stages of mental development: sensorimotor, preoperational, concrete operational, and formal operational.',
      key_theorists: ['Jean Piaget'],
      clinical_relevance: 'Helps pediatricians and educational psychologists gauge child development milestones and intellectual delays.',
      exam_relevance: 'HIGH',
      mapped_courses: ['MPC-002']
    },
    {
      layer: 4,
      domain: 'Developmental Frameworks',
      name: 'Zone of Proximal Development (ZPD)',
      definition: 'The distance between what a learner can do without help and what they can do with help, emphasizing the social context of learning.',
      key_theorists: ['Lev Vygotsky'],
      clinical_relevance: 'Applied in scaffolding therapies for children with learning disabilities and educational interventions.',
      exam_relevance: 'MEDIUM',
      mapped_courses: ['MPC-002']
    }
  ];

  const { data, error } = await supabase.from('concept_tree').insert(sampleConcepts).select();
  if (error) {
    console.error('Error seeding concepts:', error);
  } else {
    console.log('Seeded concepts successfully. Row count:', data.length);
  }
}

run();
