import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const MODEL = 'deepseek-chat';

type AssignmentQuestion = {
  question_text: string;
  marks?: number;
};

type AssignmentCourseJoin = {
  name: string;
};

type GeneratedAssignmentAnswer = {
  answer_text?: string;
  word_count?: number;
};

function getClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assignment_id, question_index } = body;

    if (!assignment_id || typeof question_index !== 'number') {
      return NextResponse.json({ error: 'Missing assignment_id or question_index' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Checking user tier
    const { data: userData } = await supabase
      .from('users')
      .select('plan_tier')
      .eq('id', user.id)
      .single();

    if (!userData || userData.plan_tier !== 'pro') {
      return NextResponse.json({ error: 'Assignment answer generation is not available yet' }, { status: 403 });
    }

    // 1. Check assignment_answers for an existing cached answer
    const { data: existingAnswer } = await supabase
      .from('assignment_answers')
      .select('content')
      .eq('user_id', user.id)
      .eq('assignment_id', assignment_id)
      .eq('question_index', question_index)
      .single();

    if (existingAnswer) {
      return NextResponse.json(existingAnswer.content);
    }

    // 2. Fetch the assignment and the course name
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select(`
        questions,
        courses (name)
      `)
      .eq('id', assignment_id)
      .single();

    if (assignmentError || !assignmentData) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const questionsArray = assignmentData.questions as AssignmentQuestion[];
    if (question_index < 0 || question_index >= questionsArray.length) {
      return NextResponse.json({ error: 'question_index out of bounds' }, { status: 400 });
    }

    const questionDetail = questionsArray[question_index];
    const courseJoin = assignmentData.courses as AssignmentCourseJoin | AssignmentCourseJoin[] | null;
    const courseName = (Array.isArray(courseJoin) ? courseJoin[0]?.name : courseJoin?.name) ?? 'IGNOU MAPC';
    const marks = questionDetail.marks || 10;
    
    // Set word counts constraints targeting structure
    let wordTarget = '600–800';
    if (marks <= 3) {
      wordTarget = '150–200';
    } else if (marks <= 6) {
      wordTarget = '350–450';
    }

    const promptText = `
You are an expert IGNOU MAPC examiner. Write a model answer for the IGNOU assignment question below.

Course: ${courseName}
Marks: ${marks}
Target length: ${wordTarget} words

Question: ${questionDetail.question_text}

Requirements:
- Write in essay format suitable for IGNOU assignment submission
- Structure: Introduction → Body paragraphs with subheadings → Conclusion
- Use correct psychological terminology
- Reference relevant theorists by name
- Do not claim the answer is copied from the IGNOU textbook or official IGNOU material
- If you add a simplification, modern example, memory aid, or explanation beyond the core textbook-aligned answer, wrap it exactly as [[AI_STUDY_NOTE]]...[[/AI_STUDY_NOTE]]
- Stay within the word count target

Return ONLY valid JSON:
{"answer_text": "...", "word_count": 0}
`.trim();

    // 4. Hit DeepSeek completion safely mapping JSON
    let aiResponse;
    let jsonContent: GeneratedAssignmentAnswer;
    
    try {
      // First attempt
      const completion = await getClient().chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: promptText }],
        response_format: { type: 'json_object' }
      });
      aiResponse = completion.choices[0].message.content || '{}';
      jsonContent = JSON.parse(aiResponse);
    } catch (e) {
      // Retry logic once mapped to structural breakdown
      console.warn('[DeepSeek] First attempt failed, retrying...', e);
      try {
        const retry = await getClient().chat.completions.create({
          model: MODEL,
          messages: [{ role: 'user', content: promptText }],
          response_format: { type: 'json_object' }
        });
        aiResponse = retry.choices[0].message.content || '{}';
        jsonContent = JSON.parse(aiResponse);
      } catch (retryError) {
        console.error('[DeepSeek] Retry ultimately failed', retryError);
        return NextResponse.json({ error: 'AI generation failed due to formatting layout.' }, { status: 500 });
      }
    }

    if (!jsonContent.answer_text) {
      return NextResponse.json({ error: 'LLM returned invalid response schema' }, { status: 500 });
    }

    // 5. Insert Cache Record Into DB
    const { error: insertError } = await supabase
      .from('assignment_answers')
      .insert({
        user_id: user.id,
        assignment_id: assignment_id,
        question_index: question_index,
        answer_type: 'generated',
        content: jsonContent,
      });

    if (insertError) {
      console.error('[Supabase Insert Error]', insertError);
      // Still return the generated content to user, just log cache failure
    }

    return NextResponse.json(jsonContent);
  } catch (error: unknown) {
    console.error('Assignment Generation API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
