import { NextRequest, NextResponse } from 'next/server';
import { monitoring, createRequestLogger } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);
  
  try {
    const body = await request.json();
    
    // Validate the performance metric
    if (!body.name || typeof body.value !== 'number') {
      logger.log('warn', 'Invalid performance metric received', { body });
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Record the performance metric
    monitoring.performance.recordWebVital({
      name: body.name,
      value: body.value,
      timestamp: body.timestamp || Date.now(),
      url: body.url,
      userAgent: body.userAgent,
      userId: body.userId,
    });

    logger.log('info', 'Performance metric recorded', {
      metric: body.name,
      value: body.value,
    });

    logger.finish(200);
    return NextResponse.json({ success: true });

  } catch (error) {
    logger.log('error', 'Failed to process performance metric', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    logger.finish(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  
  try {
    // Get performance summary
    const summary = monitoring.performance.getPerformanceSummary();
    
    logger.log('info', 'Performance summary requested');
    logger.finish(200);
    
    return NextResponse.json({
      success: true,
      data: summary,
      timestamp: Date.now(),
    });

  } catch (error) {
    logger.log('error', 'Failed to get performance summary', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    logger.finish(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}