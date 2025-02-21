"use client"

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image as LucidImage, Upload } from "lucide-react";
import Image  from "next/image";
import {useRef, useState } from "react";
import axios from 'axios';
import { toast } from "sonner";
import { useRouter } from "next/navigation";


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
  const [bio, setBio] = useState('');
  const [lore, setLore] = useState('');
  const [knowledge, setKnowledge] = useState('');
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
    toast.error("Agent Name is required");
    return;
  }

  const agentData = {
    name,
    clients: [],
    oneLiner,
    description,
    bio: bio.split("\n"),
    lore: lore.split("\n"),
    knowledge: knowledge.split("\n"),
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
      toast.promise(agentApi.createAgent(agentData), {
      loading: "Launching Agent...",
      success: () => {
        toast.success("Agent Launched! Click here to explore.", {
          duration: 4000,
          action: {
            label: "Go Now",
            onClick: () => router.push("/explore-agents"),
          },
        });
        return "Agent Launched successfully!";
      },
      error: "Failed to create agent",
    });
  } catch (error) {
    toast.error("Failed to create agent");
  } finally {
    setIsSubmitting(false);
   
  }
};



    return (
      <div className="text-white flex flex-col items-center justify-center py-40 mx-52">
        <div className="flex flex-col gap-14 w-full px-10">
            {/* Title */}
            <h1 className="text-3xl font-bold flex justify-center items-center">
                Launch Agent
            </h1>
            <form onSubmit={handleSubmit} className="flex flex-col  gap-36">
            <div className="flex flex-col gap-10 mx-32">
              <h1 className="text-2xl font-semibold relative after:content-[''] after:block after:w-52 after:h-[2px] after:bg-blue-500 after:mt-1">
                Basic Information
              </h1>

                <div className="flex flex-col gap-6 w-full max-w-2xl space-y-6">
                  <div className="flex flex-col gap-2">
                    <Label>Name:</Label>
                    <Input placeholder="Agent Name" className="bg-[rgb(33,37,52)] border-none ring-1 ring-blue-500 focus-visible:ring-1 focus-visible:ring-blue-700" 
                     value={name} onChange={(e) => setName(e.target.value)}
                    />

                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Upload Image:</Label>
                      <div className="flex space-x-4 ">
                        {/* Upload Area */}
                        <label className="border-2 border-dashed p-6 w-full flex flex-col items-center justify-center cursor-pointer bg-[rgb(33,37,52)] border-blue-500 rounded-sm">
                          <Upload size={24} className="text-blue-500" />
                          <p>Drag file here to upload or Choose File</p>
                          <p className="text-sm text-gray-400">Recommended size 1024 x 1024 px</p>
                          <input 
                            type="file" 
                            accept="image/*, .ico" 
                            className="hidden" 
                            onChange={handleFileChange}
                          />
                        </label>

                        {/* Preview Area */}
                        <div className="border p-6 w-1/3 flex flex-col items-center justify-center bg-[rgb(33,37,52)]  border-blue-500 rounded-sm">
                          {preview ? (
                            <Image src={preview} alt="Preview" width={40} height={40} className="w-full h-full object-cover rounded-md" />
                          ) : (
                            <>
                              <LucidImage size={24} className="text-blue-500" />
                              <p>Preview after upload</p>
                            </>
                          )}
                        </div>
                      </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>One Liner:</Label>
                    <Input placeholder="Write agent one liner" className="bg-[rgb(33,37,52)] border-none ring-1 ring-blue-500 focus-visible:ring-1 focus-visible:ring-blue-700" 
                    value={oneLiner} onChange={(e) => setOneLiner(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">Max 90 characters with spaces</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Description:</Label>
                    <Textarea 
                      placeholder="Write agent description" 
                      className="bg-[rgb(33,37,52)] border-none ring-1 ring-blue-500 focus-visible:ring-1 focus-visible:ring-blue-700 min-h-32 resize-none"
                      value={description} onChange={(e) => setDescription(e.target.value)}
                      
                    />
                    <p className="text-sm text-muted-foreground">Max 300 characters with spaces</p>
                  </div>
                </div>
            </div>

            <div className="flex flex-col gap-10 mx-32">
              <h1 className="text-2xl font-semibold relative after:content-[''] after:block after:w-64 after:h-[2px] after:bg-blue-500 after:mt-1">
                Character Information
              </h1>
                <div className="flex flex-col gap-6 w-full max-w-2xl space-y-6">
                  <div className="flex flex-col gap-2">
                    <Label>Bio:</Label>
                    <Textarea 
                      placeholder="Add agent Bio" 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="bg-[rgb(33,37,52)] border-none ring-1 ring-blue-500 focus-visible:ring-1 focus-visible:ring-blue-700 min-h-32 resize-none"
                    />
                    <div className="flex space-x-2">
                        <button
                        type="button"
                          className="bg-blue-600 px-4 py-2 rounded-lg"
                          onClick={() => triggerFileInput(bioInputRef)}
                        >
                          Add
                        </button>
                        <input
                          type="file"
                          accept=".txt"
                          ref={bioInputRef}
                          onChange={(e) => handleFileUpload(e, setBio)}
                          className="hidden"
                        />
                        <button type="button" className="bg-blue-600 px-4 py-2 rounded-lg">Generate from AI</button>
                      </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Lore:</Label>
                    <Textarea 
                      value={lore}
                      placeholder="Add your own lore"
                      onChange={(e) => setLore(e.target.value)}
                      className="bg-[rgb(33,37,52)] border-none ring-1 ring-blue-500 focus-visible:ring-1 focus-visible:ring-blue-700 min-h-32 resize-none"
                    />
                     <div className="flex space-x-2 mt-4">
                        <button
                          className="bg-blue-600 px-4 py-2 rounded-lg"
                          onClick={() => triggerFileInput(loreInputRef)}
                          type="button"
                        >
                          Add
                        </button>
                        <input
                          type="file"
                          accept=".txt"
                          ref={loreInputRef}
                          onChange={(e) => handleFileUpload(e, setLore)}
                          className="hidden"
                        />
                        <button type="button" className="bg-blue-600 px-4 py-2 rounded-lg">Generate from AI</button>
                      </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Knowledge:</Label>
                    <Textarea 
                      value={knowledge}
                      placeholder="Add your own knowledge"
                      onChange={(e) => setKnowledge(e.target.value)}
                      className="bg-[rgb(33,37,52)] border-none ring-1 ring-blue-500 focus-visible:ring-1 focus-visible:ring-blue-700 min-h-32 resize-none"
                    />
                    <div className="flex space-x-2 mt-4">
                      <button
                        className="bg-blue-600 px-4 py-2 rounded-lg"
                        onClick={() => triggerFileInput(knowledgeInputRef)}
                        type="button"
                      >
                        Add
                      </button>
                      <input
                        type="file"
                        accept=".txt"
                        ref={knowledgeInputRef}
                        onChange={(e) => handleFileUpload(e, setKnowledge)}
                        className="hidden"
                      />
                      <button type="button" className="bg-blue-600 px-4 py-2 rounded-lg">Generate from AI</button>
                    </div>
                  </div>
                </div>
            </div>
              <div className="mx-32">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className=" px-4 py-2 bg-green-500 text-white rounded-lg"
                >
                 {isSubmitting ? 'Launching...' : 'Launch Agent'}
                </button>
              </div>
            </form>
        </div>
      </div>
    );
}






