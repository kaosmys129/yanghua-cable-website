import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log performance metrics (in production, you might want to send to external service)
    console.log('Performance metric received:', {
      name: body.name,
      value: body.value,
      timestamp: body.timestamp,
      url: body.url
    });
    
    // In production, you could send to services like:
    // - Google Analytics
    // - DataDog
    // - New Relic
    // - Custom analytics service
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing performance metric:', error);
    return NextResponse.json(
      { error: 'Failed to process performance metric' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Performance analytics endpoint' });
}