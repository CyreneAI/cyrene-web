// app/api/one-liner/route.ts  (Next.js App Router)
// OR adapt to pages/api/one-liner.ts if you're using pages router

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // keep secret on server
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const description: string = (body?.description || '').toString().slice(0, 2000);

    if (!description) {
      return NextResponse.json({ error: 'Missing description' }, { status: 400 });
    }

    // Prompt to return a short one-line summary (one-liner)
    const system = `You are a helpful assistant that converts a project's description into a short, punchy one-line summary. Keep it to a single concise sentence (max ~20 words). No extra commentary.`;
    const user = `Project description:\n\n${description}\n\nReturn only a single short one-line summary.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o', // change model if needed, or 'gpt-4o-mini' / 'gpt-3.5-turbo' etc.
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
      max_tokens: 60,
    });

    const oneLiner = completion.choices?.[0]?.message?.content?.trim() ?? '';

    return NextResponse.json({ oneLiner });
  } catch (err: any) {
    console.error('one-liner error:', err);
    return NextResponse.json({ error: 'OpenAI request failed' }, { status: 500 });
  }
}
