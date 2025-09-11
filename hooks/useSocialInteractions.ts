// hooks/useSocialInteractions.ts
import { useState, useEffect, useCallback } from 'react';
import { SocialInteractionsService, SocialStats } from '@/services/socialInteractionsService';
import { toast } from 'sonner';

export const useSocialInteractions = (projectId: string, walletAddress?: string) => {
  const [stats, setStats] = useState<SocialStats>({
    likeCount: 0,
    followerCount: 0,
    isLiked: false,
    isFollowing: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Load initial stats
  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const socialStats = await SocialInteractionsService.getProjectSocialStats(
        projectId, 
        walletAddress
      );
      setStats(socialStats);
    } catch (error) {
      console.error('Error loading social stats:', error);
      toast.error('Failed to load social stats');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, walletAddress]);

  // Subscribe to real-time updates
  useEffect(() => {
    loadStats();

    // Subscribe to real-time updates
    const unsubscribe = SocialInteractionsService.subscribeToProjectStatsUpdates(
      projectId,
      (updatedStats) => {
        setStats(prev => ({
          ...prev,
          likeCount: updatedStats.likeCount,
          followerCount: updatedStats.followerCount
        }));
      }
    );

    return unsubscribe;
  }, [projectId, loadStats]);

  // Handle like/unlike
  const toggleLike = useCallback(async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet to like projects');
      return;
    }

    if (isLiking) return;

    try {
      setIsLiking(true);
      
      let updatedStats: SocialStats;
      if (stats.isLiked) {
        updatedStats = await SocialInteractionsService.unlikeProject(projectId, walletAddress);
        toast.success('Project unliked');
      } else {
        updatedStats = await SocialInteractionsService.likeProject(projectId, walletAddress);
        toast.success('Project liked!');
      }
      
      setStats(updatedStats);
    } catch (error) {
      console.error('Error toggling like:', error);
      const message = error instanceof Error ? error.message : 'Failed to update like';
      toast.error(message);
    } finally {
      setIsLiking(false);
    }
  }, [projectId, walletAddress, stats.isLiked, isLiking]);

  // Handle follow/unfollow
  const toggleFollow = useCallback(async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet to follow projects');
      return;
    }

    if (isFollowing) return;

    try {
      setIsFollowing(true);
      
      let updatedStats: SocialStats;
      if (stats.isFollowing) {
        updatedStats = await SocialInteractionsService.unfollowProject(projectId, walletAddress);
        toast.success('Project unfollowed');
      } else {
        updatedStats = await SocialInteractionsService.followProject(projectId, walletAddress);
        toast.success('Project followed!');
      }
      
      setStats(updatedStats);
    } catch (error) {
      console.error('Error toggling follow:', error);
      const message = error instanceof Error ? error.message : 'Failed to update follow';
      toast.error(message);
    } finally {
      setIsFollowing(false);
    }
  }, [projectId, walletAddress, stats.isFollowing, isFollowing]);

  return {
    stats,
    isLoading,
    isLiking,
    isFollowingAction: isFollowing,
    toggleLike,
    toggleFollow,
    refetch: loadStats
  };
};