// services/socialInteractionsService.ts - Fixed version without console errors
import { supabase } from '@/lib/supabase';

export interface ProjectLike {
  id: string;
  projectId: string;
  walletAddress: string;
  createdAt: string;
}

export interface ProjectFollower {
  id: string;
  projectId: string;
  walletAddress: string;
  createdAt: string;
}

export interface SocialStats {
  likeCount: number;
  followerCount: number;
  isLiked: boolean;
  isFollowing: boolean;
}

export class SocialInteractionsService {
  /**
   * Get social stats for a project
   */
  static async getProjectSocialStats(
    projectId: string, 
    walletAddress?: string
  ): Promise<SocialStats> {
    try {
      // Get counts from project_ideas table (or launched_tokens if it's a token)
      const { data: projectData, error: projectError } = await supabase
        .from('project_ideas')
        .select('like_count, follower_count')
        .eq('id', projectId)
        .single();

      if (projectError && projectError.code !== 'PGRST116') {
        // Use proper error handling instead of console.error
        throw new Error(`Failed to fetch project stats: ${projectError.message}`);
      }

      let likeCount = 0;
      let followerCount = 0;
      let isLiked = false;
      let isFollowing = false;

      if (projectData) {
        likeCount = projectData.like_count || 0;
        followerCount = projectData.follower_count || 0;
      }

      // Check if current user has liked/followed (if wallet address provided)
      if (walletAddress) {
        const [likeCheck, followCheck] = await Promise.all([
          supabase
            .from('project_likes')
            .select('id')
            .eq('project_id', projectId)
            .eq('wallet_address', walletAddress)
            .single(),
          supabase
            .from('project_followers')
            .select('id')
            .eq('project_id', projectId)
            .eq('wallet_address', walletAddress)
            .single()
        ]);

        isLiked = !likeCheck.error;
        isFollowing = !followCheck.error;
      }

      return {
        likeCount,
        followerCount,
        isLiked,
        isFollowing
      };
    } catch (error) {
      // Handle errors without console logging in production
      throw error instanceof Error ? error : new Error('Failed to fetch social stats');
    }
  }

  /**
   * Like a project
   */
  static async likeProject(projectId: string, walletAddress: string): Promise<SocialStats> {
    try {
      const { error } = await supabase
        .from('project_likes')
        .insert([{
          project_id: projectId,
          wallet_address: walletAddress
        }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('You have already liked this project');
        }
        throw new Error(`Failed to like project: ${error.message}`);
      }

      // Return updated stats
      return await this.getProjectSocialStats(projectId, walletAddress);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to like project');
    }
  }

  /**
   * Unlike a project
   */
  static async unlikeProject(projectId: string, walletAddress: string): Promise<SocialStats> {
    try {
      const { error } = await supabase
        .from('project_likes')
        .delete()
        .eq('project_id', projectId)
        .eq('wallet_address', walletAddress);

      if (error) {
        throw new Error(`Failed to unlike project: ${error.message}`);
      }

      // Return updated stats
      return await this.getProjectSocialStats(projectId, walletAddress);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to unlike project');
    }
  }

  /**
   * Follow a project
   */
  static async followProject(projectId: string, walletAddress: string): Promise<SocialStats> {
    try {
      const { error } = await supabase
        .from('project_followers')
        .insert([{
          project_id: projectId,
          wallet_address: walletAddress
        }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('You are already following this project');
        }
        throw new Error(`Failed to follow project: ${error.message}`);
      }

      // Return updated stats
      return await this.getProjectSocialStats(projectId, walletAddress);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to follow project');
    }
  }

  /**
   * Unfollow a project
   */
  static async unfollowProject(projectId: string, walletAddress: string): Promise<SocialStats> {
    try {
      const { error } = await supabase
        .from('project_followers')
        .delete()
        .eq('project_id', projectId)
        .eq('wallet_address', walletAddress);

      if (error) {
        throw new Error(`Failed to unfollow project: ${error.message}`);
      }

      // Return updated stats
      return await this.getProjectSocialStats(projectId, walletAddress);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to unfollow project');
    }
  }

  /**
   * Get users who liked a project
   */
  static async getProjectLikes(projectId: string, limit: number = 50): Promise<ProjectLike[]> {
    try {
      const { data, error } = await supabase
        .from('project_likes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch project likes: ${error.message}`);
      }

      return data?.map(like => ({
        id: like.id,
        projectId: like.project_id,
        walletAddress: like.wallet_address,
        createdAt: like.created_at
      })) || [];
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to fetch project likes');
    }
  }

  /**
   * Get users who follow a project
   */
  static async getProjectFollowers(projectId: string, limit: number = 50): Promise<ProjectFollower[]> {
    try {
      const { data, error } = await supabase
        .from('project_followers')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch project followers: ${error.message}`);
      }

      return data?.map(follower => ({
        id: follower.id,
        projectId: follower.project_id,
        walletAddress: follower.wallet_address,
        createdAt: follower.created_at
      })) || [];
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to fetch project followers');
    }
  }

  /**
   * Get projects liked by a user
   */
  static async getUserLikedProjects(walletAddress: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('project_likes')
        .select('project_id')
        .eq('wallet_address', walletAddress);

      if (error) {
        throw new Error(`Failed to fetch user liked projects: ${error.message}`);
      }

      return data?.map(like => like.project_id) || [];
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to fetch user liked projects');
    }
  }

  /**
   * Get projects followed by a user
   */
  static async getUserFollowedProjects(walletAddress: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('project_followers')
        .select('project_id')
        .eq('wallet_address', walletAddress);

      if (error) {
        throw new Error(`Failed to fetch user followed projects: ${error.message}`);
      }

      return data?.map(follow => follow.project_id) || [];
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to fetch user followed projects');
    }
  }

  /**
   * Subscribe to real-time updates for a project's social stats
   */
  static subscribeToProjectSocialUpdates(
    projectId: string,
    onUpdate: (stats: { likeCount: number; followerCount: number }) => void
  ) {
    const likesChannel = supabase
      .channel(`project_likes_${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_likes',
        filter: `project_id=eq.${projectId}`
      }, async () => {
        // Refetch stats when likes change
        try {
          const stats = await this.getProjectSocialStats(projectId);
          onUpdate({ 
            likeCount: stats.likeCount, 
            followerCount: stats.followerCount 
          });
        } catch (error) {
          // Silently handle errors in real-time updates
          // You could dispatch to a global error handler here if needed
        }
      })
      .subscribe();

    const followersChannel = supabase
      .channel(`project_followers_${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_followers',
        filter: `project_id=eq.${projectId}`
      }, async () => {
        // Refetch stats when followers change
        try {
          const stats = await this.getProjectSocialStats(projectId);
          onUpdate({ 
            likeCount: stats.likeCount, 
            followerCount: stats.followerCount 
          });
        } catch (error) {
          // Silently handle errors in real-time updates
        }
      })
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(followersChannel);
    };
  }

  /**
   * Subscribe to real-time updates for project ideas table updates
   */
  static subscribeToProjectStatsUpdates(
    projectId: string,
    onUpdate: (stats: { likeCount: number; followerCount: number }) => void
  ) {
    const channel = supabase
      .channel(`project_stats_${projectId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'project_ideas',
        filter: `id=eq.${projectId}`
      }, (payload) => {
        const newRecord = payload.new as any;
        onUpdate({
          likeCount: newRecord.like_count || 0,
          followerCount: newRecord.follower_count || 0
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}