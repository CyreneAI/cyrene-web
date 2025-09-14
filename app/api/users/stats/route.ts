// app/api/users/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching user stats...');

    // Get all user profiles with their stats
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('reputation_score', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch user profiles', details: profilesError.message },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Get agent stats for each user
    const userStatsPromises = profiles.map(async (profile) => {
      try {
        // Get agent stats
        const { data: agents, error: agentsError } = await supabase
          .from('agents')
          .select('id, name, avatar_img, status')
          .eq('wallet_address', profile.wallet_address);

        
        // Get token stats using Supabase directly (this should work)
        const { data: tokens, error: tokensError } = await supabase
          .from('launched_tokens')
          .select('contract_address, token_name, token_symbol, metadata_uri, damm_pool_address')
          .eq('creator_wallet_address', profile.wallet_address);

        if (tokensError) {
          console.error(`Error fetching tokens for ${profile.wallet_address}:`, tokensError);
        }

        const agentsList = agents;
        const tokensList = tokens || [];
        
        // Calculate stats
        const totalAgents = agentsList ? agentsList.length : 0;
        const activeAgents = agentsList ? agentsList.filter(agent => agent.status === 'active').length : 0;
        const totalTokens = tokensList.length;
        const graduatedTokens = tokensList.filter(token => token.damm_pool_address).length;

        // Get recent agents (last 3)
        const recentAgents = agentsList
          ? agentsList.slice(-3).map(agent => ({
              id: agent.id,
              name: agent.name,
              avatar_img: agent.avatar_img
            }))
          : [];

        // Get recent tokens (last 3)
        const recentTokens = tokensList
          .slice(-3)
          .map(token => ({
            contractAddress: token.contract_address,
            tokenName: token.token_name,
            tokenSymbol: token.token_symbol,
            metadataUri: token.metadata_uri
          }));

        return {
          ...profile,
          total_agents: totalAgents,
          active_agents: activeAgents,
          total_tokens: totalTokens,
          graduated_tokens: graduatedTokens,
          recent_agents: recentAgents,
          recent_tokens: recentTokens,
          // Calculate reputation score if not already set
          reputation_score: profile.reputation_score || 
            (totalAgents * 10 + totalTokens * 20 + graduatedTokens * 30 + Math.floor(profile.twitter_followers_count / 100))
        };
      } catch (error) {
        console.error(`Error processing user ${profile.wallet_address}:`, error);
        return {
          ...profile,
          total_agents: 0,
          active_agents: 0,
          total_tokens: 0,
          graduated_tokens: 0,
          recent_agents: [],
          recent_tokens: [],
          reputation_score: profile.reputation_score || 0
        };
      }
    });

    const usersWithStats = await Promise.all(userStatsPromises);

    // Filter out users with no activity (optional - you might want to show all users)
    const activeUsers = usersWithStats.filter(user => 
      user.total_agents > 0 || user.total_tokens > 0 || user.twitter_id
    );

    console.log(`Fetched stats for ${activeUsers.length} users`);

    return NextResponse.json({ 
      users: activeUsers,
      total: activeUsers.length 
    });

  } catch (error) {
    console.error('Error in users stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Optional: Add caching headers for better performance
export async function HEAD(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60', // Cache for 5 minutes
    },
  });
}