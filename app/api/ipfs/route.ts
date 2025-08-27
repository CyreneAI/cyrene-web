// app/api/ipfs/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const ipfsFormData = new FormData();

    // Handle JSON uploads
    if (contentType.includes('application/json')) {
      const jsonData = await request.json();
      const blob = new Blob([JSON.stringify(jsonData.json)], { type: 'application/json' });
      ipfsFormData.append('file', blob, 'metadata.json');
    } 
    // Handle file uploads (multipart/form-data)
    else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new Error('No file provided in form data');
      }
      ipfsFormData.append('file', file);
    } else {
      throw new Error('Unsupported content type');
    }

    // Upload to IPFS
    const ipfsResponse = await fetch('https://ipfs.erebrus.io/api/v0/add?cid-version=1', {
      method: 'POST',
      body: ipfsFormData
    });

    if (!ipfsResponse.ok) {
      const errorText = await ipfsResponse.text();
      throw new Error(`IPFS upload failed: ${errorText}`);
    }

    const result = await ipfsResponse.json();
    return NextResponse.json({
      success: 1,
      file: {
        url: `https://ipfs.erebrus.io/ipfs/${result.Hash}`,
        cid: result.Hash
      }
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json(
      { 
        success: 0,
        error: error instanceof Error ? error.message : 'IPFS upload failed'
      },
      { status: 500 }
    );
  }
}