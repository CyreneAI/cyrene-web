"use client"

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import { Image as LucidImage, Upload, FileUp, Sparkles } from "lucide-react";
// import Image  from "next/image";
import {useRef, useState } from "react";
import axios from 'axios';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/glow-button";
import StarCanvas from "@/components/StarCanvas";


interface AgentData {
  name: string;
  clients: string[];
  oneLiner: string;
  description: string;
  bio: string[];
  lore: string[];
  knowledge: string[];
  messageExamples: { user: string; content: { text: string } }[][];
  postExamples: string[]; 
  topics: string[];
  adjectives: string[];
  plugins: string[];
  style: {
    all: string[];
    chat: string[];
    post: string[];
  };
}

interface AgentConfig {
  bio: string[];
  lore: string[];
  knowledge: string[];
}

const agentApi = {
  async createAgent(agentData: AgentData) {
    try {
      const response = await axios.post('/api/createAgent', agentData, {
        headers: {
          'Content-Type': 'application/json', // Correct header for sending FormData
        },
      });
      return response.data; // Return the response from the backend
    } catch (error) {
      console.error("API Error:", error); // Log any errors
      throw error; 
    }
  },
};



export default function Test() {

  const [preview, setPreview] = useState<string | null>(null);
  const [domain, setDomain] = useState('');
  const [name, setName] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [description, setDescription] = useState('');
  const [characterInfo, setCharacterInfo] = useState({
    bio: '',
    lore: '',
    knowledge: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [openAiKey, setOpenAiKey] = useState<string>("");
  const knowledgeInputRef = useRef<HTMLInputElement>(null);
  const loreInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json: AgentConfig = JSON.parse(e.target?.result as string);
          setCharacterInfo({
            bio: json.bio.join('\n'),
            lore: json.lore.join('\n'),
            knowledge: json.knowledge.join('\n')
          });
          toast.success("Character information loaded successfully!");
        } catch (error) {
          toast.error("Invalid JSON file format");
        }
      };
      reader.readAsText(file);
    }
  };
  

  
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!name) {
    toast.error("Agent Name is required");
    return;
  }

  if (!isValidName(name)) {
    toast.error("Invalid agent name format");
    return;
  }

  const agentData = {
    name,
    clients: [],
    oneLiner,
    description,
    bio: characterInfo.bio.split("\n"),
    lore: characterInfo.lore.split("\n"),
    knowledge: characterInfo.knowledge.split("\n"),
    messageExamples: [
      [
        {
          user: "{{user1}}",
          content: { text: "What is your role?" },
        },
        {
          user: name,
          content: { text: "I am here to help you" },
        },
      ],
    ],
    postExamples: [],
    topics: [],
    adjectives: [""],
    plugins: [],
    style: {
      all: [""],
      chat: [""],
      post: [""],
    },
  };

  setIsSubmitting(true);
  try {
    const response = await agentApi.createAgent(agentData);
    
    // Show success message with navigation link
    toast.success("Agent Created Successfully!", {
      duration: 4000,
      action: {
        label: "Chat Now",
        onClick: () => router.push(`/explore-agents/chat/${response.agent.id}`),
      },
    });

    // Automatically navigate after a short delay
    setTimeout(() => {
      router.push(`/explore-agents/chat/${response.agent.id}`);
    }, 2000);

  } catch (error) {
    toast.error("Failed to create agent");
  } finally {
    setIsSubmitting(false);
  }
};

