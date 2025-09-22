// services/streamingService.ts - Enhanced debugging version
import { supabase } from '@/lib/supabase';

export interface ProjectStream {
  id: string;
  projectId: string;
  projectType: 'idea' | 'token';
  walletAddress: string;
  streamUrl: string; // Base URL (RTMP or WebRTC base)
  streamKey: string;
  status: 'live' | 'offline';
  streamingType: 'third-party' | 'onsite'; // Made required to avoid undefined issues
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStreamDB {
  id: string;
  project_id: string;
  project_type: 'idea' | 'token';
  wallet_address: string;
  stream_url: string;
  stream_key: string;
  status: 'live' | 'offline';
  streaming_type: 'third-party' | 'onsite' | null; // Can be null in DB
  title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Generate stream key from project name - same as frontend
export const generateStreamKey = (projectName: string): string => {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim();
};

// Convert RTMP URL to HLS URL for third-party streaming
export const convertRtmpToHls = (rtmpUrl: string, streamKey: string): string => {
  console.log('🔥 convertRtmpToHls called:', { rtmpUrl, streamKey });
  
  if (rtmpUrl.includes('erebrus.io')) {
    // For Erebrus RTMP, convert to HLS format with /live/ and /index.m3u8
    const finalUrl = `https://stream.in01.erebrus.io/live/${streamKey}/index.m3u8`;
    console.log('🔥 Generated third-party HLS URL:', finalUrl);
    return finalUrl;
  }
  
  // Fallback for other RTMP servers
  if (rtmpUrl.startsWith('rtmp://')) {
    const cleanUrl = rtmpUrl.replace('rtmp://', 'https://').replace(/\/live\/?$/, '');
    return `${cleanUrl}/live/${streamKey}/index.m3u8`;
  }
  
  // If it's already HTTPS, assume it's the base URL
  const cleanUrl = rtmpUrl.replace(/\/+$/, '');
  return `${cleanUrl}/live/${streamKey}/index.m3u8`;
};

// Convert WebRTC URL to HLS URL for onsite streaming
export const convertWebRtcToHls = (webrtcUrl: string, streamKey: string): string => {
  console.log('🌐 convertWebRtcToHls called:', { webrtcUrl, streamKey });
  
  // For WebRTC streams, the HLS URL does NOT include /live/ and does NOT include /index.m3u8
  const finalUrl = `https://stream.in01.erebrus.io/${streamKey}/index.m3u8`;
  console.log('🌐 Generated onsite HLS URL:', finalUrl);
  return finalUrl;
};

// Get HLS URL based on streaming type
// FIXED: Get HLS URL based on streaming type - with proper debugging
export const getHlsUrl = (streamUrl: string, streamKey: string, streamingType: 'third-party' | 'onsite'): string => {
  console.log('🎯 getHlsUrl called with:', { 
    streamUrl, 
    streamKey, 
    streamingType,
    typeOfStreamingType: typeof streamingType,
    streamingTypeStrictEquality: streamingType === 'onsite',
    streamingTypeLength: streamingType.length,
    streamingTypeTrimmed: streamingType.trim()
  });
  
  // FIXED: Add explicit check with debugging
  if (streamingType === 'onsite') {
    console.log('🎯 ✅ Routing to convertWebRtcToHls (onsite)');
    return convertWebRtcToHls(streamUrl, streamKey);
  } else {
    console.log('🎯 ❌ Routing to convertRtmpToHls (third-party) - streamingType was:', streamingType);
    return convertRtmpToHls(streamUrl, streamKey);
  }
};
// Convert between DB and frontend formats
const dbToFrontend = (dbStream: ProjectStreamDB): ProjectStream => {
  const converted = {
    id: dbStream.id,
    projectId: dbStream.project_id,
    projectType: dbStream.project_type,
    walletAddress: dbStream.wallet_address,
    streamUrl: dbStream.stream_url,
    streamKey: dbStream.stream_key,
    status: dbStream.status,
    streamingType: dbStream.streaming_type || 'onsite', // Default to onsite if null
    title: dbStream.title,
    description: dbStream.description,
    createdAt: dbStream.created_at,
    updatedAt: dbStream.updated_at
  };
  
  console.log('🔄 dbToFrontend conversion:', {
    dbStreamingType: dbStream.streaming_type,
    dbStreamingTypeIsNull: dbStream.streaming_type === null,
    dbStreamingTypeIsUndefined: dbStream.streaming_type === undefined,
    convertedStreamingType: converted.streamingType,
    streamKey: converted.streamKey
  });
  
  return converted;
};

const frontendToDb = (stream: Omit<ProjectStream, 'id' | 'createdAt' | 'updatedAt'>): Omit<ProjectStreamDB, 'id' | 'created_at' | 'updated_at'> => ({
  project_id: stream.projectId,
  project_type: stream.projectType,
  wallet_address: stream.walletAddress,
  stream_url: stream.streamUrl,
  stream_key: stream.streamKey,
  status: stream.status,
  streaming_type: stream.streamingType,
  title: stream.title,
  description: stream.description
});

export class StreamingService {
  /**
   * Get stream for a specific project
   */
  static async getProjectStream(projectId: string): Promise<ProjectStream | null> {
    try {
      console.log('📡 getProjectStream called for:', projectId);
      
      const { data, error } = await supabase
        .from('project_streams')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📡 No stream found for project:', projectId);
          return null; // No stream found
        }
        throw error;
      }

      const result = data ? dbToFrontend(data as ProjectStreamDB) : null;
      
      console.log('📡 getProjectStream result:', {
        projectId,
        rawDbData: data,
        convertedResult: result ? {
          id: result.id,
          streamingType: result.streamingType,
          streamKey: result.streamKey,
          status: result.status
        } : null
      });
      
      return result;
    } catch (error) {
      console.error('📡 Error fetching project stream:', error);
      return null;
    }
  }

