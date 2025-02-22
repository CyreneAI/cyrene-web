import axios from 'axios';
import { NextResponse } from 'next/server';
import FormData from 'form-data'; 
import { Buffer } from 'buffer';

const API_BASE_URL = process.env.API_BASE_URL;
export async function POST(req: Request) {
  try {
    const rawBody = await req.text(); 

    const agentData  = JSON.parse(rawBody); 

    const modifiedAgentData = {
      ...agentData,
      settings: {
        secrets: {
          OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        },
        voice: {
          model: "en_US-male-medium",
        },
      },
      modelProvider: process.env.MODEL_PROVIDER,
    };
    const formData = new FormData();
    const characterBlob = new Blob([JSON.stringify(modifiedAgentData)], { type: "application/json" });
    const characterBuffer = await new Response(characterBlob).arrayBuffer(); 
    const buffer = Buffer.from(characterBuffer); 
    formData.append("character_file", buffer, "agent.character.json");
    formData.append("domain", "us01.erebrus.io");
    formData.append("docker_url", "ghcr.io/netsepio/cyrene");


    const response = await axios.post(`${API_BASE_URL}/agents/us01.erebrus.io/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...formData.getHeaders(), 
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", error.response?.data);
    } else {
      console.error("Error:", error);
    }
    return NextResponse.json({ message: 'Failed to create agent' }, { status: 500 });
  }
}


