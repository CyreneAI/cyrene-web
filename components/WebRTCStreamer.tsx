import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Play, Square, 
  AlertCircle, Loader2, Monitor, MonitorOff,
  Settings, Camera, Maximize2
} from 'lucide-react';

interface WebRTCStreamerProps {
  streamKey: string;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
  onError?: (error: string) => void;
}

type StreamSource = 'camera' | 'screen' | 'both';
type PipPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type PipSize = 'small' | 'medium' | 'large';

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
  const [streamSource, setStreamSource] = useState<StreamSource>('camera');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSwitchingSource, setIsSwitchingSource] = useState(false);
  
  // PiP (Picture-in-Picture) settings for hybrid mode
  const [pipPosition, setPipPosition] = useState<PipPosition>('bottom-right');
  const [pipSize, setPipSize] = useState<PipSize>('medium');
  const [showPipControls, setShowPipControls] = useState(false);
  
  // Video settings
  const [videoQuality, setVideoQuality] = useState<'720p' | '1080p' | '4k'>('720p');
  const [frameRate, setFrameRate] = useState<number>(30);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositeStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Get video constraints based on quality
  const getVideoConstraints = () => {
    const qualities = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '4k': { width: 3840, height: 2160 }
    };

    return {
      width: { ideal: qualities[videoQuality].width },
      height: { ideal: qualities[videoQuality].height },
      frameRate: { ideal: frameRate }
    };
  };

  // Force H264 in SDP for better compatibility
  const forceH264 = (sdp: string): string => {
    return sdp
      .split('\r\n')
      .filter(line => !line.includes('VP8') && !line.includes('VP9'))
      .join('\r\n');
  };

  // Initialize camera stream
  const initializeCameraStream = async (): Promise<MediaStream> => {
    try {
      const constraints = {
        video: videoEnabled ? getVideoConstraints() : false,
        audio: audioEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;
      return stream;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to access camera/microphone';
      throw new Error(errorMsg);
    }
  };

  // Initialize screen share stream
  const initializeScreenStream = async (): Promise<MediaStream> => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: getVideoConstraints(),
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Handle user stopping screen share via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        console.log('Screen sharing stopped by user');
        if (streamSource === 'screen' || streamSource === 'both') {
          switchStreamSource('camera');
        }
      };

      screenStreamRef.current = screenStream;
      return screenStream;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to capture screen';
      throw new Error(errorMsg);
    }
  };

  // Update video preview based on current source
  const updateVideoPreview = () => {
    if (!localVideoRef.current) return;

    switch (streamSource) {
      case 'camera':
        localVideoRef.current.srcObject = cameraStreamRef.current;
        if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
        break;
      case 'screen':
        localVideoRef.current.srcObject = screenStreamRef.current;
        if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
        break;
      case 'both':
        // Main view shows screen, PiP shows camera
        localVideoRef.current.srcObject = screenStreamRef.current;
        if (pipVideoRef.current) pipVideoRef.current.srcObject = cameraStreamRef.current;
        break;
    }
  };

  // Get current active stream for WebRTC
  const getCurrentStream = async (): Promise<MediaStream | null> => {
    switch (streamSource) {
      case 'camera':
        return cameraStreamRef.current;
      
      case 'screen':
        return screenStreamRef.current;
      
      case 'both':
        // Create composite stream for both mode
        if (!compositeStreamRef.current) {
          return await createCompositeStream();
        }
        return compositeStreamRef.current;
      
      default:
        return null;
    }
  };

  // Replace tracks in active peer connection
  const replaceTracksInPeerConnection = async () => {
    if (!peerConnectionRef.current) return;

    const pc = peerConnectionRef.current;
    
    // Stop existing composite if switching away from 'both' mode
    if (streamSource !== 'both') {
      stopCompositeStream();
    }
    
    const newStream = await getCurrentStream();
    if (!newStream) return;

    const senders = pc.getSenders();

    // Replace video track
    const newVideoTrack = newStream.getVideoTracks()[0];
    const videoSender = senders.find(sender => sender.track?.kind === 'video');
    if (videoSender && newVideoTrack) {
      await videoSender.replaceTrack(newVideoTrack);
      console.log('Replaced video track');
    }

    // Replace audio track
    const newAudioTrack = newStream.getAudioTracks()[0];
    const audioSender = senders.find(sender => sender.track?.kind === 'audio');
    if (audioSender && newAudioTrack) {
      await audioSender.replaceTrack(newAudioTrack);
      console.log('Replaced audio track');
    }
  };

  // Switch stream source (works during active streaming)
  const switchStreamSource = async (newSource: StreamSource) => {
    if (isSwitchingSource) return;
    
    setIsSwitchingSource(true);
    setError(null);

    try {
      // Initialize streams based on new source
      if (newSource === 'camera' || newSource === 'both') {
        if (!cameraStreamRef.current) {
          await initializeCameraStream();
        }
      }

      if (newSource === 'screen' || newSource === 'both') {
        if (!screenStreamRef.current) {
          await initializeScreenStream();
        }
      }

      // Update the source
      setStreamSource(newSource);

      // Update video preview
      updateVideoPreview();

      // If streaming, replace tracks in peer connection
      if (isStreaming) {
        await replaceTracksInPeerConnection();
      }

      console.log(`Switched to ${newSource} source`);
    } catch (err) {
      console.error('Error switching source:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to switch source';
      setError(errorMsg);
    } finally {
      setIsSwitchingSource(false);
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
      // Ensure we have the required streams
      if (streamSource === 'camera' || streamSource === 'both') {
        if (!cameraStreamRef.current) {
          await initializeCameraStream();
        }
      }

      if (streamSource === 'screen' || streamSource === 'both') {
        if (!screenStreamRef.current) {
          await initializeScreenStream();
        }
      }

      updateVideoPreview();

      // Get current stream (will create composite if needed)
      const stream = await getCurrentStream();
      if (!stream || stream.getTracks().length === 0) {
        throw new Error('No media tracks available');
      }

      // Create PeerConnection
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

      // Wait for ICE gathering to complete
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

      // Create local offer
      const offer = await pc.createOffer({ 
        offerToReceiveAudio: false, 
        offerToReceiveVideo: false 
      });
      
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await iceComplete;

      // Filter SDP to prioritize H264
      const offerSDP = forceH264(pc.localDescription!.sdp);

      // Send the SDP to MediaMTX WHIP endpoint
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

      // Receive answer SDP from server
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
      // Stop composite stream if active
      stopCompositeStream();

      // Stop all tracks
      [cameraStreamRef, screenStreamRef].forEach(ref => {
        if (ref.current) {
          ref.current.getTracks().forEach(track => track.stop());
          ref.current = null;
        }
      });

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Clear video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (pipVideoRef.current) {
        pipVideoRef.current.srcObject = null;
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
    const currentStream = streamSource === 'camera' ? cameraStreamRef.current : screenStreamRef.current;
    if (currentStream) {
      const videoTrack = currentStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    const audioStream = streamSource === 'screen' ? screenStreamRef.current : cameraStreamRef.current;
    if (audioStream) {
      const audioTrack = audioStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Get PiP positioning classes
  const getPipPositionClasses = () => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-20 left-4',
      'bottom-right': 'bottom-20 right-4'
    };
    return positions[pipPosition];
  };

  // Get PiP size dimensions
  const getPipSizeDimensions = () => {
    const sizes = {
      'small': { width: 128, height: 96 },
      'medium': { width: 192, height: 144 },
      'large': { width: 256, height: 192 }
    };
    return sizes[pipSize];
  };

  // Get PiP position coordinates for canvas
  const getPipPositionCoordinates = (canvasWidth: number, canvasHeight: number, pipWidth: number, pipHeight: number) => {
    const padding = 16;
    const positions = {
      'top-left': { x: padding, y: padding },
      'top-right': { x: canvasWidth - pipWidth - padding, y: padding },
      'bottom-left': { x: padding, y: canvasHeight - pipHeight - padding },
      'bottom-right': { x: canvasWidth - pipWidth - padding, y: canvasHeight - pipHeight - padding }
    };
    return positions[pipPosition];
  };

  // Create composite video stream (screen + camera overlay)
  const createCompositeStream = async (): Promise<MediaStream> => {
    if (!screenStreamRef.current || !cameraStreamRef.current) {
      throw new Error('Both camera and screen streams are required');
    }

    // Create canvas for compositing
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Create video elements for compositing
    const screenVideo = document.createElement('video');
    screenVideo.srcObject = screenStreamRef.current;
    screenVideo.play();

    const cameraVideo = document.createElement('video');
    cameraVideo.srcObject = cameraStreamRef.current;
    cameraVideo.play();

    // Wait for videos to be ready
    await Promise.all([
      new Promise(resolve => screenVideo.onloadedmetadata = resolve),
      new Promise(resolve => cameraVideo.onloadedmetadata = resolve)
    ]);

    // Compositing function
    const composite = () => {
      if (!ctx || !canvasRef.current) return;

      // Draw screen video (full canvas)
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

      // Draw camera video (overlay)
      const pipDimensions = getPipSizeDimensions();
      const pipCoords = getPipPositionCoordinates(canvas.width, canvas.height, pipDimensions.width, pipDimensions.height);
      
      // Add border and shadow to camera overlay
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      
      ctx.drawImage(
        cameraVideo,
        pipCoords.x,
        pipCoords.y,
        pipDimensions.width,
        pipDimensions.height
      );
      
      ctx.strokeRect(
        pipCoords.x,
        pipCoords.y,
        pipDimensions.width,
        pipDimensions.height
      );

      animationFrameRef.current = requestAnimationFrame(composite);
    };

    // Start compositing
    composite();

    // Create stream from canvas
    const compositeVideoStream = canvas.captureStream(30);
    
    // Add audio from camera
    const audioTrack = cameraStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      compositeVideoStream.addTrack(audioTrack);
    }

    compositeStreamRef.current = compositeVideoStream;
    return compositeVideoStream;
  };

  // Stop composite stream
  const stopCompositeStream = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (compositeStreamRef.current) {
      compositeStreamRef.current.getTracks().forEach(track => track.stop());
      compositeStreamRef.current = null;
    }
    canvasRef.current = null;
  };
  const getPipSizeClasses = () => {
    const sizes = {
      'small': 'w-32 h-24',
      'medium': 'w-48 h-36',
      'large': 'w-64 h-48'
    };
    return sizes[pipSize];
  };

  // Update composite stream when PiP settings change
  useEffect(() => {
    if (streamSource === 'both' && isStreaming && compositeStreamRef.current) {
      // Restart composite with new settings
      const restartComposite = async () => {
        stopCompositeStream();
        await createCompositeStream();
        await replaceTracksInPeerConnection();
      };
      restartComposite();
    }
  }, [pipPosition, pipSize]);

  // Update preview when source changes
  useEffect(() => {
    updateVideoPreview();
  }, [streamSource]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
      stopCompositeStream();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Settings Panel */}
      {showSettings && !isStreaming && (
        <div className="bg-gray-900/90 rounded-xl p-4 border border-gray-700 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium">Stream Settings</h4>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Video Quality</label>
            <select
              value={videoQuality}
              onChange={(e) => setVideoQuality(e.target.value as '720p' | '1080p' | '4k')}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="720p">720p (1280x720)</option>
              <option value="1080p">1080p (1920x1080)</option>
              <option value="4k">4K (3840x2160)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Frame Rate</label>
            <select
              value={frameRate}
              onChange={(e) => setFrameRate(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="24">24 FPS</option>
              <option value="30">30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </div>
        </div>
      )}

      {/* Source Selection - Always Available */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => switchStreamSource('camera')}
          disabled={isSwitchingSource || isInitializing}
          className={`p-3 rounded-lg border-2 transition-colors disabled:opacity-50 ${
            streamSource === 'camera'
              ? 'border-blue-500 bg-blue-500/20 text-blue-300'
              : 'border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-500'
          }`}
        >
          <Camera className="w-5 h-5 mx-auto mb-1" />
          <span className="text-xs font-medium">Camera</span>
        </button>

        <button
          onClick={() => switchStreamSource('screen')}
          disabled={isSwitchingSource || isInitializing}
          className={`p-3 rounded-lg border-2 transition-colors disabled:opacity-50 ${
            streamSource === 'screen'
              ? 'border-purple-500 bg-purple-500/20 text-purple-300'
              : 'border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-500'
          }`}
        >
          <Monitor className="w-5 h-5 mx-auto mb-1" />
          <span className="text-xs font-medium">Screen</span>
        </button>

        <button
          onClick={() => switchStreamSource('both')}
          disabled={isSwitchingSource || isInitializing}
          className={`p-3 rounded-lg border-2 transition-colors disabled:opacity-50 ${
            streamSource === 'both'
              ? 'border-green-500 bg-green-500/20 text-green-300'
              : 'border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-500'
          }`}
        >
          <Maximize2 className="w-5 h-5 mx-auto mb-1" />
          <span className="text-xs font-medium">Both</span>
        </button>
      </div>

      {/* Video Preview */}
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Picture-in-Picture for hybrid mode */}
        {streamSource === 'both' && (
          <div 
            className={`absolute ${getPipPositionClasses()} ${getPipSizeClasses()} rounded-lg overflow-hidden border-2 border-white/50 shadow-lg transition-all duration-300 group cursor-move`}
            onMouseEnter={() => setShowPipControls(true)}
            onMouseLeave={() => setShowPipControls(false)}
          >
            <video
              ref={pipVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* PiP Controls Overlay */}
            {showPipControls && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="space-y-2 p-2">
                  {/* Position Controls */}
                  <div className="flex gap-1 justify-center mb-2">
                    <button
                      onClick={() => setPipPosition('top-left')}
                      className={`p-1.5 rounded ${pipPosition === 'top-left' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                      title="Top Left"
                    >
                      <div className="w-3 h-3 border-2 border-l-4 border-t-4 border-white rounded-tl"></div>
                    </button>
                    <button
                      onClick={() => setPipPosition('top-right')}
                      className={`p-1.5 rounded ${pipPosition === 'top-right' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                      title="Top Right"
                    >
                      <div className="w-3 h-3 border-2 border-r-4 border-t-4 border-white rounded-tr"></div>
                    </button>
                  </div>
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => setPipPosition('bottom-left')}
                      className={`p-1.5 rounded ${pipPosition === 'bottom-left' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                      title="Bottom Left"
                    >
                      <div className="w-3 h-3 border-2 border-l-4 border-b-4 border-white rounded-bl"></div>
                    </button>
                    <button
                      onClick={() => setPipPosition('bottom-right')}
                      className={`p-1.5 rounded ${pipPosition === 'bottom-right' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                      title="Bottom Right"
                    >
                      <div className="w-3 h-3 border-2 border-r-4 border-b-4 border-white rounded-br"></div>
                    </button>
                  </div>
                  
                  {/* Size Controls */}
                  <div className="flex gap-1 justify-center mt-2 pt-2 border-t border-gray-600">
                    <button
                      onClick={() => setPipSize('small')}
                      className={`px-2 py-1 text-xs rounded ${pipSize === 'small' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                      S
                    </button>
                    <button
                      onClick={() => setPipSize('medium')}
                      className={`px-2 py-1 text-xs rounded ${pipSize === 'medium' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                      M
                    </button>
                    <button
                      onClick={() => setPipSize('large')}
                      className={`px-2 py-1 text-xs rounded ${pipSize === 'large' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                      L
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Stream Status Overlay */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {isStreaming && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-600/90 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
          )}
          {(isInitializing || isSwitchingSource) && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-600/90 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              {isSwitchingSource ? 'Switching...' : 'Connecting...'}
            </div>
          )}
        </div>

        {/* Source Indicator */}
        <div className="absolute top-4 right-4">
          <div className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium">
            {streamSource === 'camera' && '📹 Camera'}
            {streamSource === 'screen' && '🖥️ Screen'}
            {streamSource === 'both' && '📹 + 🖥️ Hybrid'}
          </div>
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
          <button
            onClick={toggleVideo}
            disabled={isInitializing || isSwitchingSource}
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
            disabled={isInitializing || isSwitchingSource}
            className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
              audioEnabled 
                ? 'bg-white/20 text-white hover:bg-white/30' 
                : 'bg-red-600/80 text-white hover:bg-red-600/90'
            }`}
            title={audioEnabled ? 'Mute audio' : 'Unmute audio'}
          >
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {!isStreaming && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              disabled={isSwitchingSource}
              className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-colors disabled:opacity-50"
              title="Stream settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
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
            disabled={isInitializing || !streamKey || isSwitchingSource}
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

      {/* Info */}
      <div className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3 space-y-1">
        <p><strong>Camera:</strong> Stream from your webcam</p>
        <p><strong>Screen:</strong> Share your screen (includes system audio if available)</p>
        <p><strong>Both:</strong> Screen share with webcam overlay - hover over camera to adjust position & size</p>
        <p className="text-green-400 mt-2">
          ✓ You can switch between sources anytime, even during live streaming!
        </p>
        <p className="text-blue-400">
          ✓ In hybrid mode, hover over the camera overlay to reposition and resize it!
        </p>
        <p className="text-gray-500 mt-1">
          Note: Requires camera/microphone/screen permissions. Use Chrome, Firefox, or Safari for best results.
        </p>
      </div>
    </div>
  );
}