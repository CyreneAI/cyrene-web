// api/getAgent/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL ;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ message: 'Agent ID is required' }, { status: 400 });
  }

  try {
    // First get all nodes and their agents to find which node contains our agent
    const nodesResponse = await axios.get(`${API_BASE_URL}/agents`);
    const nodes = nodesResponse.data.agents;

    // Search through all nodes to find the agent with matching ID
    let foundAgent = null;
    let nodeInfo = null;

    for (const node of nodes) {
      if (node.agents?.agents) {
        const agent = node.agents.agents.find((a: { id: string }) => a.id === id);
        if (agent) {
          foundAgent = agent;
          nodeInfo = node.node; // Save the entire node info
          break;
        }
      }
    }

    if (!foundAgent || !nodeInfo) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    // Now construct the full agent data with node information
    const fullAgentData = {
      ...foundAgent,
      node_id: nodeInfo.peerId,
      port: foundAgent.port || '', // Ensure port exists
      // Add any other fields you need from the node info
      node_host: nodeInfo.host,
      node_region: nodeInfo.region,
    };

    return NextResponse.json(fullAgentData, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch agent:', error);
    return NextResponse.json({ message: 'Failed to fetch agent' }, { status: 500 });
  }
}