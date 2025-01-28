import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    // Old endpoint
    // const response = await fetch('http://localhost:8880/v1/audio/speech', {
    // New endpoint
    const response = await fetch('https://0f17-2405-201-801c-10b3-8d43-5c12-bd30-55d6.ngrok-free.app/v1/audio/speech', {
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
    console.error('Error:', error);
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 })
  }
} 