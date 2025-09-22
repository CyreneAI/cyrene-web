// components/WebRTCStreamer.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Play, Square, AlertCircle, Loader2 } from 'lucide-react';

interface WebRTCStreamerProps {
  streamKey: string;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
  onError?: (error: string) => void;
}

export default function WebRTCStreamer({ 
  streamKey, 
  onStreamStart, 
  onStreamStop, 
  onError 
}: WebRTCStreamerProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Force H264 in SDP for better compatibility
  const forceH264 = (sdp: string): string => {
    return sdp
      .split('\r\n')
      .filter(line => !line.includes('VP8') && !line.includes('VP9'))
      .join('\r\n');
  };

  // Initialize media stream
  const initializeMedia = async (): Promise<MediaStream> => {
    try {
      const constraints = {
        video: videoEnabled ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: audioEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      streamRef.current = stream;
      return stream;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to access camera/microphone';
      throw new Error(errorMsg);
    }
  };

  // Start WebRTC WHIP streaming
  const startStreaming = async () => {
    if (!streamKey) {
      setError('Stream key is required');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      // 1. Get media stream
      const stream = await initializeMedia();

      // 2. Create PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // 3. Wait for ICE gathering to complete
      const iceComplete = new Promise<void>((resolve) => {
        pc.onicecandidate = (event) => {
          if (!event.candidate) {
            resolve();
          }
        };
      });

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setError('Connection failed. Please try again.');
          stopStreaming();
        }
      };

      // 4. Create local offer
      const offer = await pc.createOffer({ 
        offerToReceiveAudio: false, 
        offerToReceiveVideo: false 
      });
      
      await pc.setLocalDescription(offer);

      // 5. Wait for ICE gathering to complete
      await iceComplete;

      // 6. Filter SDP to prioritize H264
      const offerSDP = forceH264(pc.localDescription!.sdp);

      // 7. Send the SDP to MediaMTX WHIP endpoint
      const whipUrl = `https://webrtc.in01.erebrus.io/${streamKey}/whip`;
      console.log('Connecting to WHIP endpoint:', whipUrl);

      const response = await fetch(whipUrl, {
        method: 'POST',
        body: offerSDP,
        headers: { 
          'Content-Type': 'application/sdp',
          'Accept': 'application/sdp'
        }
      });

      if (!response.ok) {
        throw new Error(`WHIP server error: ${response.status} ${response.statusText}`);
      }

      // 8. Receive answer SDP from server
      const answerSDP = await response.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSDP });

      setIsStreaming(true);
      setIsInitializing(false);
      onStreamStart?.();
      console.log('WebRTC streaming started successfully!');

    } catch (err) {
      console.error('Failed to start streaming:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to start streaming';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsInitializing(false);
      stopStreaming();
    }
  };

  // Stop streaming
  const stopStreaming = () => {
    try {
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Clear video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      setIsStreaming(false);
      setIsInitializing(false);
      onStreamStop?.();
      console.log('Streaming stopped');
    } catch (err) {
      console.error('Error stopping stream:', err);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Stream Status Overlay */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {isStreaming && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-600/90 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
          )}
          {isInitializing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-600/90 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              Connecting...
            </div>
          )}
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
          <button
            onClick={toggleVideo}
            disabled={isInitializing}
            className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
              videoEnabled 
                ? 'bg-white/20 text-white hover:bg-white/30' 
                : 'bg-red-600/80 text-white hover:bg-red-600/90'
            }`}
            title={videoEnabled ? 'Disable video' : 'Enable video'}
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleAudio}
            disabled={isInitializing}
            className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
              audioEnabled 
                ? 'bg-white/20 text-white hover:bg-white/30' 
                : 'bg-red-600/80 text-white hover:bg-red-600/90'
            }`}
            title={audioEnabled ? 'Mute audio' : 'Unmute audio'}
          >
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-600/20 border border-red-500/30 rounded-xl text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Stream Controls */}
      <div className="flex gap-3">
        {!isStreaming ? (
          <button
            onClick={startStreaming}
            disabled={isInitializing || !streamKey}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
          >
            {isInitializing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            {isInitializing ? 'Starting Stream...' : 'Start Streaming'}
          </button>
        ) : (
          <button
            onClick={stopStreaming}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
          >
            <Square className="w-5 h-5" />
            Stop Streaming
          </button>
        )}
      </div>

      {/* Browser Compatibility Note */}
      <div className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3">
        <strong>Note:</strong> Browser streaming requires camera and microphone permissions. 
        For best quality, use a modern browser like Chrome, Firefox, or Safari.
      </div>
    </div>
  );
}