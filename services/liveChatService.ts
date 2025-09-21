// services/liveChatService.ts - Simplified without health checks
import { getRedisClient, getRedisPubSub } from '@/lib/redis';

export interface LiveChatMessage {
  id: string;
  roomId: string;
  walletAddress: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'normal' | 'system' | 'moderator';
}

export interface ChatRoom {
  roomId: string;
  streamId: string;
  isActive: boolean;
  createdAt: number;
  participantCount: number;
}

export class LiveChatService {
  private redis = getRedisClient();
  private pubsub = getRedisPubSub();

  // Create a temporary chat room for a live stream
  async createChatRoom(streamId: string, roomId: string): Promise<boolean> {
    try {
      console.log(`Creating chat room ${roomId} for stream ${streamId}`);
      
      const roomKey = `chat:room:${roomId}`;
      const room: ChatRoom = {
        roomId,
        streamId,
        isActive: true,
        createdAt: Date.now(),
        participantCount: 0
      };

      // Store room info with 24-hour TTL
      await this.redis.setex(roomKey, 24 * 60 * 60, JSON.stringify(room));
      
      // Create message list with TTL
      const messagesKey = `chat:messages:${roomId}`;
      await this.redis.expire(messagesKey, 24 * 60 * 60);

      console.log(`Created chat room ${roomId} successfully`);
      return true;
    } catch (error) {
      console.error('Error creating chat room:', error);
      return false;
    }
  }

  // Add message to live chat
  async addMessage(message: Omit<LiveChatMessage, 'id' | 'timestamp'>): Promise<LiveChatMessage | null> {
    try {
      console.log('Adding message:', message);
      
      const chatMessage: LiveChatMessage = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };

      const messagesKey = `chat:messages:${message.roomId}`;
      
      // Add message to Redis list (FIFO with size limit)
      await this.redis.lpush(messagesKey, JSON.stringify(chatMessage));
      await this.redis.ltrim(messagesKey, 0, 999); // Keep only last 1000 messages
      await this.redis.expire(messagesKey, 24 * 60 * 60); // Reset TTL

      // Publish to real-time subscribers
      await this.pubsub.publish(`chat:${message.roomId}`, JSON.stringify({
        type: 'message',
        data: chatMessage
      }));

      // Increment participant count if new user
      const participantKey = `chat:participants:${message.roomId}`;
      await this.redis.sadd(participantKey, message.walletAddress);
      await this.redis.expire(participantKey, 24 * 60 * 60);

      console.log('Message added successfully:', chatMessage.id);
      return chatMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  // Get recent messages for a room
  async getMessages(roomId: string, limit: number = 100): Promise<LiveChatMessage[]> {
    try {
      console.log(`Getting messages for room: ${roomId}`);
      
      const messagesKey = `chat:messages:${roomId}`;
      const messageStrings = await this.redis.lrange(messagesKey, 0, limit - 1);
      
      const messages = messageStrings
        .map(str => {
          try {
            return JSON.parse(str) as LiveChatMessage;
          } catch {
            return null;
          }
        })
        .filter((msg): msg is LiveChatMessage => msg !== null)
        .reverse(); // Reverse to get chronological order
      
      console.log(`Retrieved ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // End chat room and optionally archive messages
  async endChatRoom(roomId: string, archiveMessages: boolean = false): Promise<boolean> {
    try {
      if (archiveMessages) {
        // Send final system message
        await this.addMessage({
          roomId,
          walletAddress: 'system',
          username: 'System',
          message: 'Stream ended. Chat will be available for 24 hours.',
          type: 'system'
        });
      }

      // Just mark room as inactive, let TTL handle cleanup
      const roomKey = `chat:room:${roomId}`;
      const roomData = await this.redis.get(roomKey);
      if (roomData) {
        const room = JSON.parse(roomData) as ChatRoom;
        room.isActive = false;
        await this.redis.setex(roomKey, 24 * 60 * 60, JSON.stringify(room));
      }
      
      console.log(`Ended chat room ${roomId}, archived: ${archiveMessages}`);
      return true;
    } catch (error) {
      console.error('Error ending chat room:', error);
      return false;
    }
  }

  // Get chat room stats
  async getRoomStats(roomId: string): Promise<{ 
    participantCount: number; 
    messageCount: number; 
    isActive: boolean;
    onlineCount: number;
  }> {
    try {
      console.log(`Getting stats for room: ${roomId}`);
      
      const roomKey = `chat:room:${roomId}`;
      const participantKey = `chat:participants:${roomId}`;
      const messagesKey = `chat:messages:${roomId}`;
      const onlineKey = `chat:online:${roomId}`;

      const [room, participantCount, messageCount, onlineCount] = await Promise.all([
        this.redis.get(roomKey),
        this.redis.scard(participantKey),
        this.redis.llen(messagesKey),
        this.redis.scard(onlineKey)
      ]);

      const roomData = room ? JSON.parse(room) as ChatRoom : null;

      const stats = {
        participantCount,
        messageCount,
        isActive: roomData?.isActive || false,
        onlineCount
      };
      
      console.log('Room stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error getting room stats:', error);
      return { participantCount: 0, messageCount: 0, isActive: false, onlineCount: 0 };
    }
  }

  // Track online users
  async setUserOnline(roomId: string, walletAddress: string): Promise<void> {
    try {
      const onlineKey = `chat:online:${roomId}`;
      await this.redis.sadd(onlineKey, walletAddress);
      await this.redis.expire(onlineKey, 5 * 60); // 5 minute timeout
    } catch (error) {
      console.error('Error setting user online:', error);
    }
  }

  async setUserOffline(roomId: string, walletAddress: string): Promise<void> {
    try {
      const onlineKey = `chat:online:${roomId}`;
      await this.redis.srem(onlineKey, walletAddress);
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  }

  // Check if room exists and is active
  async isRoomActive(roomId: string): Promise<boolean> {
    try {
      const roomKey = `chat:room:${roomId}`;
      const roomData = await this.redis.get(roomKey);
      if (!roomData) return false;
      
      const room = JSON.parse(roomData) as ChatRoom;
      return room.isActive;
    } catch (error) {
      console.error('Error checking room status:', error);
      return false;
    }
  }
}

export const liveChatService = new LiveChatService();