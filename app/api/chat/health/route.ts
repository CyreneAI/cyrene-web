// app/api/chat/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { liveChatService } from '@/services/liveChatService';

export async function GET(request: NextRequest) {
  try {
    
    return NextResponse.json({ 
      success: true,
   
      timestamp: new Date().toISOString()
    }, { 
        status: 200
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ 
      success: false,
      redis: false,
      pubsub: false,
      overall: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}