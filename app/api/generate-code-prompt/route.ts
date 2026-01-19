import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult } from '@/types/analysis';
import { generateFeedbackWithGroq } from '@/lib/ai/groq';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const analysisResult: AnalysisResult = body.analysisResult;

    if (!analysisResult) {
      return NextResponse.json(
        { error: 'Analysis result is required' },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not set. Please configure it to generate code prompts.' },
        { status: 500 }
      );
    }

    // Build a comprehensive prompt for code generation focused on implementing the suggestions
    const suggestionsText = analysisResult.suggestions.length > 0 
      ? analysisResult.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : 'No specific suggestions provided.';

    const issuesText = analysisResult.issues.length > 0
      ? analysisResult.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
      : 'No issues identified.';

    const codePromptRequest = `Based on the following visual content analysis, generate a detailed, actionable prompt that can be used with AI code generators (like GitHub Copilot, ChatGPT, Claude, etc.) to IMPLEMENT THE SUGGESTIONS from the analysis.

IMPORTANT: 
- The prompt should focus on implementing the suggestions provided below. Transform the suggestions into specific, technical implementation instructions.
- DO NOT mention specific programming languages, frameworks, libraries, or technologies (e.g., React, Vue, Angular, Tailwind, Bootstrap, HTML, CSS, JavaScript, etc.). Keep it technology-agnostic.
- Focus on WHAT needs to be implemented (the improvements) rather than HOW (specific technologies).
- The user's technology stack is unknown, so the prompt should be general and adaptable to any technology.

Analysis Context:
- Description: ${analysisResult.description}
- Message Clarity: ${analysisResult.clarity}

Issues Identified:
${issuesText}

SUGGESTIONS TO IMPLEMENT (This is the main focus):
${suggestionsText}

Generate a comprehensive, actionable code generation prompt that:
1. Clearly states the goal: implementing the suggestions listed above
2. Transforms each suggestion into specific technical requirements (without mentioning specific technologies)
3. Describes the desired improvements in terms of functionality, structure, and behavior
4. Includes accessibility and responsive design considerations when relevant (described conceptually, not with specific tech)
5. Is detailed enough for an AI code generator to understand and implement, regardless of the technology stack
6. Focuses on the actionable improvements from the suggestions
7. Uses general terms like "styling", "layout", "components", "interactions" instead of technology-specific terms

The prompt should be ready to copy and paste directly into an AI code generator. Make it clear, specific, and implementation-focused, but technology-agnostic.`;

    try {
      const codePrompt = await generateFeedbackWithGroq(
        analysisResult.description,
        'code-generation',
        codePromptRequest,
        20000
      );

      return NextResponse.json({ codePrompt });
    } catch (error: any) {
      console.error('Error generating code prompt:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate code prompt' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
