import { NextRequest, NextResponse } from 'next/server';
// 强制此 API 为动态，避免构建期尝试静态预渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { defaultEmailStorage } from '@/lib/email/EmailStorage';

/**
 * 获取邮件列表 - GET /api/email/list
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 解析查询参数
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // 最大100条
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'DESC').toUpperCase() as 'ASC' | 'DESC';
    
    // 解析过滤条件
    const filters: any = {};
    
    const type = searchParams.get('type');
    if (type) filters.type = type;
    
    const status = searchParams.get('status');
    if (status) filters.status = status;
    
    const locale = searchParams.get('locale');
    if (locale) filters.locale = locale;
    
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    
    const dateTo = searchParams.get('dateTo');
    if (dateTo) filters.dateTo = new Date(dateTo);

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 查询邮件列表
    const result = await defaultEmailStorage.getEmails({
      limit,
      offset,
      sortBy,
      sortOrder,
      filters,
    });

    // 计算分页信息
    const totalPages = Math.ceil(result.total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        emails: result.emails.map(email => ({
          id: email.id,
          type: email.type,
          from: email.from,
          to: email.to,
          subject: email.subject,
          status: email.status,
          locale: email.locale,
          priority: email.priority,
          messageId: email.messageId,
          errorMessage: email.errorMessage,
          retryCount: email.retryCount,
          sentAt: email.sentAt,
          createdAt: email.createdAt,
          updatedAt: email.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          type,
          status,
          locale,
          dateFrom,
          dateTo,
        },
        sorting: {
          sortBy,
          sortOrder,
        },
      },
    });

  } catch (error) {
    console.error('Email list API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch email list',
        code: 'FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}