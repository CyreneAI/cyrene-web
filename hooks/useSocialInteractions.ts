// hooks/useSocialInteractions.ts - FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import { SocialInteractionsService, SocialStats } from '@/services/socialInteractionsService';
import { toast } from 'sonner';

const DEFAULT_STATS: SocialStats = {
  likeCount: 0,
  followerCount: 0,
  isLiked: false,
  isFollowing: false
};

export const useSocialInteractions = (projectId: string, walletAddress?: string) => {
  const [stats, setStats] = useState<SocialStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isFollowingAction, setIsFollowingAction] = useState(false);

  // Check if projectId is valid - this prevents the UUID error
  const isValidProjectId = projectId && projectId.trim() !== '' && projectId !== 'undefined' && projectId !== 'null';

  // Load initial stats
  const loadStats = useCallback(async () => {
    // Don't make API call if projectId is invalid
    if (!isValidProjectId) {
      setStats(DEFAULT_STATS);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const socialStats = await SocialInteractionsService.getProjectSocialStats(
        projectId, 
        walletAddress
      );
      setStats(socialStats);
    } catch (error) {
      console.error('Error loading social stats:', error);
      // Set default stats instead of showing error for invalid IDs
      setStats(DEFAULT_STATS);
      // Only show toast error if it's a real API error, not just invalid ID
      if (isValidProjectId) {
        toast.error('Failed to load social stats');
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId, walletAddress, isValidProjectId]);

  // Subscribe to real-time updates
  useEffect(() => {
    loadStats();

    // Only subscribe to real-time updates if we have a valid project ID
    if (!isValidProjectId) {
      return;
    }

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
  }, [projectId, loadStats, isValidProjectId]);

  // Handle like/unlike
  const toggleLike = useCallback(async () => {
    if (!isValidProjectId) {
      toast.error('Invalid project ID');
      return;
    }

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
  }, [projectId, walletAddress, stats.isLiked, isLiking, isValidProjectId]);

  // Handle follow/unfollow
  const toggleFollow = useCallback(async () => {
    if (!isValidProjectId) {
      toast.error('Invalid project ID');
      return;
    }

    if (!walletAddress) {
      toast.error('Please connect your wallet to follow projects');
      return;
    }

    if (isFollowingAction) return;

    try {
      setIsFollowingAction(true);
      
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
      setIsFollowingAction(false);
    }
  }, [projectId, walletAddress, stats.isFollowing, isFollowingAction, isValidProjectId]);

  return {
    stats,
    isLoading,
    isLiking,
    isFollowingAction,
    toggleLike,
    toggleFollow,
    refetch: loadStats
  };
};