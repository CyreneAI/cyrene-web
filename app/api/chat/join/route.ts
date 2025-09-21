import { NextRequest, NextResponse } from 'next/server';
import { liveChatService } from '@/services/liveChatService';

export async function POST(request: NextRequest) {
  try {
    const { roomId, walletAddress } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Get recent messages and room stats
    const [messages, stats] = await Promise.all([
      liveChatService.getMessages(roomId, 100),
      liveChatService.getRoomStats(roomId)
    ]);

    // Track user as online if wallet connected
    if (walletAddress) {
      await liveChatService.setUserOnline(roomId, walletAddress);
    }

    return NextResponse.json({ 
      success: true,
      messages, 
      stats 
    });
  } catch (error) {
    console.error('Error joining chat:', error);
    return NextResponse.json({ error: 'Failed to join chat room' }, { status: 500 });
  }
}