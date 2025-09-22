"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Script from "next/script";

export type LiveStreamSource =
  | { type: "youtube"; url: string }
  | { type: "twitch"; url: string }
  | { type: "iframe"; url: string }
  | { type: "hls"; url: string; poster?: string; streamingType?: 'third-party' | 'onsite' }
  | { type: "rtmp"; url: string; streamKey: string; poster?: string; streamingType?: 'third-party' | 'onsite' }
  | { type: "mp4"; url: string; poster?: string };

interface LiveStreamPlayerProps {
  source?: LiveStreamSource | null;
  className?: string;
  title?: string;
  isLive?: boolean;
}

// Video.js type definitions
interface VideoJsPlayer {
  dispose(): void;
  on(event: string, callback: () => void): void;
  ready(callback: () => void): void;
  error(): { code: number; message: string } | null;
  play(): Promise<void>;
  pause(): void;
  src(): string | Array<{ src: string; type: string }>;
  src(source: string | Array<{ src: string; type: string }>): void;
  reset(): void;
  load(): void;
}

interface VideoJsOptions {
  fluid?: boolean;
  responsive?: boolean;
  playbackRates?: number[];
  errorDisplay?: boolean;
  controls?: boolean;
  preload?: string;
  autoplay?: boolean;
  muted?: boolean;
  liveui?: boolean;
  html5?: {
    vhs?: {
      overrideNative?: boolean;
    };
  };
  sources?: Array<{
    src: string;
    type: string;
  }>;
}

// Declare Video.js for TypeScript
declare global {
  interface Window {
    videojs: (element: HTMLVideoElement, options: VideoJsOptions) => VideoJsPlayer;
  }
}