  /**
   * Get HLS URL for a project stream - Enhanced debugging
   */
  static async getStreamUrl(projectId: string): Promise<string | null> {
    try {
      console.log('🎬 getStreamUrl called for project:', projectId); // This should appear!
      
      const stream = await this.getProjectStream(projectId);
      
      if (!stream || stream.status !== 'live') {
        return null;
      }
  
      console.log('🎬 Stream found, generating HLS URL:', { // This should appear!
        projectId,
        streamKey: stream.streamKey,
        streamingType: stream.streamingType
      });
  
      // CRITICAL: This line must call getHlsUrl, not convertRtmpToHls directly
      const hlsUrl = getHlsUrl(stream.streamUrl, stream.streamKey, stream.streamingType);
      
      return hlsUrl;
    } catch (error) {
      console.error('🎬 Error getting stream URL:', error);
      return null;
    }
  }
  /**
   * Get all streams for a wallet
   */
  static async getUserStreams(walletAddress: string): Promise<ProjectStream[]> {
    try {
      const { data, error } = await supabase
        .from('project_streams')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(dbToFrontend);
    } catch (error) {
      console.error('Error fetching user streams:', error);
      throw error;
    }
  }

  /**
   * Get all live streams (public)
   */
  static async getLiveStreams(): Promise<ProjectStream[]> {
    try {
      const { data, error } = await supabase
        .from('project_streams')
        .select('*')
        .eq('status', 'live')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(dbToFrontend);
    } catch (error) {
      console.error('Error fetching live streams:', error);
      throw error;
    }
  }

