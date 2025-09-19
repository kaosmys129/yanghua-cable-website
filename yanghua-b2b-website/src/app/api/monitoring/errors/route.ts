import { NextRequest, NextResponse } from 'next/server';
import { monitoring, createRequestLogger } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);
  
  try {
    const body = await request.json();
    
    // Validate the error report
    if (!body.message) {
      logger.log('warn', 'Invalid error report received', { body });
      return NextResponse.json(
        { error: 'Invalid error data' },
        { status: 400 }
      );
    }

    // Report the error
    monitoring.error.reportError(body.message, body.severity || 'medium', {
      stack: body.stack,
      url: body.url,
      userAgent: body.userAgent,
      userId: body.userId,
      context: body.context,
    });

    logger.log('info', 'Error report received', {
      message: body.message,
      severity: body.severity,
      url: body.url,
    });

    logger.finish(200);
    return NextResponse.json({ success: true });

  } catch (error) {
    logger.log('error', 'Failed to process error report', {
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
    // Get error summary
    const summary = monitoring.error.getErrorSummary();
    
    logger.log('info', 'Error summary requested');
    logger.finish(200);
    
    return NextResponse.json({
      success: true,
      data: summary,
      timestamp: Date.now(),
    });

  } catch (error) {
    logger.log('error', 'Failed to get error summary', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    logger.finish(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}