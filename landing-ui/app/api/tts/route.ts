import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    const response = await fetch('http://localhost:8880/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'kokoro',
        input: text,
        voice: 'af_bella',
        response_format: 'mp3',
      }),
    })

    if (!response.ok) throw new Error('TTS API error')

    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 })
  }
} 