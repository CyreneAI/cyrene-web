// services/streamingService.ts
import { supabase } from '@/lib/supabase';

export interface ProjectStream {
  id: string;
  projectId: string;
  projectType: 'idea' | 'token';
  walletAddress: string;
  streamUrl: string; // Base RTMP URL
  streamKey: string;
  status: 'live' | 'offline';
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
  title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Convert RTMP URL to HLS URL - FIXED VERSION
export const convertRtmpToHls = (rtmpUrl: string, streamKey: string): string => {
  console.log('Converting RTMP to HLS:', { rtmpUrl, streamKey });
  
  if (rtmpUrl.includes('erebrus.io')) {
    // Handle Erebrus URLs - expected format: {base_url}/{stream_key}/index.m3u8
    // Remove trailing slash if present and ensure proper format
    const cleanUrl = rtmpUrl.replace(/\/+$/, '');
    const hlsUrl = `${cleanUrl}/${streamKey}/index.m3u8`;
    console.log('Generated HLS URL:', hlsUrl);
    return hlsUrl;
  }
  
  // Fallback for other RTMP servers
  // Convert rtmp://server/live to http://server/hls
  if (rtmpUrl.startsWith('rtmp://')) {
    const cleanUrl = rtmpUrl.replace('rtmp://', 'http://').replace(/\/live\/?$/, '/hls');
    return `${cleanUrl}/${streamKey}.m3u8`;
  }
  
  // If it's already HTTP/HTTPS, assume it's the base URL
  const cleanUrl = rtmpUrl.replace(/\/+$/, '');
  return `${cleanUrl}/${streamKey}/index.m3u8`;
};

// Convert between DB and frontend formats
const dbToFrontend = (dbStream: ProjectStreamDB): ProjectStream => ({
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
});

const frontendToDb = (stream: Omit<ProjectStream, 'id' | 'createdAt' | 'updatedAt'>): Omit<ProjectStreamDB, 'id' | 'created_at' | 'updated_at'> => ({
  project_id: stream.projectId,
  project_type: stream.projectType,
  wallet_address: stream.walletAddress,
  stream_url: stream.streamUrl,
  stream_key: stream.streamKey,
  status: stream.status,
  title: stream.title,
  description: stream.description
});

export class StreamingService {
  /**
   * Get stream for a specific project
   */
  static async getProjectStream(projectId: string): Promise<ProjectStream | null> {
    try {
      const { data, error } = await supabase
        .from('project_streams')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No stream found
        }
        throw error;
      }

      return data ? dbToFrontend(data as ProjectStreamDB) : null;
    } catch (error) {
      console.error('Error fetching project stream:', error);
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
    title?: string;
    description?: string;
  }): Promise<ProjectStream> {
    try {
      console.log('Upserting stream data:', streamData);
      
      const dbData = frontendToDb({
        ...streamData,
        status: 'offline' // Default to offline when creating/updating
      });

      console.log('DB data to upsert:', dbData);

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
        console.log('Updating existing stream');
        const { data, error } = await supabase
          .from('project_streams')
          .update(dbData)
          .eq('project_id', streamData.projectId)
          .eq('wallet_address', streamData.walletAddress)
          .select('*')
          .single();

        if (error) {
          console.error('Update error:', error);
          throw new Error(`Failed to update stream: ${error.message}`);
        }
        result = data;
      } else {
        // Insert new stream
        console.log('Inserting new stream');
        const { data, error } = await supabase
          .from('project_streams')
          .insert([dbData])
          .select('*')
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw new Error(`Failed to create stream: ${error.message}`);
        }
        result = data;
      }

      if (!result) {
        throw new Error('No data returned from database operation');
      }

      console.log('Upsert successful:', result);
      return dbToFrontend(result as ProjectStreamDB);
    } catch (error) {
      console.error('Error upserting project stream:', error);
      if (error instanceof Error) {
        throw new Error(`Stream operation failed: ${error.message}`);
      } else {
        throw new Error('Stream operation failed: Unknown error');
      }
    }
  }

  /**
   * Start stream (set status to live)
   */
  static async startStream(projectId: string, walletAddress: string): Promise<ProjectStream | null> {
    try {
      const { data, error } = await supabase
        .from('project_streams')
        .update({ status: 'live' })
        .eq('project_id', projectId)
        .eq('wallet_address', walletAddress)
        .select('*')
        .single();

      if (error) throw error;

      return data ? dbToFrontend(data as ProjectStreamDB) : null;
    } catch (error) {
      console.error('Error starting stream:', error);
      throw error;
    }
  }

  /**
   * Stop stream (set status to offline)
   */
  static async stopStream(projectId: string, walletAddress: string): Promise<ProjectStream | null> {
    try {
      const { data, error } = await supabase
        .from('project_streams')
        .update({ status: 'offline' })
        .eq('project_id', projectId)
        .eq('wallet_address', walletAddress)
        .select('*')
        .single();

      if (error) throw error;

      return data ? dbToFrontend(data as ProjectStreamDB) : null;
    } catch (error) {
      console.error('Error stopping stream:', error);
      throw error;
    }
  }

  /**
   * Delete a project stream
   */
  static async deleteProjectStream(projectId: string, walletAddress: string): Promise<boolean> {
    try {
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
   * Get HLS URL for a project stream
   */
  static async getStreamUrl(projectId: string): Promise<string | null> {
    try {
      const stream = await this.getProjectStream(projectId);
      
      if (!stream || stream.status !== 'live') {
        return null;
      }

      return convertRtmpToHls(stream.streamUrl, stream.streamKey);
    } catch (error) {
      console.error('Error getting stream URL:', error);
      return null;
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