// Update validation function to disallow capital letters and underscores
const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-z0-9][a-z0-9.-]*$/;
  return nameRegex.test(name);
};



    return (
      <div className="min-h-screen pt-32  text-white py-20">
        <StarCanvas />
        <div className="max-w-6xl mx-auto px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-16"
          >
            Launch Your Agent
          </motion.h1>

          <form onSubmit={handleSubmit} className="space-y-24">
            {/* Basic Information Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[rgba(33,37,52,0.5)] backdrop-blur-xl rounded-2xl p-10 border border-blue-500/20"
            >
              <h2 className="text-3xl font-semibold mb-10 relative">
                Basic Information
                <span className="absolute bottom-0 left-0 w-64 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></span>
              </h2>

              <div className="space-y-8">
                <div>
                  <Label className="text-lg mb-2 text-blue-300">Name</Label>
                  <Input 
                    placeholder="Agent Name" 
                    className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all" 
                    value={name} 
                    onChange={(e) => {
                      const newValue = e.target.value.toLowerCase(); // Force lowercase
                      if (newValue === '' || isValidName(newValue)) {
                        setName(newValue);
                      }
                    }}
                    onBlur={() => {
                      if (name && !isValidName(name)) {
                        toast.error("Name must start with a lowercase letter or number and can only contain lowercase letters, numbers, dots, and hyphens");
                      }
                    }}
                  />
                  <p className="text-sm text-blue-300/70 mt-2">
                    Must start with a lowercase letter or number. Can contain lowercase letters, numbers, dots, and hyphens.
                  </p>
                </div>
{/* 
                <div>
                  <Label className="text-lg mb-2 text-blue-300">Upload Image</Label>
                  <div className="grid grid-cols-3 gap-6">
                    <label className="col-span-2 border-2 border-dashed p-8 flex flex-col items-center justify-center cursor-pointer bg-[rgba(33,37,52,0.7)] border-blue-500/30 rounded-xl hover:border-blue-500 transition-all group">
                      <Upload size={32} className="text-blue-400 group-hover:scale-110 transition-transform" />
                      <p className="mt-4 text-center">Drag file here to upload or Choose File</p>
                      <p className="text-sm text-blue-300/70">Recommended size 1024 x 1024 px</p>
                      <input type="file" accept="image/*, .ico" className="hidden" onChange={handleFileChange} />
                    </label>

                    <div className="border p-8 flex flex-col items-center justify-center bg-[rgba(33,37,52,0.7)] border-blue-500/30 rounded-xl">
                      {preview ? (
                        <Image src={preview} alt="Preview" width={100} height={100} className="rounded-lg shadow-lg" />
                      ) : (
                        <>
                          <LucidImage size={32} className="text-blue-400" />
                          <p className="mt-4 text-center text-blue-300/70">Preview</p>
                        </>
                      )}
                    </div>
                  </div>
                </div> */}

                <div>
                  <Label className="text-lg mb-2 text-blue-300">One Liner</Label>
                  <Input 
                    placeholder="Write agent one liner" 
                    className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all" 
                    value={oneLiner} 
                    onChange={(e) => setOneLiner(e.target.value)}
                  />
                  <p className="text-sm text-blue-300/70 mt-2">Max 90 characters with spaces</p>
                </div>

                <div>
                  <Label className="text-lg mb-2 text-blue-300">Description</Label>
                  <Textarea 
                    placeholder="Write agent description" 
                    className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all min-h-32" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-sm text-blue-300/70 mt-2">Max 300 characters with spaces</p>
                </div>
              </div>
            </motion.div>

            {/* Character Information Section */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[rgba(33,37,52,0.5)] backdrop-blur-xl rounded-2xl p-10 border border-purple-500/20"
            >
              <h2 className="text-3xl font-semibold mb-10 relative">
                Character Information
                <span className="absolute bottom-0 left-0 w-80 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></span>
              </h2>

              <div className="flex gap-4 mb-8">
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="character-file"
                  />
                  <GlowButton
                    type="button"
                    onClick={() => document.getElementById('character-file')?.click()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2 whitespace-nowrap"
                  >
                    Upload Character File
                  </GlowButton>
                </div>
                <GlowButton 
                  type="button"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2 whitespace-nowrap"
                  onClick={() => {
                    toast.info("AI generation coming soon!");
                  }}
                >
                  <span>Generate with AI</span>
                </GlowButton>
              </div>

              {['bio', 'lore', 'knowledge'].map((field) => (
                <div key={field} className="mb-10">
                  <Label className="text-lg mb-2 text-purple-300 capitalize">{field}</Label>
                  <Textarea 
                    placeholder={`Add agent ${field}`}
                    value={characterInfo[field as keyof typeof characterInfo]}
                    onChange={(e) => setCharacterInfo(prev => ({
                      ...prev,
                      [field]: e.target.value
                    }))}
                    className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500 transition-all min-h-32"
                  />
                </div>
              ))}
            </motion.div>

            <div className="flex justify-center">
              <GlowButton 
                type="submit" 
                disabled={isSubmitting}
                className="px-12 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Creating Agent...</span>
                  </div>
                ) : 'Launch Agent'}
              </GlowButton>
            </div>
          </form>
        </div>
      </div>
    );
}






