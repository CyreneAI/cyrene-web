// services/twitterOAuthService.ts
export interface TwitterUser {
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

export interface TwitterOAuthResponse {
  user: TwitterUser;
  access_token: string;
  refresh_token?: string;
}

class TwitterOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID!;
    this.clientSecret = process.env.TWITTER_CLIENT_SECRET!;
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`;
    
    // Validate required environment variables
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Twitter OAuth credentials are not properly configured');
    }
  }

  // Generate Twitter OAuth URL with better state management
  generateAuthUrl(walletAddress: string, returnUrl?: string): string {
    // Enhanced state with return URL and timestamp for security
    const state = Buffer.from(JSON.stringify({ 
      walletAddress, 
      returnUrl: returnUrl || '/agents', // Default to /agents
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7) // Add randomness
    })).toString('base64');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'tweet.read users.read follows.read',
      state: state,
      code_challenge_method: 'plain',
      code_challenge: 'challenge',
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  // Validate state parameter for security
  validateState(state: string): { walletAddress: string; returnUrl: string; timestamp: number } | null {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      const { walletAddress, returnUrl, timestamp } = decoded;
      
      // Check if state is not older than 10 minutes (600000ms)
      const maxAge = 10 * 60 * 1000;
      if (Date.now() - timestamp > maxAge) {
        console.error('State parameter expired');
        return null;
      }
      
      if (!walletAddress) {
        console.error('Invalid state: missing wallet address');
        return null;
      }
      
      return { walletAddress, returnUrl: returnUrl || '/agents', timestamp };
    } catch (error) {
      console.error('Failed to validate state parameter:', error);
      return null;
    }
  }

  // Exchange code for access token with better error handling
  async exchangeCodeForToken(code: string): Promise<string> {
    const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      code_verifier: 'challenge',
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', response.status, errorText);
        throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();
      
      if (!tokenData.access_token) {
        throw new Error('No access token received from Twitter');
      }
      
      return tokenData.access_token;
    } catch (error) {
      console.error('Error during token exchange:', error);
      throw error;
    }
  }

  // Get user data from Twitter API with retry logic
  async getUserData(accessToken: string, retries = 2): Promise<TwitterUser> {
    const userUrl = 'https://api.twitter.com/2/users/me?user.fields=id,username,name,profile_image_url,verified,public_metrics,description,url,location';
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(userUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`User data fetch failed (attempt ${attempt + 1}):`, response.status, errorText);
          
          if (attempt === retries) {
            throw new Error(`Failed to fetch user data after ${retries + 1} attempts: ${response.status}`);
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }

        const responseData = await response.json();
        
        if (!responseData.data) {
          throw new Error('No user data received from Twitter API');
        }
        
        return responseData.data;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        console.log(`Retrying user data fetch (attempt ${attempt + 2})...`);
      }
    }
    
    throw new Error('Failed to fetch user data after all retries');
  }

  // Complete OAuth flow
  async completeOAuthFlow(code: string): Promise<TwitterOAuthResponse> {
    try {
      // Exchange code for token
      const accessToken = await this.exchangeCodeForToken(code);
      
      // Get user data
      const userData = await this.getUserData(accessToken);
      
      return {
        user: userData,
        access_token: accessToken,
      };
    } catch (error) {
      console.error('OAuth flow completion failed:', error);
      throw error;
    }
  }
}

export const twitterOAuthService = new TwitterOAuthService();