  /**
   * Create or update a project stream
   */
  static async upsertProjectStream(streamData: {
    projectId: string;
    projectType: 'idea' | 'token';
    walletAddress: string;
    streamUrl: string;
    streamKey: string;
    streamingType?: 'third-party' | 'onsite';
    title?: string;
    description?: string;
  }): Promise<ProjectStream> {
    try {
      console.log('💾 Upserting stream data:', streamData);
      
      const dbData = frontendToDb({
        ...streamData,
        status: 'offline', // Default to offline when creating/updating
        streamingType: streamData.streamingType || 'third-party'
      });

      console.log('💾 DB data to upsert:', dbData);

      // First try to get existing stream
      const { data: existingData } = await supabase
        .from('project_streams')
        .select('*')
        .eq('project_id', streamData.projectId)
        .eq('wallet_address', streamData.walletAddress)
        .single();

      let result;

      if (existingData) {
        // Update existing stream
        console.log('💾 Updating existing stream');
        const { data, error } = await supabase
          .from('project_streams')
          .update(dbData)
          .eq('project_id', streamData.projectId)
          .eq('wallet_address', streamData.walletAddress)
          .select('*')
          .single();

        if (error) {
          console.error('💾 Update error:', error);
          throw new Error(`Failed to update stream: ${error.message}`);
        }
        result = data;
      } else {
        // Insert new stream
        console.log('💾 Inserting new stream');
        const { data, error } = await supabase
          .from('project_streams')
          .insert([dbData])
          .select('*')
          .single();

        if (error) {
          console.error('💾 Insert error:', error);
          throw new Error(`Failed to create stream: ${error.message}`);
        }
        result = data;
      }

      if (!result) {
        throw new Error('No data returned from database operation');
      }

      console.log('💾 Upsert successful, raw DB result:', result);
      const finalResult = dbToFrontend(result as ProjectStreamDB);
      
      console.log('💾 Final upserted stream:', {
        streamingType: finalResult.streamingType,
        streamKey: finalResult.streamKey,
        projectId: finalResult.projectId,
        dbStreamingType: (result as ProjectStreamDB).streaming_type
      });
      
      return finalResult;
    } catch (error) {
      console.error('💾 Error upserting project stream:', error);
      if (error instanceof Error) {
        throw new Error(`Stream operation failed: ${error.message}`);
      } else {
        throw new Error('Stream operation failed: Unknown error');
      }
    }
  }

  /**
   * Start stream and create chat room
   */
  static async startStream(projectId: string, walletAddress: string): Promise<ProjectStream | null> {
    try {
      console.log('▶️ Starting stream for:', { projectId, walletAddress });
      
      // Start the stream
      const { data, error } = await supabase
        .from('project_streams')
        .update({ status: 'live' })
        .eq('project_id', projectId)
        .eq('wallet_address', walletAddress)
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        const stream = dbToFrontend(data as ProjectStreamDB);
        
        console.log('▶️ Stream started successfully:', {
          projectId,
          streamingType: stream.streamingType,
          streamKey: stream.streamKey,
          status: stream.status,
          dbStreamingType: (data as ProjectStreamDB).streaming_type
        });
        
        // Create chat room for this stream
        const chatRoomId = `chat_${projectId}`;
        
        try {
          const chatResponse = await fetch('/api/chat/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              streamId: stream.id, 
              roomId: chatRoomId 
            })
          });
          
