// hooks/useProjectStream.ts
import { useState, useEffect } from 'react';
import { StreamingService, ProjectStream, convertRtmpToHls, type ProjectStreamDB } from '@/services/streamingService';

// Define LiveStreamSource type locally to avoid import issues
export type LiveStreamSource =
  | { type: "youtube"; url: string }
  | { type: "twitch"; url: string }
  | { type: "iframe"; url: string }
  | { type: "hls"; url: string; poster?: string }
  | { type: "rtmp"; url: string; streamKey: string; poster?: string }
  | { type: "mp4"; url: string; poster?: string };

export function useProjectStream(projectId: string | undefined) {
  const [stream, setStream] = useState<ProjectStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamSource, setStreamSource] = useState<LiveStreamSource | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Helper function to update stream state
  const updateStreamState = (projectStream: ProjectStream | null) => {
    setStream(projectStream);
    
    if (projectStream) {
      setIsLive(projectStream.status === 'live');
      
      if (projectStream.status === 'live') {
        const hlsUrl = convertRtmpToHls(projectStream.streamUrl, projectStream.streamKey);
        setStreamSource({
          type: 'hls',
          url: hlsUrl
        });
      } else {
        setStreamSource(null);
      }
    } else {
      setIsLive(false);
      setStreamSource(null);
    }
  };

  useEffect(() => {
    const loadStream = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const projectStream = await StreamingService.getProjectStream(projectId);
        updateStreamState(projectStream);
      } catch (err) {
        console.error('Error loading project stream:', err);
        setError('Failed to load stream');
        updateStreamState(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadStream();
  }, [projectId]);

  // Real-time subscription to stream updates
  useEffect(() => {
    if (!projectId) return;

    const subscription = StreamingService.subscribeToStreamUpdates(
      projectId,
      (payload: any) => {
        console.log('Stream update received:', payload);
        
        try {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Convert database format to frontend format
            const dbStream = payload.new as ProjectStreamDB;
            if (dbStream) {
              const updatedStream: ProjectStream = {
                id: dbStream.id,
                projectId: dbStream.project_id,
                projectType: dbStream.project_type,
                walletAddress: dbStream.wallet_address,
                streamUrl: dbStream.stream_url,
                streamKey: dbStream.stream_key,
                status: dbStream.status,
                title: dbStream.title,
                description: dbStream.description,
                createdAt: dbStream.created_at,
                updatedAt: dbStream.updated_at
              };
              updateStreamState(updatedStream);
            }
          } else if (payload.eventType === 'DELETE') {
            updateStreamState(null);
          }
        } catch (err) {
          console.error('Error processing stream update:', err);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  // Refresh function
  const refresh = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const result = await StreamingService.getProjectStream(projectId);
      updateStreamState(result);
    } catch (err) {
      console.error('Error refreshing stream:', err);
      setError('Failed to refresh stream');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stream,
    streamSource,
    isLive,
    isLoading,
    error,
    refresh
  };
}