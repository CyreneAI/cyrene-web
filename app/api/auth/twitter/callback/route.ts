// app/api/auth/twitter/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Twitter User Interface
interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url: string;
  verified: boolean;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
  description?: string;
  url?: string;
  location?: string;
}

// Exchange code for access token
async function exchangeCodeForToken(code: string): Promise<string> {
  const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`,
    client_id: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID!,
    code_verifier: 'challenge',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token exchange failed:', response.status, errorText);
    throw new Error(`Failed to exchange code for token: ${response.status}`);
  }

  const tokenData = await response.json();
  return tokenData.access_token;
}

// Get user data from Twitter API
async function getUserData(accessToken: string): Promise<TwitterUser> {
  const userUrl = 'https://api.twitter.com/2/users/me?user.fields=id,username,name,profile_image_url,verified,public_metrics,description,url,location';
  
  const response = await fetch(userUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('User data fetch failed:', response.status, errorText);
    throw new Error(`Failed to fetch user data: ${response.status}`);
  }

  const { data } = await response.json();
  return data;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log('Twitter callback received:', { code: !!code, state: !!state, error });

  if (error) {
    console.error('Twitter OAuth error:', error);
    // FIXED: Redirect to the correct route
    return NextResponse.redirect(`${baseUrl}/agents?error=twitter_auth_failed`);
  }

  if (!code || !state) {
    console.error('Missing parameters:', { code: !!code, state: !!state });
    // FIXED: Redirect to the correct route
    return NextResponse.redirect(`${baseUrl}/agents?error=missing_parameters`);
  }

  try {
    // Decode state to get wallet address
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { walletAddress } = stateData;

    console.log('Processing Twitter callback for wallet:', walletAddress);

    // Exchange code for token
    console.log('Exchanging code for access token...');
    const accessToken = await exchangeCodeForToken(code);
    console.log('Successfully got access token');
    
    // Get user data
    console.log('Fetching Twitter user data...');
    const twitterUser = await getUserData(accessToken);
    console.log('Successfully got Twitter user data:', {
      id: twitterUser.id,
      username: twitterUser.username,
      name: twitterUser.name,
      verified: twitterUser.verified
    });
    
    // Prepare profile data
    const profileData = {
      wallet_address: walletAddress,
      twitter_id: twitterUser.id,
      twitter_username: twitterUser.username,
      twitter_name: twitterUser.name,
      twitter_profile_image_url: twitterUser.profile_image_url,
      twitter_verified: twitterUser.verified,
      twitter_followers_count: twitterUser.public_metrics.followers_count,
      twitter_following_count: twitterUser.public_metrics.following_count,
      twitter_tweet_count: twitterUser.public_metrics.tweet_count,
      bio: twitterUser.description || null,
      website_url: twitterUser.url || null,
      location: twitterUser.location || null,
      last_updated: new Date().toISOString(),
    };

    console.log('Saving profile data to Supabase...');

    // Upsert user profile
    const { data, error: dbError } = await supabase
      .from('user_profiles')
      .upsert(profileData, { 
        onConflict: 'wallet_address',
        ignoreDuplicates: false 
      })
      .select();

    if (dbError) {
      console.error('Database error:', dbError);
      // FIXED: Redirect to the correct route
      return NextResponse.redirect(`${baseUrl}/agents?error=database_error&details=${encodeURIComponent(dbError.message)}`);
    }

    console.log('Profile saved successfully:', data);

    // FIXED: Redirect back to profile with success - changed from /dashboard/agents to /agents
    return NextResponse.redirect(`${baseUrl}/agents?twitter_linked=true`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // FIXED: Redirect to the correct route
    return NextResponse.redirect(`${baseUrl}/agents?error=callback_failed&details=${encodeURIComponent(errorMessage)}`);
  }
}