export type GeminiVerificationResult = {
  valid_mapc: boolean;
  student_name: string | null;
  enrollment_number: string | null;
  document_type: 'admit_card' | 'id_card' | 'invalid';
  exam_session: string | null;
  extracted_papers: string[];
  is_tampered: boolean;
  tampering_reason: string | null;
};

/**
 * Invokes the Gemini 2.5 Flash multimodal API to parse an uploaded Admit Card or Student ID Card.
 * @param base64Data The base64-encoded string of the PDF or image file
 * @param mimeType The file mime type (e.g. image/png, image/jpeg, application/pdf)
 */
export async function parseVerificationDocument(
  base64Data: string,
  mimeType: string
): Promise<GeminiVerificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not defined.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const promptText = `
You are an expert OCR and document verification assistant for Topper101 (an exam prep portal for IGNOU MA Psychology - MAPC).
Your task is to analyze the provided Student Document (which is either an IGNOU Hall Ticket / Admit Card or an IGNOU Student Identity Card) and return verified structured data.

Carefully follow these guidelines:
1. Determine if the document belongs to an IGNOU student enrolled in "MAPC" or "Master of Arts (Psychology)" or "MA Psychology". If the programme name or code does not match MAPC / Psychology, set "valid_mapc" to false.
2. Identify the type of document:
   - "admit_card": If it is a Hall Ticket or Admit Card for a Term End Examination (TEE).
   - "id_card": If it is a Student Identity Card.
   - "invalid": If it is not a valid IGNOU card or not psychology.
3. Extract:
   - Name of the Student (normalize to uppercase, e.g. "GUNJAN AGGARWAL")
   - Enrollment Number (numeric string, typically 9 or 10 digits)
   - Exam Session (only for Admit Cards, e.g. "2025-DECEMBER", "2026-JUNE")
   - Registered Course Codes:
     - For Admit Cards (Hall Tickets): Extract the list of course codes from the Exam Time Table / Schedule section (e.g. "MPC1", "MPC2", "MPCE21", "MPCE021"). 
     - Normalize short codes to Topper101 standard format:
       - "MPC1" or "MPC001" or "MPC-1" -> "MPC-001"
       - "MPC2" or "MPC002" or "MPC-2" -> "MPC-002"
       - "MPC3" or "MPC003" or "MPC-3" -> "MPC-003"
       - "MPC4" or "MPC004" or "MPC-4" -> "MPC-004"
       - "MPC5" or "MPC005" or "MPC-5" -> "MPC-005"
       - "MPC6" or "MPC006" or "MPC-6" -> "MPC-006"
       - "MPCE11" or "MPCE011" or "MPCE-11" -> "MPCE-011"
       - "MPCE12" or "MPCE012" or "MPCE-12" -> "MPCE-012"
       - "MPCE13" or "MPCE013" or "MPCE-13" -> "MPCE-013"
       - "MPCE21" or "MPCE021" or "MPCE-21" -> "MPCE-021"
       - "MPCE22" or "MPCE022" or "MPCE-22" -> "MPCE-022"
       - "MPCE23" or "MPCE023" or "MPCE-23" -> "MPCE-023"
       - "MPCE31" or "MPCE031" or "MPCE-31" -> "MPCE-031"
       - "MPCE32" or "MPCE032" or "MPCE-32" -> "MPCE-032"
       - "MPCE33" or "MPCE033" or "MPCE-33" -> "MPCE-033"
       - "MPCE46" or "MPCE046" or "MPCE-46" -> "MPCE-046"
     - Ignore non-theory/practical course components (like MPCE24, MPCE25, MPCL7) unless they map to the standard codes listed above.
4. Detect digital modification / tampering / mockup generation:
   - Analyze the image or PDF carefully for signs that the document was digitally generated or modified (e.g. clean digital text overlays that mismatch background textures, photoshopped details, font mismatch on enrollment/name, or files matching known fake template generators rather than being an official PDF download or a real smartphone photo of a printed card).
   - "is_tampered": Set to true if the document shows clear signs of digital editing, overlaying, template generation, or tampering.
   - "tampering_reason": A short explanation of the anomaly detected (e.g., "Mismatched digital font layer detected on student name"), or null if clean.

Return ONLY a valid JSON object matching this schema:
{
  "valid_mapc": boolean,
  "student_name": string or null,
  "enrollment_number": string or null,
  "document_type": "admit_card" | "id_card" | "invalid",
  "exam_session": string or null,
  "extracted_papers": string[],
  "is_tampered": boolean,
  "tampering_reason": string or null
}
  `.trim();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: promptText,
            },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API Error Response:', errorText);
    throw new Error(`Gemini API request failed with status ${response.status}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API returned an empty response.');
  }

  try {
    const parsed = JSON.parse(rawText.trim()) as GeminiVerificationResult;
    return parsed;
  } catch {
    console.error('Failed to parse Gemini output:', rawText);
    throw new Error('Failed to parse document response schema.');
  }
}
