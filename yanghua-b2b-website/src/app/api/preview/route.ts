// This API route has been disabled to fix build errors
// The file-watcher module is not available

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'File watcher API is currently disabled' 
  }, { status: 501 });
}

export async function GET() {
  return NextResponse.json({ 
    error: 'File watcher API is currently disabled' 
  }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ 
    error: 'File watcher API is currently disabled' 
  }, { status: 501 });
}