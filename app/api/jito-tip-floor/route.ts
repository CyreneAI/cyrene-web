import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://bundles.jito.wtf/api/v1/bundles/tip_floor')
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching Jito tip floor:', error)
    return NextResponse.json({ error: 'Failed to fetch tip floor' }, { status: 500 })
  }
}