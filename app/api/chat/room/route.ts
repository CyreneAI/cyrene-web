import { NextRequest, NextResponse } from 'next/server';
import { liveChatService } from '@/services/liveChatService';

// Create chat room
export async function POST(request: NextRequest) {
  try {
    const { streamId, roomId } = await request.json();

    if (!streamId || !roomId) {
      return NextResponse.json({ error: 'Stream ID and Room ID are required' }, { status: 400 });
    }

    const success = await liveChatService.createChatRoom(streamId, roomId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to create chat room' }, { status: 500 });
    }

    // Send welcome message
    await liveChatService.addMessage({
      roomId,
      walletAddress: 'system',
      username: 'System',
      message: 'Welcome to the live chat! 🔴',
      type: 'system'
    });

    return NextResponse.json({ 
      success: true,
      message: 'Chat room created successfully'
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    return NextResponse.json({ error: 'Failed to create chat room' }, { status: 500 });
  }
}

// End chat room
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const archive = searchParams.get('archive') === 'true';

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const success = await liveChatService.endChatRoom(roomId, archive);

    if (!success) {
      return NextResponse.json({ error: 'Failed to end chat room' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Chat room ended successfully'
    });
  } catch (error) {
    console.error('Error ending chat room:', error);
    return NextResponse.json({ error: 'Failed to end chat room' }, { status: 500 });
  }
}