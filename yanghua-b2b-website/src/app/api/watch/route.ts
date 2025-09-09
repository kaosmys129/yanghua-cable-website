import { NextRequest, NextResponse } from 'next/server';
import { fileWatcher } from '@/lib/file-watcher';

// 启动文件监听
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enable = true, options = {} } = body;

    if (enable) {
      if (fileWatcher.isWatching()) {
        return NextResponse.json({
          success: false,
          message: 'File watcher is already running'
        }, { status: 400 });
      }

      fileWatcher.start();
      
      return NextResponse.json({
        success: true,
        message: 'File watcher started successfully',
        data: {
          isWatching: fileWatcher.isWatching(),
          watchedPaths: fileWatcher.getWatchedPaths()
        }
      });
    } else {
      if (!fileWatcher.isWatching()) {
        return NextResponse.json({
          success: false,
          message: 'File watcher is not running'
        }, { status: 400 });
      }

      await fileWatcher.stop();
      
      return NextResponse.json({
        success: true,
        message: 'File watcher stopped successfully',
        data: {
          isWatching: fileWatcher.isWatching()
        }
      });
    }
  } catch (error) {
    console.error('File watcher API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 获取文件监听状态
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        isWatching: fileWatcher.isWatching(),
        watchedPaths: fileWatcher.getWatchedPaths(),
        status: fileWatcher.isWatching() ? 'running' : 'stopped'
      }
    });
  } catch (error) {
    console.error('File watcher status API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}