export default function LiveStreamPlayer({ 
  source, 
  className = "", 
  title = "Livestream",
  isLive = false
}: LiveStreamPlayerProps) {
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVideoJsLoaded, setIsVideoJsLoaded] = React.useState(false);
  const [playerError, setPlayerError] = React.useState<string | null>(null);

  // Cleanup function
  const cleanupPlayer = React.useCallback(() => {
    const currentPlayer = playerRef.current;
    if (currentPlayer) {
      try {
        console.log('Disposing Video.js player');
        currentPlayer.dispose();
      } catch (error) {
        console.warn('Error disposing player:', error);
      }
      playerRef.current = null;
    }
  }, []);

  // Test HLS stream availability
  const testStreamAvailability = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors'
      });
      return response.ok;
    } catch (error) {
      console.warn('Stream availability test failed:', error);
      return false; // Assume it might work anyway
    }
  };

  // FIXED: Build HLS URL for RTMP sources only
  const buildHlsUrl = (rtmpUrl: string, streamKey: string, streamingType: 'third-party' | 'onsite' = 'third-party'): string => {
    console.log('Building HLS URL from RTMP:', { rtmpUrl, streamKey, streamingType });
    
    let hlsUrl = '';
    
    if (streamingType === 'onsite') {
      // For onsite (WebRTC) streaming: no /live/ and no /index.m3u8
      hlsUrl = `https://stream.in01.erebrus.io/${streamKey}/index.m3u8`;
    } else {
      // For third-party (OBS) streaming: include /live/ and /index.m3u8
      hlsUrl = `https://stream.in01.erebrus.io/live/${streamKey}/index.m3u8`;
    }
    
    console.log('Generated HLS URL from RTMP:', hlsUrl);
    return hlsUrl;
  };

  // Initialize Video.js player for HLS streams
  useEffect(() => {
    if (!isVideoJsLoaded || !source) return;

    // Only use Video.js for HLS and RTMP streams
    if (source.type === 'hls' || source.type === 'rtmp') {
      
      // Cleanup any existing player first
      cleanupPlayer();
      setPlayerError(null);

      // Create a new video element to avoid "already initialized" error
      const container = containerRef.current;
      if (!container) return;

      // Remove any existing video elements
      const existingVideo = container.querySelector('video');
      if (existingVideo) {
        existingVideo.remove();
      }

      // Create fresh video element
      const videoElement = document.createElement('video');
      videoElement.className = 'video-js vjs-default-skin absolute inset-0 h-full w-full';
      videoElement.controls = true;
      videoElement.preload = 'auto';
      
      if (source.poster) {
        videoElement.poster = source.poster;
      }

      // Add the no-js fallback
      videoElement.innerHTML = `
        <p class="vjs-no-js">
          To view this video, please enable JavaScript and consider upgrading to a web browser that
          <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">
            supports HTML5 video
          </a>.
        </p>
      `;

      container.appendChild(videoElement);

      // FIXED: Determine stream URL without rebuilding if already correct
      let streamUrl = '';
      
      if (source.type === 'hls') {
        // FIXED: Trust the URL from StreamingService and don't rebuild it
        // The StreamingService already provides the correctly formatted URL
        streamUrl = source.url;
        
        console.log('Using HLS URL as provided by service:', {
          url: source.url,
          streamingType: source.streamingType,
          message: 'URL is pre-formatted by StreamingService'
        });
      } else if (source.type === 'rtmp') {
        // Only rebuild for RTMP sources since they need conversion to HLS
        const streamingType = source.streamingType || 'third-party';
        streamUrl = buildHlsUrl(source.url, source.streamKey, streamingType);
        
        console.log('Converted RTMP to HLS:', {
          rtmpUrl: source.url,
          streamKey: source.streamKey,
          streamingType,
          generatedHlsUrl: streamUrl
        });
      }

      console.log('Final stream URL for Video.js:', streamUrl);

      // Test stream availability for live streams
      if (isLive) {
        testStreamAvailability(streamUrl).then((isAvailable) => {
          if (!isAvailable) {
            console.warn('Stream may not be available yet');
          }
        });
      }

      try {
        // Initialize Video.js player
        playerRef.current = window.videojs(videoElement, {
          fluid: true,
          responsive: true,
          playbackRates: [0.5, 1, 1.5, 2],
          errorDisplay: true,
          controls: true,
          preload: 'auto',
          autoplay: isLive, // Auto-play for live streams
          muted: isLive, // Auto-muted for autoplay compliance
          liveui: isLive, // Enable live UI for live streams
          html5: {
            vhs: {
              overrideNative: true
            }
          },
          sources: [{
            src: streamUrl,
            type: 'application/x-mpegURL'
          }]
        });

        // Handle events
        playerRef.current.on('error', function() {
          const error = playerRef.current?.error();
          console.error('Video.js player error:', error);
          setPlayerError('Stream connection failed. The stream may be offline or experiencing issues.');
        });

        playerRef.current.ready(() => {
          console.log('Video.js player is ready');
          setPlayerError(null);
        });

        // Handle connection state for live streams
        if (isLive) {
          playerRef.current.on('loadstart', () => {
            console.log('Live stream load started');
            setPlayerError(null);
          });
          
          playerRef.current.on('loadeddata', () => {
            console.log('Live stream data loaded');
            setPlayerError(null);
          });
          
          playerRef.current.on('canplay', () => {
            console.log('Live stream can play');
            setPlayerError(null);
          });
          
          playerRef.current.on('playing', () => {
            console.log('Live stream playing');
            setPlayerError(null);
          });

          // Auto-retry for live streams with correct Video.js API
          playerRef.current.on('error', () => {
            setTimeout(() => {
              if (playerRef.current) {
                console.log('Retrying live stream connection...');
                try {
                  // Use correct Video.js API for setting source
                  playerRef.current.src([{ 
                    src: streamUrl, 
                    type: 'application/x-mpegURL' 
                  }]);
                  playerRef.current.load(); // Reload the player
                  playerRef.current.play().catch(() => {
                    setPlayerError('Unable to connect to live stream. Please try refreshing the page.');
                  });
                } catch (retryError) {
                  console.error('Error during retry:', retryError);
                  setPlayerError('Stream connection failed during retry.');
                }
              }
            }, 5000);
          });
        }

      } catch (error) {
        console.error('Error initializing Video.js:', error);
        setPlayerError('Failed to initialize video player');
      }
    }

    // Cleanup function
    return cleanupPlayer;
  }, [isVideoJsLoaded, source, isLive, cleanupPlayer]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupPlayer;
  }, [cleanupPlayer]);

  return (
    <>
      {/* Load Video.js CSS and JS */}
      <link 
        href="https://vjs.zencdn.net/8.10.0/video-js.css" 
        rel="stylesheet"
      />
      <Script
        src="https://vjs.zencdn.net/8.10.0/video.min.js"
        onLoad={() => {
          console.log('Video.js loaded');
          setIsVideoJsLoaded(true);
        }}
        onError={() => console.error('Failed to load Video.js')}
        strategy="lazyOnload"
      />

      <div className={`bg-[#040A25] rounded-[30px] p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white/90 font-medium">{title}</h3>
          {/* Live badge with streaming type indicator */}
          {isLive && (
            <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-300">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              Live
              {/* Show streaming type if available */}
              {(source?.type === 'rtmp' || source?.type === 'hls') && source.streamingType && (
                <span className="text-[10px] opacity-75">
                  • {source.streamingType === 'onsite' ? 'Browser' : 'Stream'}
                </span>
              )}
            </span>
          )}
          {!isLive && source && (
            <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-gray-500/15 text-gray-300">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              Offline
            </span>
          )}
        </div>

        <div className="relative w-full overflow-hidden rounded-2xl bg-black/60" style={{ aspectRatio: "16 / 9" }}>
          {renderPlayer(source, containerRef, isVideoJsLoaded, playerError, isLive)}
        </div>

        {!source && (
          <p className="text-xs text-gray-400 mt-3">No livestream configured for this project yet.</p>
        )}
        
        {playerError && (
          <div className="mt-3 p-3 bg-red-600/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{playerError}</p>
            {isLive && (
              <p className="text-red-200/80 text-xs mt-1">
                The stream may still be starting up. Try refreshing in a few moments.
              </p>
            )}
          </div>
        )}

        {/* Stream info for debugging */}
        {process.env.NODE_ENV === 'development' && source && (
          <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400 space-y-1">
            <p>Stream Type: {source.type}</p>
            <p>URL Used: {source.type === 'hls' ? source.url : source.type === 'rtmp' ? buildHlsUrl(source.url, source.streamKey, source.streamingType || 'third-party') : 'N/A'}</p>
            <p>Live: {isLive ? 'Yes' : 'No'}</p>
            {(source.type === 'rtmp' || source.type === 'hls') && source.streamingType && (
              <p>Streaming Method: {source.streamingType === 'onsite' ? 'Browser (WebRTC)' : 'Third-party (OBS)'}</p>
            )}
            <p className="text-yellow-400">
              Note: HLS URLs are pre-formatted by StreamingService and used as-is
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function renderPlayer(
  source?: LiveStreamSource | null,
  containerRef?: React.RefObject<HTMLDivElement | null>,
  isVideoJsLoaded?: boolean,
  playerError?: string | null,
  isLive?: boolean
) {
  if (!source) return <Placeholder />;

  // Handle YouTube, Twitch, and other iframe sources
  if (source.type === "youtube" || source.type === "twitch" || source.type === "iframe") {
    return (
      <iframe
        src={source.url}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer"
        title="Livestream"
      />
    );
  }

  // Handle HLS and RTMP streams with Video.js
  if (source.type === "hls" || source.type === "rtmp") {
    return (
      <div className="absolute inset-0 h-full w-full">
        <div 
          ref={containerRef}
          className="absolute inset-0 h-full w-full"
        >
          {/* Video element will be dynamically created here */}
        </div>
        {!isVideoJsLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Loading player...</p>
            </div>
          </div>
        )}
        {playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <div className="text-center text-white max-w-sm px-4">
              <div className="text-red-400 mb-2">⚠️</div>
              <p className="text-sm mb-2">{playerError}</p>
              {isLive && (
                <p className="text-xs text-gray-300">
                  Stream may be starting or experiencing connectivity issues
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Handle MP4 streams
  if (source.type === "mp4") {
    return (
      <video
        className="absolute inset-0 h-full w-full"
        src={source.url}
        poster={source.poster}
        controls
        playsInline
      />
    );
  }

  return <Placeholder />;
}

function Placeholder() {
  return (
    <div className="absolute inset-0 grid place-items-center text-gray-400">
      <div className="flex flex-col items-center gap-2">
        <Image src="/Cyrene_logo_text.webp" alt="Cyrene" width={140} height={28} className="opacity-20" />
        <p className="text-xs">Stream not available</p>
      </div>
    </div>
  );
}