import { NextRequest, NextResponse } from 'next/server';
import { liveChatService } from '@/services/liveChatService';

// Set user online
export async function POST(request: NextRequest) {
  try {
    const { roomId, walletAddress } = await request.json();

    if (!roomId || !walletAddress) {
      return NextResponse.json({ error: 'Room ID and wallet address are required' }, { status: 400 });
    }

    await liveChatService.setUserOnline(roomId, walletAddress);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting user online:', error);
    return NextResponse.json({ error: 'Failed to update online status' }, { status: 500 });
  }
}

// Set user offline
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const walletAddress = searchParams.get('walletAddress');

    if (!roomId || !walletAddress) {
      return NextResponse.json({ error: 'Room ID and wallet address are required' }, { status: 400 });
    }

    await liveChatService.setUserOffline(roomId, walletAddress);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting user offline:', error);
    return NextResponse.json({ error: 'Failed to update online status' }, { status: 500 });
  }
}