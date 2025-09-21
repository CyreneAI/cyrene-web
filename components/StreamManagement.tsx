"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Plus,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { StreamingService, ProjectStream, convertRtmpToHls } from '@/services/streamingService';

interface StreamManagementProps {
  projects: Array<{
    id: string;
    name: string;
    type: 'idea' | 'token';
    symbol?: string;
  }>;
  walletAddress: string;
  className?: string;
}

interface StreamFormData {
  projectId: string;
  streamUrl: string;
  streamKey: string;
  title: string;
  description: string;
}

export default function StreamManagement({ projects, walletAddress, className = "" }: StreamManagementProps) {
  const [streams, setStreams] = useState<ProjectStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStream, setEditingStream] = useState<ProjectStream | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<StreamFormData>({
    projectId: '',
    streamUrl: 'rtmp://in01.erebrus.io/live/',
    streamKey: '',
    title: '',
    description: ''
  });

  // Load user streams
  const loadStreams = async () => {
    try {
      setLoading(true);
      const userStreams = await StreamingService.getUserStreams(walletAddress);
      setStreams(userStreams);
    } catch (error) {
      console.error('Error loading streams:', error);
      toast.error('Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      loadStreams();
    }
  }, [walletAddress]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.streamUrl || !formData.streamKey) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setActionLoading('save');
      
      const project = projects.find(p => p.id === formData.projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      await StreamingService.upsertProjectStream({
        projectId: formData.projectId,
        projectType: project.type,
        walletAddress,
        streamUrl: formData.streamUrl,
        streamKey: formData.streamKey,
        title: formData.title || project.name,
        description: formData.description
      });

      toast.success(editingStream ? 'Stream updated successfully' : 'Stream created successfully');
      
      // Reset form and reload streams
      setFormData({
        projectId: '',
        streamUrl: 'rtmp://in01.erebrus.io/live/',
        streamKey: '',
        title: '',
        description: ''
      });
      setShowAddForm(false);
      setEditingStream(null);
      
      await loadStreams();
    } catch (error) {
      console.error('Error saving stream:', error);
      toast.error('Failed to save stream');
    } finally {
      setActionLoading(null);
    }
  };

  // Start/Stop stream
  const toggleStream = async (stream: ProjectStream) => {
    try {
      setActionLoading(stream.id);
      
      if (stream.status === 'live') {
        await StreamingService.stopStream(stream.projectId, walletAddress);
        toast.success(`Stream stopped for ${stream.title}`);
      } else {
        await StreamingService.startStream(stream.projectId, walletAddress);
        toast.success(`Stream started for ${stream.title}`);
      }
      
      await loadStreams();
    } catch (error) {
      console.error('Error toggling stream:', error);
      toast.error('Failed to update stream status');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete stream
  const deleteStream = async (stream: ProjectStream) => {
    if (!confirm(`Are you sure you want to delete the stream for "${stream.title}"?`)) {
      return;
    }

    try {
      setActionLoading(stream.id);
      await StreamingService.deleteProjectStream(stream.projectId, walletAddress);
      toast.success('Stream deleted successfully');
      await loadStreams();
    } catch (error) {
      console.error('Error deleting stream:', error);
      toast.error('Failed to delete stream');
    } finally {
      setActionLoading(null);
    }
  };

  // Edit stream
  const editStream = (stream: ProjectStream) => {
    setFormData({
      projectId: stream.projectId,
      streamUrl: stream.streamUrl,
      streamKey: stream.streamKey,
      title: stream.title || '',
      description: stream.description || ''
    });
    setEditingStream(stream);
    setShowAddForm(true);
  };

  // Copy HLS URL
  const copyHlsUrl = (stream: ProjectStream) => {
    const hlsUrl = convertRtmpToHls(stream.streamUrl, stream.streamKey);
    navigator.clipboard.writeText(hlsUrl);
    toast.success('HLS URL copied to clipboard');
  };

  // Get available projects (not already having streams)
  const availableProjects = projects.filter(project => 
    !streams.some(stream => stream.projectId === project.id) || 
    (editingStream && editingStream.projectId === project.id)
  );

  if (loading) {
    return (
      <div className={`bg-[#040A25] rounded-[30px] p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#040A25] rounded-[30px] p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-semibold text-white">Stream Management</h3>
        </div>
        
        {availableProjects.length > 0 && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Stream
          </button>
        )}
      </div>

      {/* Add/Edit Stream Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-600/50"
        >
          <h4 className="text-lg font-medium text-white mb-4">
            {editingStream ? 'Edit Stream' : 'Add New Stream'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project *
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select a project</option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.symbol && `($${project.symbol})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  RTMP URL *
                </label>
                <input
                  type="url"
                  value={formData.streamUrl}
                  onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                  placeholder="rtmp://in01.erebrus.io/live/"
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stream Key *
                </label>
                <input
                  type="text"
                  value={formData.streamKey}
                  onChange={(e) => setFormData({ ...formData, streamKey: e.target.value })}
                  placeholder="your-stream-key"
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stream Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Optional stream title"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional stream description"
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Preview HLS URL */}
            {formData.streamUrl && formData.streamKey && (
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300 mb-2">HLS URL Preview:</p>
                <code className="text-xs text-blue-200 break-all">
                  {convertRtmpToHls(formData.streamUrl, formData.streamKey)}
                </code>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={actionLoading === 'save'}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {actionLoading === 'save' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {editingStream ? 'Update Stream' : 'Create Stream'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingStream(null);
                  setFormData({
                    projectId: '',
                    streamUrl: 'rtmp://in01.erebrus.io/live/',
                    streamKey: '',
                    title: '',
                    description: ''
                  });
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Streams List */}
      <div className="space-y-4">
        {streams.length === 0 ? (
          <div className="text-center py-12">
            <Radio className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400 mb-4">No streams configured yet</p>
            <p className="text-sm text-gray-500">
              Add a stream configuration to start broadcasting your projects
            </p>
          </div>
        ) : (
          streams.map((stream) => {
            const project = projects.find(p => p.id === stream.projectId);
            const isLive = stream.status === 'live';
            
            return (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-800/50 rounded-xl border border-gray-600/50 hover:border-gray-500/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isLive ? 'bg-red-500/20' : 'bg-gray-500/20'}`}>
                      {isLive ? (
                        <Radio className="w-4 h-4 text-red-400" />
                      ) : (
                        <Radio className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium">
                        {stream.title || project?.name}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {project?.type === 'token' ? 'Token' : 'Project'} • 
                        {isLive ? (
                          <span className="text-red-400 ml-1">Live</span>
                        ) : (
                          <span className="text-gray-400 ml-1">Offline</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Copy HLS URL */}
                    <button
                      onClick={() => copyHlsUrl(stream)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Copy HLS URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Toggle Stream Status */}
                    <button
                      onClick={() => toggleStream(stream)}
                      disabled={actionLoading === stream.id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isLive
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      title={isLive ? 'Stop Stream' : 'Start Stream'}
                    >
                      {actionLoading === stream.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isLive ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      <span className="text-xs">
                        {isLive ? 'Stop' : 'Start'}
                      </span>
                    </button>

                    {/* Edit Stream */}
                    <button
                      onClick={() => editStream(stream)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Edit Stream"
                    >
                      <Settings className="w-4 h-4" />
                    </button>

                    {/* Delete Stream */}
                    <button
                      onClick={() => deleteStream(stream)}
                      disabled={actionLoading === stream.id}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Stream"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {stream.description && (
                  <p className="text-sm text-gray-300 mb-3 pl-11">
                    {stream.description}
                  </p>
                )}

                <div className="pl-11 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>RTMP:</span>
                    <code className="px-2 py-1 bg-gray-700 rounded">
                      {stream.streamUrl}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Key:</span>
                    <code className="px-2 py-1 bg-gray-700 rounded">
                      {stream.streamKey}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>HLS:</span>
                    <code className="px-2 py-1 bg-gray-700 rounded text-blue-300">
                      {convertRtmpToHls(stream.streamUrl, stream.streamKey)}
                    </code>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}