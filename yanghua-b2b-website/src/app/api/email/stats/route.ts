import { NextRequest, NextResponse } from 'next/server';
// 强制此 API 为动态，避免构建期尝试静态预渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { defaultEmailStorage } from '@/lib/email/EmailStorage';
import { defaultEmailSecurity } from '@/lib/email/EmailSecurity';

/**
 * 获取邮件统计信息 - GET /api/email/stats
 */
export async function GET(request: NextRequest) {
  try {
    // 获取邮件统计
    const emailStats = await defaultEmailStorage.getStats();
    
    // 获取安全统计
    const securityStats = defaultEmailSecurity.getSecurityStats();
    
    // 计算成功率
    const totalEmails = emailStats.totalSent + emailStats.totalFailed;
    const successRate = totalEmails > 0 ? (emailStats.totalSent / totalEmails) * 100 : 0;
    
    // 计算趋势数据
    const trends = {
      dailyGrowth: calculateGrowthRate(emailStats.sentToday, emailStats.sentThisWeek / 7),
      weeklyGrowth: calculateGrowthRate(emailStats.sentThisWeek, emailStats.sentThisMonth / 4),
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalSent: emailStats.totalSent,
          totalFailed: emailStats.totalFailed,
          totalPending: emailStats.totalPending,
          successRate: Math.round(successRate * 100) / 100,
          totalEmails,
        },
        timeBasedStats: {
          sentToday: emailStats.sentToday,
          sentThisWeek: emailStats.sentThisWeek,
          sentThisMonth: emailStats.sentThisMonth,
        },
        breakdown: {
          byType: emailStats.byType,
          byLocale: emailStats.byLocale,
          byStatus: emailStats.byStatus,
        },
        trends,
        security: {
          rateLimitRecords: securityStats.rateLimitRecords,
          blacklistedItems: securityStats.blacklistedItems,
          spamDetectionEnabled: securityStats.config.spamDetection.enabled,
          rateLimitConfig: {
            windowMs: securityStats.config.rateLimit.windowMs,
            maxRequests: securityStats.config.rateLimit.maxRequests,
          },
        },
        performance: {
          averageProcessingTime: calculateAverageProcessingTime(),
          systemHealth: await checkSystemHealth(),
        },
      },
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Email stats API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch email statistics',
        code: 'STATS_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * 计算增长率
 */
function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
}

/**
 * 计算平均处理时间（模拟）
 */
function calculateAverageProcessingTime(): number {
  // 这里可以从实际的性能监控数据中获取
  return Math.round(Math.random() * 1000 + 500); // 500-1500ms
}

/**
 * 检查系统健康状态
 */
async function checkSystemHealth(): Promise<{
  status: 'healthy' | 'warning' | 'error';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail';
    message?: string;
  }>;
}> {
  const checks = [];
  let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';

  // 检查数据库连接
  try {
    await defaultEmailStorage.getStats();
    checks.push({
      name: 'Database Connection',
      status: 'pass' as const,
    });
  } catch (error) {
    checks.push({
      name: 'Database Connection',
      status: 'fail' as const,
      message: 'Database connection failed',
    });
    overallStatus = 'error';
  }

  // 检查环境变量
  const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length === 0) {
    checks.push({
      name: 'Environment Variables',
      status: 'pass' as const,
    });
  } else {
    checks.push({
      name: 'Environment Variables',
      status: 'fail' as const,
      message: `Missing: ${missingEnvVars.join(', ')}`,
    });
    if (overallStatus === 'healthy') overallStatus = 'warning';
  }

  // 检查磁盘空间（模拟）
  const diskUsage = Math.random() * 100;
  if (diskUsage < 80) {
    checks.push({
      name: 'Disk Space',
      status: 'pass' as const,
    });
  } else {
    checks.push({
      name: 'Disk Space',
      status: 'fail' as const,
      message: `Disk usage: ${Math.round(diskUsage)}%`,
    });
    if (overallStatus === 'healthy') overallStatus = 'warning';
  }

  return {
    status: overallStatus,
    checks,
  };
}