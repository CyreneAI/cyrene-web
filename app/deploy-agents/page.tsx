'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import Layout from '@/components/shared/layout';
import { useRouter } from 'next/navigation';


const API_BASE_URL ='https://gateway.erebrus.io/api/v1.0';

interface Agent {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'paused' | 'stopped';
  clients: string[];
  port:string;
}

const agentApi = {
  async createAgent(agentData: Record<string, any>) {
    try {
      const formData = new FormData();
      const characterBlob = new Blob([JSON.stringify(agentData)], { type: "application/json" });

      formData.append("character_file", characterBlob, "agent.character.json");
      formData.append("domain", "us01.erebrus.io");
      formData.append("docker_url", "ghcr.io/netsepio/cyrene");

      console.log("Sending FormData:", [...formData.entries()]);

      const response = await axios.post(`${API_BASE_URL}/agents/us01.erebrus.io`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:");
      throw error;
    }
  },

  async getAgents(): Promise<Agent[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/agents/us01.erebrus.io`);
      return response.data.agents || [];
    } catch (error) {
      console.error("Failed to fetch agents:", error);
      return [];
    }
  },
};

export default function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showNewAgentUI, setShowNewAgentUI] = useState(false);
  const [domain, setDomain] = useState('');
  const [name, setName] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [description, setDescription] = useState('');
  const [bio, setBio] = useState('');
  const [lore, setLore] = useState('');
  const [knowledge, setKnowledge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchAgents = async () => {
      const agents = await agentApi.getAgents();
      console.log(agents)
      setAgents(agents);
    };
    fetchAgents();
  }, []);


  const setChatAgent = (id:string,name:string)=>{
    localStorage.setItem('currentAgentId', id);
    localStorage.setItem('currentAgentName',name );
    router.push('/'); 
  }
  

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setter(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name) {
      toast.error("Domain and Name are required.");
      return;
    }

    const agentData = {
      name,
      clients: [],
      oneLiner,
      description,
      bio: bio.split('\n'),
      lore: lore.split('\n'),
      knowledge: knowledge.split('\n'),
      modelProvider: "openai",  
      messageExamples: [
        [
          {
              "user": "{{user1}}",
              "content": {
                  "text": "What is your role?"
              }
          },
          {
              "user": name,
              "content": {
                  "text": "I am here to help you"
              }
          }
      ],
      ],            
      postExamples: [],               
      topics: [],                      
      adjectives: [""],                  
      plugins: [],                     
      style: {
          "all": [""],
          "chat": [""],
          "post": [""]
      },
      settings: {
        "secrets": {
            "OPENAI_API_KEY": process.env.NEXT_PUBLIC_OPENAI_API_KEY
        },
        "voice": {
            "model": "en_US-male-medium"
        }
    },                
    };
    console.log("Submitting agentData:", agentData);

    console.log(agentData)

    setIsSubmitting(true);
    try {
      await agentApi.createAgent(agentData);
      toast.success('Agent created successfully');
      setShowNewAgentUI(false);
    } catch {
      toast.error('Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Toaster />
      <div className="container mx-auto p-4">
        <div className="flex">
          <button onClick={() => setShowNewAgentUI(true)} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg ml-auto">
            New Agent
          </button>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Active Agents</h2>
        {agents.length === 0 ? (
          <p className="text-gray-400">No agents available.</p>
        ) : (
          <table className="w-full text-gray-300 border border-gray-600">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-2 border border-gray-600">ID</th>
                <th className="p-2 border border-gray-600">Name</th>
                <th className="p-2 border border-gray-600">Domain</th>
                <th className="p-2 border border-gray-600">Status</th>
                <th className="p-2 border border-gray-600">Clients</th>
                <th className="p-2 border border-gray-600">Port</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} className="border border-gray-600">
                  <td className="p-2 border border-gray-600">{agent.id}</td>
                  <td className="p-2 border border-gray-600">{agent.name}</td>
                  <td className="p-2 border border-gray-600">{agent.domain}</td>
                  <td className="p-2 border border-gray-600">
                    <span className={`px-2 py-1 rounded-lg text-white 
                      ${agent.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="p-2 border border-gray-600">{agent.clients.join(', ')}</td>
                  <td className="p-2 border border-gray-600">{agent.port}</td>
                  <td className="p-2 border border-gray-600">
                    <button
                      onClick={() => setChatAgent(agent.id,agent.name)}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg"
                    >
                      Chat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
        {showNewAgentUI && (
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Basic Information</h2>
            <form onSubmit={handleSubmit}>
              <label className="block text-gray-300 mb-2">Agent Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 mb-4" required />

              <label className="block text-gray-300 mb-2">One Liner</label>
              <input type="text" value={oneLiner} onChange={(e) => setOneLiner(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 mb-4" />

              <label className="block text-gray-300 mb-2">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 mb-4" />

              <h2 className="text-xl font-semibold text-gray-100 mb-4 pt-6">Character Information</h2>
              <label className="block text-gray-300 mb-2">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 mb-4" />
              <input type="file" accept=".txt" onChange={(e) => handleFileUpload(e, setBio)} className="mb-4" />

              <label className="block text-gray-300 mb-2">Lore</label>
              <textarea value={lore} onChange={(e) => setLore(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 mb-4" />
              <input type="file" accept=".txt" onChange={(e) => handleFileUpload(e, setLore)} className="mb-4" />

              <label className="block text-gray-300 mb-2">Knowledge</label>
              <textarea value={knowledge} onChange={(e) => setKnowledge(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 mb-4" />
              <input type="file" accept=".txt" onChange={(e) => handleFileUpload(e, setKnowledge)} className="mb-4" />

              <div className="flex">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  {isSubmitting ? 'Launching...' : 'Launch Agent'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}