          if (chatResponse.ok) {
            console.log(`▶️ Created chat room ${chatRoomId} for stream ${projectId}`);
          } else {
            console.warn('▶️ Failed to create chat room, but stream started successfully');
          }
        } catch (chatError) {
          console.error('▶️ Error creating chat room:', chatError);
          // Don't fail the stream start if chat room creation fails
        }
        
        return stream;
      }

      return null;
    } catch (error) {
      console.error('▶️ Error starting stream:', error);
      throw error;
    }
  }

  /**
   * Stop stream and end chat room
   */
  static async stopStream(projectId: string, walletAddress: string): Promise<ProjectStream | null> {
    try {
      // Stop the stream
      const { data, error } = await supabase
        .from('project_streams')
        .update({ status: 'offline' })
        .eq('project_id', projectId)
        .eq('wallet_address', walletAddress)
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        const stream = dbToFrontend(data as ProjectStreamDB);
        
        // End chat room
        const chatRoomId = `chat_${projectId}`;
        
        try {
          const chatResponse = await fetch(`/api/chat/room?roomId=${chatRoomId}&archive=true`, {
            method: 'DELETE'
          });
          
          if (chatResponse.ok) {
            console.log(`Ended chat room ${chatRoomId} for stream ${projectId}`);
          } else {
            console.warn('Failed to end chat room, but stream stopped successfully');
          }
        } catch (chatError) {
          console.error('Error ending chat room:', chatError);
          // Don't fail the stream stop if chat room cleanup fails
        }
        
        return stream;
      }

      return null;
    } catch (error) {
      console.error('Error stopping stream:', error);
      throw error;
    }
  }

  /**
   * Delete a project stream and its chat room
   */
  static async deleteProjectStream(projectId: string, walletAddress: string): Promise<boolean> {
    try {
      // Delete chat room first
      const chatRoomId = `chat_${projectId}`;
      
      try {
        await fetch(`/api/chat/room?roomId=${chatRoomId}&archive=false`, {
          method: 'DELETE'
        });
        console.log(`Deleted chat room ${chatRoomId}`);
      } catch (chatError) {
        console.error('Error deleting chat room:', chatError);
        // Continue with stream deletion even if chat deletion fails
      }

      // Delete the stream
      const { error } = await supabase
        .from('project_streams')
        .delete()
        .eq('project_id', projectId)
        .eq('wallet_address', walletAddress);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting project stream:', error);
      throw error;
    }
  }

  /**
   * Check if a project has a live stream
   */
  static async isProjectLive(projectId: string): Promise<boolean> {
    try {
      const stream = await this.getProjectStream(projectId);
      return stream?.status === 'live';
    } catch (error) {
      console.error('Error checking if project is live:', error);
      return false;
    }
  }

  /**
   * Get streaming type for a project
   */
  static async getStreamingType(projectId: string): Promise<'third-party' | 'onsite' | null> {
    try {
      const stream = await this.getProjectStream(projectId);
      console.log('🎮 getStreamingType result:', { 
        projectId, 
        streamingType: stream?.streamingType,
        streamExists: !!stream 
      });
      return stream?.streamingType || null;
    } catch (error) {
      console.error('🎮 Error getting streaming type:', error);
      return null;
    }
  }

  /**
   * Get WebRTC WHIP endpoint for a project
   */
  static getWhipEndpoint(streamKey: string): string {
    return `https://webrtc.in01.erebrus.io/${streamKey}/whip`;
  }

  /**
   * Get public HLS viewing URL for a project
   */
  static getPublicViewUrl(streamKey: string, streamingType: 'third-party' | 'onsite' = 'third-party'): string {
    if (streamingType === 'onsite') {
      // Onsite: no /live/, no /index.m3u8
      return `https://stream.in01.erebrus.io/${streamKey}/index.m3u8`;
    } else {
      // Third-party: with /live/, with /index.m3u8
      return `https://stream.in01.erebrus.io/live/${streamKey}/index.m3u8`;
    }
  }

  /**
   * Get chat room status for a project
   */
  static async getChatRoomStatus(projectId: string): Promise<{
    isActive: boolean;
    participantCount: number;
    messageCount: number;
    onlineCount: number;
  }> {
    try {
      const chatRoomId = `chat_${projectId}`;
      const response = await fetch(`/api/chat/stats?roomId=${chatRoomId}`);
      
      if (!response.ok) {
        return { isActive: false, participantCount: 0, messageCount: 0, onlineCount: 0 };
      }
      
      const { stats } = await response.json();
      return stats || { isActive: false, participantCount: 0, messageCount: 0, onlineCount: 0 };
    } catch (error) {
      console.error('Error getting chat room status:', error);
      return { isActive: false, participantCount: 0, messageCount: 0, onlineCount: 0 };
    }
  }

  /**
   * Subscribe to real-time stream status updates
   */
  static subscribeToStreamUpdates(
    projectId: string, 
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`stream_${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_streams',
        filter: `project_id=eq.${projectId}`
      }, callback)
      .subscribe();
  }
}