// app/api/chat/send/route.ts - Temporarily disable rate limiting
import { NextRequest, NextResponse } from 'next/server';
import { liveChatService } from '@/services/liveChatService';

export async function POST(request: NextRequest) {
  try {
    const { roomId, walletAddress, message, type = 'normal' } = await request.json();

    if (!roomId || !walletAddress || !message?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // TEMPORARILY DISABLE RATE LIMITING - Remove this check
    // const isAllowed = await liveChatService.checkRateLimit(walletAddress, roomId);
    // if (!isAllowed) {
    //   return NextResponse.json({ 
    //     error: 'Rate limit exceeded. Please slow down.' 
    //   }, { status: 429 });
    // }

    console.log('Sending message:', { roomId, walletAddress, message });

    // Generate username from wallet address
    const username = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
    
    // Add message
    const chatMessage = await liveChatService.addMessage({
      roomId,
      walletAddress,
      username,
      message: message.trim(),
      type
    });

    if (!chatMessage) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 400 });
    }

    console.log('Message sent successfully:', chatMessage);

    // Update user online status
    await liveChatService.setUserOnline(roomId, walletAddress);

    return NextResponse.json({ 
      success: true, 
      message: chatMessage 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}