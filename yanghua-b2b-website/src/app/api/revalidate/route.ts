import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // 验证授权token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token !== process.env.REVALIDATION_TOKEN) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { model, entry } = body;

    console.log('Received revalidation request:', { model, entryId: entry?.id });

    // 根据不同的内容类型进行重新验证
    switch (model) {
      case 'article':
        // 重新验证文章相关页面
        revalidateTag('articles');
        revalidatePath('/[locale]/articles');
        
        if (entry?.slug) {
          // 重新验证特定文章页面
          revalidatePath(`/en/articles/${entry.slug}`);
          revalidatePath(`/zh/articles/${entry.slug}`);
          revalidatePath(`/zh-TW/articles/${entry.slug}`);
        }
        break;
        
      default:
        // 默认重新验证所有页面
        revalidatePath('/', 'layout');
        break;
    }

    return NextResponse.json({
      message: 'Revalidation successful',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { 
        message: 'Revalidation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 支持GET请求用于健康检查
export async function GET() {
  return NextResponse.json({
    message: 'Revalidation endpoint is active',
    timestamp: new Date().toISOString()
  });
}