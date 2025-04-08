import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const walletAddress = url.searchParams.get('walletAddress');  // Changed from 'id' to 'walletAddress'

  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 400 });
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/agents/wallet/${walletAddress}`);
    // Ensure we return an array even if no agents are found
    return NextResponse.json(response.data.agents || [], { status: 200 });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json({ message: 'Failed to fetch agents' }, { status: 500 });
  }
}