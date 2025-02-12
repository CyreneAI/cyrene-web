"use client"


import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

const API_BASE_URL ='https://gateway.erebrus.io/api/v1.0';

interface Agent {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'paused' | 'stopped';
  clients: string[];
  port: string;
  image?: string; // Optional
  description?: string; // Optional
}


const agentApi = {
  async createAgent(agentData: Record<string, any>) {
    try {
      const formData = new FormData();
      const characterBlob = new Blob([JSON.stringify(agentData)], { type: "application/json" });

      formData.append("character_file", characterBlob, "agent.character.json");
      formData.append("domain", "us01.erebrus.io");
      formData.append("docker_url", "ghcr.io/netsepio/cyrene");


      // console.log("Sending FormData:", [...formData.entries()]);

      const response = await axios.post(`${API_BASE_URL}/agents/us01.erebrus.io`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // console.log("API Response:", response.data);
      return response.data;
    } catch (error) {
      // console.error("API Error:");
      throw error;
    }
  },

  async getAgents(): Promise<Agent[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/agents/us01.erebrus.io`);
      return response.data.agents || [];
    } catch (error) {
      // console.error("Failed to fetch agents:", error);
      return [];
    }
  },
};

export default function ExploreAgents() {


  const [agents, setAgents] = useState<Agent[]>([]);
  const router = useRouter();

    const mockAgents= [
        {
          name: "Orion",
          image: "orion.png",
          description:
            "Orion gathers and delivers essential news, keeping businesses ahead of the curve.",
        },
        {
          name: "Elixia",
          image: "elixia.png",
          description:
            "Elixia posts creative content to drive engagement and build community.",
        },
        {
          name: "Solis",
          image: "solis.png",
          description:
            " Solis illuminates the path to success with data-driven clarity and strategic insight.",
        },
        {
          name: "Auren",
          image: "auren.png",
          description:
            " Auren is here to guide you, bringing warmth and clarity to every customer interaction.",
        },
      ];

      const setChatAgent = (id:string,name:string)=>{
        localStorage.setItem('currentAgentId', id);
        localStorage.setItem('currentAgentName',name );
        router.push('/'); 
      }

      useEffect(() => {
        const fetchAgents = async () => {
          const fetchedAgents = await agentApi.getAgents();
      
          // Assign random image and description to each agent
          const enrichedAgents = fetchedAgents.map((agent) => {
            const randomMockAgent = mockAgents[Math.floor(Math.random() * mockAgents.length)];
            return {
              ...agent,
              image: randomMockAgent.image,
              description: randomMockAgent.description,
            };
          });
      
          setAgents(enrichedAgents);
        };
      
        fetchAgents();
      }, []);

    return (
      <div className="text-white flex flex-col items-center justify-center min-h-screen py-4 mx-2">
        <div className="flex flex-col gap-6 w-full px-10">
            {/* Title */}
            <h1 className="text-3xl font-bold flex justify-center items-center">
                Explore Agents
            </h1>

            {/* Button */}
            <div className="flex ml-auto">
                <Link href={'launch-agent'}>
                    <Button 
                        variant={"default"}
                        className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 hover:scale-105"
                    >
                        Launch Agent
                    </Button>
                </Link>
            </div>
            <div className="grid grid-cols-3 justify-center gap-6 font-poppins">
                {agents.map((agent, index) => (
                    <div key={index} className="flex justify-center items-center">
                    <Card className="bg-[#232C3C] text-white border border-white rounded-2xl group hover:scale-105 hover:shadow-blue-400 flex items-center gap-4 w-[400px] cursor-pointer">
                        {/* Image */}
                        <div className="w-64 h-40">
                        <img src={agent.image} alt={agent.name} className="w-full h-full object-cover rounded-xl" />
                        </div>

                        {/* Text Section */}
                        <div className="flex flex-col justify-center">
                        <h1 className="text-lg font-bold">{agent.name}</h1>
                        <p className="text-sm text-gray-300">{agent.description}</p>
                        <button 
                           onClick={() => setChatAgent(agent.id,agent.name)}
                          className="bg-green-500 rounded-md mx-4 my-2 p-2 group-hover:scale-110">Chat</button>
                        </div>
                    </Card>
                </div>
                ))}
            </div>
        </div>
      </div>
    );
}






  