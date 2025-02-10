// 'use client';
// import { useState, useEffect, useMemo } from 'react';
// import axios from 'axios';
// import { motion, AnimatePresence } from 'framer-motion';
// import { toast, Toaster } from 'react-hot-toast';
// import Layout from '@/components/shared/layout';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gateway.erebrus.io/api/v1.0';

// interface Agent {
//   id: string;
//   name: string;
//   domain: string;
//   status: 'active' | 'paused' | 'stopped';
//   clients: string[];
// }

// interface Node {
//   id: string;
//   nodename: string;
//   chainName: string;
//   region: string;
//   domain: string;
//   status: string;
// }

// // API client functions
// const agentApi = {
//   async addAgent(formData: FormData) {
//     const response = await axios.post(`${API_BASE_URL}/agents/us01.erebrus.io`, formData, {
//       headers: { 
//         'Content-Type': 'multipart/form-data',
//       },
//     });
//     return response.data;
//   },

//   async getAgents(): Promise<Agent[]> {
//     const response = await axios.get(`${API_BASE_URL}/agents/us01.erebrus.io`);
//     return response.data.agents || [];
//   },

//   async deleteAgent(id: string) {
//     const response = await axios.delete(`${API_BASE_URL}/agents/us01.erebrus.io/${id}`);
//     return response.data;
//   },

//   async manageAgent(id: string, action: 'pause' | 'resume') {
//     const response = await axios.patch(`${API_BASE_URL}/agents/us01.erebrus.io/${id}?action=${action}`);
//     return response.data;
//   },
// };

// // Modal Component
// interface AddAgentModalProps {
//   onClose: () => void;
//   onSuccess: () => void;
// }

// function AddAgentModal({ onClose, onSuccess }: AddAgentModalProps) {
//   const [file, setFile] = useState<File | null>(null);
//   const [domain, setDomain] = useState('');
//   const [selectedRegion, setSelectedRegion] = useState('');
//   const [selectedNode, setSelectedNode] = useState('');
//   const [nodes, setNodes] = useState<Node[]>([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Get unique regions from active nodes
//   const regions = useMemo(() => {
//     return ['US']; // Only show US region
//   }, []);

//   // Get nodes for selected region
//   const availableNodes = useMemo(() => {
//     return nodes
//       .filter(node => 
//         node.status === 'active' && 
//         node.region === selectedRegion && 
//         node.nodename === 'immortal_flame'
//       )
//       .sort((a, b) => a.nodename.localeCompare(b.nodename));
//   }, [nodes, selectedRegion]);

//   // Fetch nodes on component mount
//   useEffect(() => {
//     const fetchNodes = async () => {
//       try {
//         const response = await axios.get('https://gateway.erebrus.io/api/v1.0/nodes/all');
//         setNodes(response.data.payload || []);
//       } catch {
//         toast.error('Failed to fetch nodes');
//       }
//     };
//     fetchNodes();
//   }, []);

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!file || !domain || !selectedNode) return;

//     const selectedNodeData = nodes.find(node => node.id === selectedNode);
//     if (!selectedNodeData) return;
    
//     setIsSubmitting(true);
//     try {
//       const formData = new FormData();
//       formData.append('character_file', file);
//       formData.append('domain', domain.trim());
//       formData.append('server_domain', selectedNodeData.domain);

//       await agentApi.addAgent(formData);
//       toast.success('Agent added successfully');
//       onSuccess();
//     } catch {
//       toast.error('Failed to add agent');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
//       <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700/50">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-semibold text-gray-100">Add New Agent</h2>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-300"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>
        
//         <form onSubmit={handleSubmit}>
//           {/* Region Selection */}
//           <div className="mb-6">
//             <label className="block text-sm font-medium mb-1 text-gray-300">Region</label>
//             <select
//               value={selectedRegion}
//               onChange={(e) => {
//                 setSelectedRegion(e.target.value);
//                 setSelectedNode(''); // Reset node selection when region changes
//               }}
//               className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
//               required
//             >
//               <option value="">Select a region</option>
//               {regions.map(region => (
//                 <option key={region} value={region}>{region}</option>
//               ))}
//             </select>
//           </div>

//           {/* Node Selection */}
//           {selectedRegion && (
//             <div className="mb-6">
//               <label className="block text-sm font-medium mb-1 text-gray-300">Node</label>
//               <select
//                 value={selectedNode}
//                 onChange={(e) => setSelectedNode(e.target.value)}
//                 className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
//                 required
//               >
//                 <option value="">Select a node</option>
//                 {availableNodes.map(node => (
//                   <option key={node.id} value={node.id} className="py-2">
//                     {`${node.nodename} | Chain: ${node.chainName} | Region: ${node.region} | ID: ${node.id.substring(0, 8)}`}
//                   </option>
//                 ))}
//               </select>
//               {selectedNode && (
//                 <div className="mt-2 text-xs bg-gray-700/50 p-2 rounded-lg">
//                   <div className="grid grid-cols-2 gap-2">
//                     <div className="text-gray-400">Node Name:</div>
//                     <div className="text-gray-200">{nodes.find(n => n.id === selectedNode)?.nodename}</div>
                    
//                     <div className="text-gray-400">Chain:</div>
//                     <div className="text-gray-200">{nodes.find(n => n.id === selectedNode)?.chainName}</div>
                    
//                     <div className="text-gray-400">Region:</div>
//                     <div className="text-gray-200">{nodes.find(n => n.id === selectedNode)?.region}</div>
                    
