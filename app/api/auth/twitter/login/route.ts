// app/api/auth/twitter/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Twitter client ID not configured' },
        { status: 500 }
      );
    }

    if (!process.env.TWITTER_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Twitter client secret not configured' },
        { status: 500 }
      );
    }

    // Generate state parameter with wallet address
    const state = Buffer.from(JSON.stringify({ 
      walletAddress, 
      timestamp: Date.now() 
    })).toString('base64');
    
    // Build Twitter OAuth URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`,
      scope: 'tweet.read users.read follows.read',
      state: state,
      code_challenge_method: 'plain',
      code_challenge: 'challenge',
    });

    const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
    
    console.log('Generated Twitter OAuth URL for wallet:', walletAddress);
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Twitter login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}