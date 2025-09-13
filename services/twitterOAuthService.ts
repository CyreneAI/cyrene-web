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
      console.log('Twitter Client ID:', this.clientId);
      this.clientSecret = process.env.TWITTER_CLIENT_SECRET!;
      console.log('Twitter Client Secret:', this.clientSecret ? '****' : 'Not Set');
      this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`;
      console.log('Twitter Redirect URI:', this.redirectUri);
    }
  
  
    // Generate Twitter OAuth URL
    generateAuthUrl(state: string): string {
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
  
    // Exchange code for access token
    async exchangeCodeForToken(code: string): Promise<TwitterOAuthResponse> {
      const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
      
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: 'challenge',
      });
  
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: body.toString(),
      });
  
      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }
  
      const tokenData = await response.json();
      
      // Get user data
      const userData = await this.getUserData(tokenData.access_token);
      
      return {
        user: userData,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      };
    }
  
    // Get user data from Twitter API
    async getUserData(accessToken: string): Promise<TwitterUser> {
      const userUrl = 'https://api.twitter.com/2/users/me?user.fields=id,username,name,profile_image_url,verified,public_metrics,description,url,location';
      
      const response = await fetch(userUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
  
      const { data } = await response.json();
      return data;
    }
  }
  
  export const twitterOAuthService = new TwitterOAuthService();