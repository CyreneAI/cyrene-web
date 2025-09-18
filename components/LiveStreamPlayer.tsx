"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Script from "next/script";

export type LiveStreamSource =
  | { type: "youtube"; url: string }
  | { type: "twitch"; url: string }
  | { type: "iframe"; url: string }
  | { type: "hls"; url: string; poster?: string }
  | { type: "rtmp"; url: string; streamKey: string; poster?: string }
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

// Video.js type definitions
interface VideoJsPlayer {
  dispose(): void;
  on(event: string, callback: () => void): void;
  ready(callback: () => void): void;
  error(): { code: number; message: string } | null;
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

  // Convert RTMP to HLS URL for Erebrus - FIXED VERSION
  const buildHlsUrl = (rtmpUrl: string, streamKey: string): string => {
    console.log('Building HLS URL:', { rtmpUrl, streamKey });
    
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

  // Initialize Video.js player for HLS streams
  useEffect(() => {
    if (!isVideoJsLoaded || !source) return;

    // Only use Video.js for HLS and RTMP streams
    if (source.type === 'hls' || source.type === 'rtmp') {
      
      // Cleanup any existing player first
      cleanupPlayer();

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

      // Get the stream URL
      let streamUrl = '';
      if (source.type === 'hls') {
        streamUrl = source.url;
      } else if (source.type === 'rtmp') {
        streamUrl = buildHlsUrl(source.url, source.streamKey);
      }

      console.log('Initializing Video.js with URL:', streamUrl);

      // Test if the HLS URL is accessible before initializing player
      const testUrl = async () => {
        try {
          console.log('Testing HLS URL accessibility...');
          const response = await fetch(streamUrl, { method: 'HEAD' });
          console.log('HLS URL test response:', response.status, response.statusText);
          
          if (!response.ok) {
            console.warn('HLS URL returned non-OK status:', response.status);
          }
        } catch (error) {
          console.error('Error testing HLS URL:', error);
        }
      };
      
      testUrl();

      try {
        // Initialize Video.js player
        playerRef.current = window.videojs(videoElement, {
          fluid: true,
          responsive: true,
          playbackRates: [0.5, 1, 1.5, 2],
          errorDisplay: true,
          controls: true,
          preload: 'auto',
          autoplay: isLive,
          muted: isLive, // Auto-muted for autoplay
          liveui: true, // Enable live UI
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
        });

        playerRef.current.ready(() => {
          console.log('Video.js player is ready');
        });

        // Debug events
        playerRef.current.on('loadstart', () => console.log('Load started'));
        playerRef.current.on('loadeddata', () => console.log('Data loaded'));
        playerRef.current.on('canplay', () => console.log('Can play'));
        playerRef.current.on('playing', () => console.log('Playing'));

      } catch (error) {
        console.error('Error initializing Video.js:', error);
      }
    }

    // Cleanup function
    return cleanupPlayer;
  }, [isVideoJsLoaded, source, isLive]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupPlayer;
  }, []);

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
          {/* Live badge */}
          {isLive && (
            <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-300">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              Live
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
          {renderPlayer(source, containerRef, isVideoJsLoaded)}
        </div>

        {!source && (
          <p className="text-xs text-gray-400 mt-3">No livestream configured for this project yet.</p>
        )}
      </div>
    </>
  );
}

function renderPlayer(
  source?: LiveStreamSource | null,
  containerRef?: React.RefObject<HTMLDivElement | null>,
  isVideoJsLoaded?: boolean
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