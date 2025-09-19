import { NextRequest, NextResponse } from 'next/server';
import { monitoring, createRequestLogger } from '@/lib/monitoring';
import { SecurityAuditor, security } from '@/lib/security';

export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);
  
  try {
    const body = await request.json();
    
    // Validate the security event
    if (!body.type || !body.severity || !body.ip) {
      logger.log('warn', 'Invalid security event received', { body });
      return NextResponse.json(
        { error: 'Invalid security event data' },
        { status: 400 }
      );
    }

    // Log the security event
    SecurityAuditor.logEvent({
      type: body.type,
      severity: body.severity,
      ip: body.ip,
      userAgent: body.userAgent || '',
      url: body.url || '',
      details: body.details,
    });

    logger.log('info', 'Security event logged', {
      type: body.type,
      severity: body.severity,
      ip: body.ip,
    });

    logger.finish(200);
    return NextResponse.json({ success: true });

  } catch (error) {
    logger.log('error', 'Failed to process security event', {
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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as any;
    const ip = searchParams.get('ip');
    const count = parseInt(searchParams.get('count') || '100');

    let events;
    
    if (type) {
      events = SecurityAuditor.getEventsByType(type);
    } else if (ip) {
      events = SecurityAuditor.getEventsByIP(ip);
    } else {
      events = SecurityAuditor.getRecentEvents(count);
    }

    // Group events by type for summary
    const summary = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    logger.log('info', 'Security events requested', {
      type,
      ip,
      count: events.length,
    });
    
    logger.finish(200);
    
    return NextResponse.json({
      success: true,
      data: {
        events: events.slice(0, count),
        summary,
        total: events.length,
      },
      timestamp: Date.now(),
    });

  } catch (error) {
    logger.log('error', 'Failed to get security events', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    logger.finish(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Security dashboard endpoint
export async function PUT(request: NextRequest) {
  const logger = createRequestLogger(request);
  
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'get_dashboard') {
      // Get comprehensive security dashboard data
      const recentEvents = SecurityAuditor.getRecentEvents(50);
      const eventsByType = recentEvents.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const eventsBySeverity = recentEvents.reduce((acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get top IPs with security events
      const ipCounts = recentEvents.reduce((acc, event) => {
        acc[event.ip] = (acc[event.ip] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topIPs = Object.entries(ipCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count }));

      // Get recent critical events
      const criticalEvents = recentEvents
        .filter(event => event.severity === 'critical')
        .slice(0, 10);

      const dashboard = {
        summary: {
          totalEvents: recentEvents.length,
          criticalEvents: criticalEvents.length,
          uniqueIPs: Object.keys(ipCounts).length,
          timeRange: '1 hour',
        },
        eventsByType,
        eventsBySeverity,
        topIPs,
        criticalEvents,
        recentEvents: recentEvents.slice(0, 20),
        timestamp: Date.now(),
      };

      logger.log('info', 'Security dashboard requested');
      logger.finish(200);

      return NextResponse.json({
        success: true,
        data: dashboard,
      });
    }

    logger.log('warn', 'Unknown security dashboard action', { action });
    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );

  } catch (error) {
    logger.log('error', 'Failed to process security dashboard request', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    logger.finish(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}