//                     <div className="text-gray-400">Node ID:</div>
//                     <div className="text-gray-200">{nodes.find(n => n.id === selectedNode)?.id.substring(0, 20)}&hellip;</div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Character File Field */}
//           <div className="mb-6">
//             <div className="flex items-center justify-between mb-1">
//               <label className="text-sm font-medium text-gray-300">Character File</label>
//               <span className="text-xs text-indigo-400">Required</span>
//             </div>
//             <input
//               type="file"
//               onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                 const file = e.target.files?.[0] || null;
//                 setFile(file);
//               }}
//               className="w-full p-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
//               accept=".json"
//               required
//             />
//             <p className="mt-1 text-sm text-gray-400">Upload your character JSON file</p>
//           </div>

//           {/* Domain Field */}
//           <div className="mb-6">
//             <div className="flex items-center justify-between mb-1">
//               <label className="text-sm font-medium text-gray-300">Custom Domain</label>
//               <span className="text-xs text-indigo-400">Required</span>
//             </div>
//             <input
//               type="text"
//               value={domain}
//               onChange={(e) => setDomain(e.target.value)}
//               placeholder="e.g., example.com"
//               className="w-full p-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
//               required
//             />
//             <p className="mt-1 text-sm text-gray-400">Custom domain for your agent (required)</p>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex justify-end gap-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 text-gray-400 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isSubmitting || !file || !domain || !selectedNode}
//               className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center"
//             >
//               {isSubmitting ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Adding...
//                 </>
//               ) : (
//                 'Add Agent'
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // Main Page Component
// export default function AgentsPage() {
//   const [agents, setAgents] = useState<Agent[]>([]);
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     loadAgents();
//   }, []);

//   const loadAgents = async () => {
//     setIsLoading(true);
//     try {
//       const data = await agentApi.getAgents();
//       setAgents(data);
//     } catch {
//       toast.error('Failed to load agents');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleManageAgent = async (id: string, action: 'pause' | 'resume') => {
//     try {
//       await agentApi.manageAgent(id, action);
//       toast.success(`Agent ${action}ed successfully`);
//       await loadAgents();
//     } catch {
//       toast.error(`Failed to ${action} agent`);
//     }
//   };

//   const handleDeleteAgent = async (id: string) => {
//     try {
//       await agentApi.deleteAgent(id);
//       toast.success('Agent deleted successfully');
//       await loadAgents();
//     } catch {
//       toast.error('Failed to delete agent');
//     }
//   };

//   return (
//     <Layout>
//       <div className="min-h-screen  text-gray-100 mt-20">
//         <Toaster position="top-right" />
        
//         <div className="max-w-7xl mx-auto p-6">
//           {/* Header */}
//           <div className="mb-8 flex justify-between items-center">
//             <h1 className="text-3xl font-bold text-gray-100">Deploy And Manage AI Agents</h1>
//             <button
//               onClick={() => setIsAddModalOpen(true)}
//               className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//             >
//               Add Agent
//             </button>
//           </div>

//           {/* Loading State */}
//           {isLoading ? (
//             <div className="text-center py-10 text-gray-300">Loading agents...</div>
//           ) : agents.length === 0 ? (
//             <div className="text-center py-10 text-gray-400">
//               No agents found. Click &quot;Add Agent&quot; to create one.
//             </div>
//           ) : (
//             /* Agents Grid */
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               <AnimatePresence>
//                 {agents.map((agent) => (
//                   <motion.div
//                     key={agent.id}
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -20 }}
//                     className="bg-gray-950/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700/50"
//                   >
//                     <div className="flex justify-between items-start mb-4">
//                       <div>
//                         <h3 className="font-medium text-lg text-gray-100">{agent.name}</h3>
//                         <p className="text-sm text-gray-400">{agent.domain}</p>
//                         <div className="mt-2 flex gap-2">
//                           {agent.clients.map((client) => (
//                             <span
//                               key={client}
//                               className="px-2 py-1 text-xs bg-gray-700/50 rounded-full text-gray-300"
//                             >
//                               {client}
//                             </span>
//                           ))}
//                         </div>
//                       </div>
//                       <span className={`px-3 py-1 text-xs rounded-full ${
//                         agent.status === 'active' ? 'bg-green-500/20 text-green-400' :
//                         agent.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
//                         'bg-red-500/20 text-red-400'
//                       }`}>
//                         {agent.status}
//                       </span>
//                     </div>
                    
//                     <div className="flex gap-2 mt-4">
//                       {agent.status === 'active' ? (
//                         <button
//                           onClick={() => handleManageAgent(agent.id, 'pause')}
//                           className="flex-1 px-3 py-2 text-yellow-400 bg-yellow-500/10 rounded-lg hover:bg-yellow-500/20 transition-colors"
//                         >
//                           Pause
//                         </button>
//                       ) : (
//                         <button
//                           onClick={() => handleManageAgent(agent.id, 'resume')}
//                           className="flex-1 px-3 py-2 text-green-400 bg-green-500/10 rounded-lg hover:bg-green-500/20 transition-colors"
//                         >
//                           Resume
//                         </button>
//                       )}
//                       <button
//                         onClick={() => handleDeleteAgent(agent.id)}
//                         className="flex-1 px-3 py-2 text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </motion.div>
//                 ))}
//               </AnimatePresence>
//             </div>
//           )}

//           {/* Add Agent Modal */}
//           {isAddModalOpen && (
//             <AddAgentModal
//               onClose={() => setIsAddModalOpen(false)}
//               onSuccess={() => {
//                 setIsAddModalOpen(false);
//                 loadAgents();
//               }}
//             />
//           )}
//         </div>
//       </div>
//     </Layout>
//   );
// }

