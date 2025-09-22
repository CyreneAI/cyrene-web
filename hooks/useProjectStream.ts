// hooks/useProjectStream.ts - FIXED VERSION
import { useState, useEffect } from 'react';
import { StreamingService, ProjectStream, getHlsUrl, type ProjectStreamDB } from '@/services/streamingService';

// Define LiveStreamSource type locally to avoid import issues
export type LiveStreamSource =
  | { type: "youtube"; url: string }
  | { type: "twitch"; url: string }
  | { type: "iframe"; url: string }
  | { type: "hls"; url: string; poster?: string; streamingType?: 'third-party' | 'onsite' }
  | { type: "rtmp"; url: string; streamKey: string; poster?: string; streamingType?: 'third-party' | 'onsite' }
  | { type: "mp4"; url: string; poster?: string };

export function useProjectStream(projectId: string | undefined) {
  const [stream, setStream] = useState<ProjectStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamSource, setStreamSource] = useState<LiveStreamSource | null>(null);
  const [isLive, setIsLive] = useState(false);

  // FIXED: Helper function to update stream state with proper URL routing
  const updateStreamState = (projectStream: ProjectStream | null) => {
    setStream(projectStream);
    
    if (projectStream) {
      setIsLive(projectStream.status === 'live');
      
      if (projectStream.status === 'live') {
        console.log('🎮 useProjectStream: Converting stream to HLS source:', {
          projectId: projectStream.projectId,
          streamingType: projectStream.streamingType,
          streamKey: projectStream.streamKey,
          streamUrl: projectStream.streamUrl
        });

        // FIXED: Use getHlsUrl with proper routing based on streamingType
        const hlsUrl = getHlsUrl(projectStream.streamUrl, projectStream.streamKey, projectStream.streamingType);
        
        setStreamSource({
          type: 'hls',
          url: hlsUrl,
          streamingType: projectStream.streamingType // Pass the streaming type
        });

        console.log('🎮 useProjectStream: Generated HLS source:', {
          type: 'hls',
          url: hlsUrl,
          streamingType: projectStream.streamingType
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
        
        console.log('🎮 useProjectStream: Loading stream for project:', projectId);
        const projectStream = await StreamingService.getProjectStream(projectId);
        updateStreamState(projectStream);
      } catch (err) {
        console.error('🎮 useProjectStream: Error loading project stream:', err);
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
        console.log('🎮 useProjectStream: Stream update received:', payload);
        
        try {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // FIXED: Convert database format to frontend format with streamingType
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
                streamingType: dbStream.streaming_type || 'third-party', // FIXED: Include streamingType
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
          console.error('🎮 useProjectStream: Error processing stream update:', err);
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
      console.log('🎮 useProjectStream: Refreshing stream for project:', projectId);
      const result = await StreamingService.getProjectStream(projectId);
      updateStreamState(result);
    } catch (err) {
      console.error('🎮 useProjectStream: Error refreshing stream:', err);
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