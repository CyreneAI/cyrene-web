import { NextRequest, NextResponse } from 'next/server';
import { liveChatService } from '@/services/liveChatService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const stats = await liveChatService.getRoomStats(roomId);

    return NextResponse.json({ 
      success: true,
      stats 
    });
  } catch (error) {
    console.error('Error getting chat stats:', error);
    return NextResponse.json({ error: 'Failed to get chat stats' }, { status: 500 });
  }
}
