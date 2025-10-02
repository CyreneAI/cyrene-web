import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch('https://mainnet.block-engine.jito.wtf/api/v1/bundles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error sending Jito bundle:', error)
    return NextResponse.json({ error: 'Failed to send bundle' }, { status: 500 })
  }
}