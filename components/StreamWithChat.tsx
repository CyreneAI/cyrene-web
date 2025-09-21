import React from 'react';
import { useProjectStream } from '@/hooks/useProjectStream';
import LiveStreamPlayer from './LiveStreamPlayer';
import LiveChat from './LiveChat';

interface StreamWithChatProps {
  projectId: string;
  className?: string;
}

export function StreamWithChat({ projectId, className = "" }: StreamWithChatProps) {
  const { stream, streamSource, isLive, isLoading, error } = useProjectStream(projectId);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-white">Loading stream...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  const chatRoomId = projectId; // Chat will add 'chat_' prefix

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Video Player - 2/3 width */}
      <div className="lg:col-span-2">
        <LiveStreamPlayer
          source={streamSource}
          title={stream?.title || "Live Stream"}
          isLive={isLive}
       
        
        />
      </div>

      {/* Live Chat - 1/3 width */}
      <div className="lg:col-span-1">
        <LiveChat
          roomId={chatRoomId}
          isStreamLive={isLive}
          title="Live Chat"
          autoCreateRoom={true}
        />
      </div>
    </div>
  );
}