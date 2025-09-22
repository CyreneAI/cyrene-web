"use client";

import React, { useState, useEffect } from 'react';
import { 
  Radio, Settings, Eye, EyeOff, ExternalLink, 
  Copy, Monitor, Smartphone, AlertCircle, 
  CheckCircle, Loader2, Play, Square, 
  Info, Camera 
} from 'lucide-react';
import { toast } from 'sonner';
import { StreamingService, ProjectStream } from '@/services/streamingService';
import WebRTCStreamer from './WebRTCStreamer';

interface Project {
  id: string;
  name: string;
  type: 'idea' | 'token';
  symbol?: string;
}

interface StreamManagementProps {
  projects: Project[];
  walletAddress: string;
}

type StreamingType = 'third-party' | 'onsite';

interface StreamConfig {
  projectId: string;
  streamingType: StreamingType;
  title?: string;
  description?: string;
}

// Generate stream key from project name
const generateStreamKey = (projectName: string): string => {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim();
};

export default function StreamManagement({ projects, walletAddress }: StreamManagementProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [streams, setStreams] = useState<Map<string, ProjectStream>>(new Map());
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  
  // FIXED: Use single streamConfig state instead of separate streamingType
  const [streamConfig, setStreamConfig] = useState<StreamConfig>({
    projectId: '',
    streamingType: 'third-party',
    title: '',
    description: ''
  });

  // Load existing streams
  useEffect(() => {
    const loadStreams = async () => {
      setInitialLoading(true);
      try {
        const userStreams = await StreamingService.getUserStreams(walletAddress);
        const streamMap = new Map<string, ProjectStream>();
        userStreams.forEach(stream => {
          streamMap.set(stream.projectId, stream);
        });
        setStreams(streamMap);
      } catch (error) {
        console.error('Error loading streams:', error);
        toast.error('Failed to load streams');
      } finally {
        setInitialLoading(false);
      }
    };

    if (walletAddress) {
      loadStreams();
    }
  }, [walletAddress]);

  // Handle project selection
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    const existingStream = streams.get(project.id);
    
    // Load existing streaming type or default to third-party
    const existingStreamingType = existingStream?.streamingType || 'third-party';
    
    console.log('🎯 Project selected:', {
      projectId: project.id,
      projectName: project.name,
      existingStream: existingStream ? {
        id: existingStream.id,
        streamingType: existingStream.streamingType,
        status: existingStream.status
      } : null,
      loadedStreamingType: existingStreamingType
    });
    
    setStreamConfig({
      projectId: project.id,
      streamingType: existingStreamingType,
      title: existingStream?.title || `${project.name} Live Stream`,
      description: existingStream?.description || `Live streaming for ${project.name}`
    });
    setShowConfig(true);
  };

  // FIXED: Update streamConfig.streamingType when user changes selection
  const handleStreamingTypeChange = (newType: StreamingType) => {
    console.log('🎯 Streaming type changed to:', newType);
    setStreamConfig(prev => ({
      ...prev,
      streamingType: newType
    }));
  };

  // Create or update stream configuration - FIXED
  const handleSaveConfig = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const streamKey = generateStreamKey(selectedProject.name);
      
      // FIXED: Use correct URLs and keep streamKey separate
      let streamUrl = '';
      if (streamConfig.streamingType === 'onsite') {
        streamUrl = 'https://webrtc.in01.erebrus.io'; // Base WebRTC URL without streamKey
      } else {
        streamUrl = 'rtmp://in01.erebrus.io/live/'; // Correct RTMP URL
      }

      console.log('💾 Saving stream config:', {
        projectId: selectedProject.id,
        streamingType: streamConfig.streamingType,
        streamUrl,
        streamKey,
        title: streamConfig.title
      });

      const streamData = {
        projectId: selectedProject.id,
        projectType: selectedProject.type,
        walletAddress,
        streamUrl, // Base URL only
        streamKey, // Separate stream key
        streamingType: streamConfig.streamingType, // FIXED: Use from streamConfig
        title: streamConfig.title,
        description: streamConfig.description
      };

      const savedStream = await StreamingService.upsertProjectStream(streamData);
      
      console.log('💾 Stream saved successfully:', {
        savedStreamingType: savedStream.streamingType,
        savedStreamKey: savedStream.streamKey,
        savedStatus: savedStream.status
      });
      
      // Update local state
      setStreams(prev => new Map(prev).set(selectedProject.id, savedStream));
      
      toast.success('Stream configuration saved successfully!');
      setShowConfig(false);
    } catch (error) {
      console.error('Error saving stream config:', error);
      toast.error('Failed to save stream configuration');
    } finally {
      setLoading(false);
    }
  };

  // Start streaming
  const handleStartStream = async (projectId: string) => {
    setLoading(true);
    try {
      const updatedStream = await StreamingService.startStream(projectId, walletAddress);
      if (updatedStream) {
        console.log('▶️ Stream started with type:', updatedStream.streamingType);
        setStreams(prev => new Map(prev).set(projectId, updatedStream));
        toast.success('Stream started successfully!');
      }
    } catch (error) {
      console.error('Error starting stream:', error);
      toast.error('Failed to start stream');
    } finally {
      setLoading(false);
    }
  };

  // Stop streaming
  const handleStopStream = async (projectId: string) => {
    setLoading(true);
    try {
      const updatedStream = await StreamingService.stopStream(projectId, walletAddress);
      if (updatedStream) {
        setStreams(prev => new Map(prev).set(projectId, updatedStream));
        toast.success('Stream stopped successfully!');
      }
    } catch (error) {
      console.error('Error stopping stream:', error);
      toast.error('Failed to stop stream');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (initialLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-400" />
        <p className="text-gray-400">Loading streaming configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Live Streaming</h2>
        <p className="text-gray-400">
          Stream your projects live to engage with your community
        </p>
      </div>

      {/* Projects Grid */}
      {!showConfig && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const stream = streams.get(project.id);
            const isLive = stream?.status === 'live';

            return (
              <div
                key={project.id}
                className="relative bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer group"
                onClick={() => handleProjectSelect(project)}
              >
                {/* Live indicator */}
                {isLive && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 px-2 py-1 bg-red-600/90 rounded-full text-white text-xs font-medium">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {project.type === 'token' ? project.symbol?.[0] || 'T' : 'I'}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{project.name}</h3>
                    <p className="text-gray-400 text-sm capitalize mb-2">{project.type}</p>
                    
                    {stream ? (
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Configured ({stream.streamingType})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs">
                        <Settings className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-400">Not configured</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stream Configuration */}
      {showConfig && selectedProject && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Configure Stream: {selectedProject.name}
                </h3>
                <p className="text-gray-400">Set up live streaming for your project</p>
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Current type: {streamConfig.streamingType}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Streaming Type Selection */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">Streaming Method</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    streamConfig.streamingType === 'third-party'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                  }`}
                  onClick={() => handleStreamingTypeChange('third-party')}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Monitor className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-white">Third-Party Streaming</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Use OBS, Streamlabs, or other streaming software
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    streamConfig.streamingType === 'onsite'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                  }`}
                  onClick={() => handleStreamingTypeChange('onsite')}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Camera className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-white">Browser Streaming</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Stream directly from your browser using webcam
                  </p>
                </div>
              </div>
            </div>

            {/* Stream Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-white font-medium mb-2">Stream Title</label>
                <input
                  type="text"
                  value={streamConfig.title}
                  onChange={(e) => setStreamConfig(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Enter stream title"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Stream Key</label>
                <div className="relative">
                  <input
                    type="text"
                    value={generateStreamKey(selectedProject.name)}
                    readOnly
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-gray-300 cursor-not-allowed"
                  />
                  <button
                    onClick={() => copyToClipboard(generateStreamKey(selectedProject.name))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
                    title="Copy stream key"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Auto-generated from project name (readonly)
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-white font-medium mb-2">Description</label>
              <textarea
                value={streamConfig.description}
                onChange={(e) => setStreamConfig(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Describe what you'll be streaming about"
              />
            </div>

            {/* Third-Party Streaming Instructions */}
            {streamConfig.streamingType === 'third-party' && (
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-blue-300 font-medium mb-2">OBS/Streaming Software Setup</h4>
                    <div className="space-y-2 text-sm text-blue-200">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Server URL:</span>
                        <code className="bg-black/30 px-2 py-1 rounded text-xs">
                          rtmp://in01.erebrus.io/live/
                        </code>
                        <button
                          onClick={() => copyToClipboard('rtmp://in01.erebrus.io/live/')}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Stream Key:</span>
                        <code className="bg-black/30 px-2 py-1 rounded text-xs">
                          {generateStreamKey(selectedProject.name)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(generateStreamKey(selectedProject.name))}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveConfig}
                disabled={loading || !streamConfig.title?.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                Save Configuration
              </button>

              <button
                onClick={() => setShowConfig(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Stream Interface */}
          {streams.has(selectedProject.id) && (
            <div className="mt-6 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h4 className="text-lg font-bold text-white mb-4">Stream Control</h4>
              
              {/* FIXED: Check the actual saved stream's streamingType, not the config */}
              {streams.get(selectedProject.id)?.streamingType === 'onsite' ? (
                <WebRTCStreamer
                  streamKey={generateStreamKey(selectedProject.name)}
                  onStreamStart={() => handleStartStream(selectedProject.id)}
                  onStreamStop={() => handleStopStream(selectedProject.id)}
                  onError={(error) => toast.error(error)}
                />
              ) : (
                <div className="space-y-4">
                  {/* Third-party streaming controls */}
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Stream Status</p>
                      <p className="text-gray-400 text-sm">
                        {streams.get(selectedProject.id)?.status === 'live' ? 'Currently live' : 'Offline'}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {streams.get(selectedProject.id)?.status === 'live' ? (
                        <button
                          onClick={() => handleStopStream(selectedProject.id)}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                          Stop Stream
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartStream(selectedProject.id)}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          Start Stream
                        </button>
                      )}
                    </div>
                  </div>

                  {/* FIXED: Stream URL display with correct logic */}
                  {streams.get(selectedProject.id)?.status === 'live' && (
                    <div className="p-4 bg-green-600/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-green-300 font-medium">Stream is live!</p>
                          <p className="text-green-200 text-sm">
                            Viewers can watch at: 
                            <code className="ml-2 bg-black/30 px-2 py-1 rounded text-xs">
                              {/* FIXED: Use the correct logic based on saved stream type */}
                              {streams.get(selectedProject.id)?.streamingType === 'onsite' 
                                ? `https://stream.in01.erebrus.io/${generateStreamKey(selectedProject.name)}/index.m3u8`
                                : `https://stream.in01.erebrus.io/live/${generateStreamKey(selectedProject.name)}/index.m3u8`
                              }
                            </code>
                          </p>
                          {/* Debug info */}
                          {process.env.NODE_ENV === 'development' && (
                            <p className="text-green-100/70 text-xs mt-1">
                              Saved stream type: {streams.get(selectedProject.id)?.streamingType}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && !showConfig && (
        <div className="text-center py-20">
          <Radio className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400 mb-4">No projects available for streaming</p>
          <p className="text-gray-500 text-sm">
            Create a project idea or launch a token to start streaming
          </p>
        </div>
      )}
    </div>
  );
}