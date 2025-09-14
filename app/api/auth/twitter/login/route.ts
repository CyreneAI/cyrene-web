// app/api/auth/twitter/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, returnUrl } = body;
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID) {
      console.error('Twitter client ID not configured');
      return NextResponse.json(
        { error: 'Twitter authentication is not properly configured. Please contact support.' },
        { status: 500 }
      );
    }

    if (!process.env.TWITTER_CLIENT_SECRET) {
      console.error('Twitter client secret not configured');
      return NextResponse.json(
        { error: 'Twitter authentication is not properly configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Generate state parameter with wallet address and return URL
    const state = Buffer.from(JSON.stringify({ 
      walletAddress, 
      returnUrl: returnUrl || '/agents', // Default to /agents if not provided
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7) // Add randomness for security
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
    console.log('Return URL will be:', returnUrl || '/agents');
    
    return NextResponse.json({ 
      authUrl,
      message: 'Redirecting to Twitter for authentication...' 
    });
  } catch (error) {
    console.error('Twitter login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { 
        error: 'Failed to initiate Twitter authentication',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}