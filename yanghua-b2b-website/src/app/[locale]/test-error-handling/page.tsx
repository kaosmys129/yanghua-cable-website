'use client';

import { useState, useEffect } from 'react';
import { useArticles } from '@/lib/queries';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import errorLogger from '@/lib/error-logger';
import { getContentBaseUrl } from '@/lib/utils';

interface ErrorDetails {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
}

export default function TestErrorHandlingPage() {
  const [showLogs, setShowLogs] = useState(false);
  const [errorLogs, setErrorLogs] = useState<ErrorDetails[]>([]);
  const [firstLoadResult, setFirstLoadResult] = useState<any>(null);
  const [firstLoadError, setFirstLoadError] = useState<string | null>(null);
  const { data: articles, error, isLoading, refetch } = useArticles();

  const refreshLogs = () => {
    const logs = errorLogger.getLogs();
    const errorOnlyLogs = logs
      .filter(log => log.level === 'error')
      .map(log => ({
        message: log.message,
        stack: log.stack,
        context: log.context,
        timestamp: log.timestamp
      }))
      .slice(-10); // 最近10条错误日志
    
    setErrorLogs(errorOnlyLogs);
    setShowLogs(true);
  };

  const clearLogs = () => {
    errorLogger.clearLogs();
    setErrorLogs([]);
  };

  const triggerTestError = () => {
    // 手动触发一个测试错误
    errorLogger.error('Test error for debugging', new Error('This is a test error'), {
      testContext: 'Manual trigger',
      timestamp: new Date().toISOString()
    });
    refreshLogs();
  };

  useEffect(() => {
    const simulateFirstLoad = async () => {
      try {
        const url = getContentBaseUrl() + '/api/articles?locale=en';
        const response = await fetch(url, {
          cache: 'no-store',
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setFirstLoadResult(data);
      } catch (err: any) {
        setFirstLoadError(err.message);
        errorLogger.error('Simulated first load error', err, { context: 'first-load-simulation' });
      }
    };
    simulateFirstLoad();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">错误处理测试页面</h1>
        <p className="text-muted-foreground">
          此页面用于测试和调试内容仓库接口的错误处理改进
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 文章加载状态 */}
        <Card>
          <CardHeader>
            <CardTitle>文章加载状态</CardTitle>
            <CardDescription>
              当前文章数据获取状态和结果
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={isLoading ? "secondary" : "outline"}>
                {isLoading ? "加载中" : "已完成"}
              </Badge>
              {error && (
                <Badge variant="destructive">错误</Badge>
              )}
              {articles && (
                <Badge variant="default">
                  {articles.length} 篇文章
                </Badge>
              )}
            </div>

            {error && (
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="text-red-800">
                  <strong>错误信息:</strong> {error.message}
                  {(error as any).detailedInfo && (
                    <div className="mt-2">
                      <strong>详细信息:</strong> {(error as any).detailedInfo}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => refetch()} disabled={isLoading}>
                重新获取文章
              </Button>
              <Button variant="outline" onClick={triggerTestError}>
                触发测试错误
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 错误日志控制 */}
        <Card>
          <CardHeader>
            <CardTitle>错误日志管理</CardTitle>
            <CardDescription>
              查看和管理应用程序错误日志
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={refreshLogs}>
                刷新错误日志
              </Button>
              <Button variant="outline" onClick={clearLogs}>
                清空日志
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              当前错误日志数量: {errorLogs.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 错误日志详情 */}
      {showLogs && (
        <Card>
          <CardHeader>
            <CardTitle>错误日志详情</CardTitle>
            <CardDescription>
              最近的错误日志记录（最多显示10条）
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                暂无错误日志
              </p>
            ) : (
              <div className="space-y-4">
                {errorLogs.map((log, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">
                        错误 #{errorLogs.length - index}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <strong className="text-sm">消息:</strong>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.message}
                        </p>
                      </div>
                      
                      {log.context && (
                        <div>
                          <strong className="text-sm">上下文:</strong>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {log.stack && (
                        <details className="text-xs">
                          <summary className="cursor-pointer font-medium">
                            堆栈跟踪
                          </summary>
                          <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                    
                    {index < errorLogs.length - 1 && (
                      <hr className="mt-4 border-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• <strong>重新获取文章:</strong> 触发文章数据重新加载，可以观察错误处理改进效果</p>
          <p>• <strong>触发测试错误:</strong> 手动创建一个测试错误，验证错误日志记录功能</p>
          <p>• <strong>刷新错误日志:</strong> 获取最新的错误日志记录</p>
          <p>• <strong>清空日志:</strong> 清除所有本地错误日志</p>
          <p className="text-muted-foreground mt-4">
            💡 打开浏览器开发者工具的控制台，可以看到更详细的调试信息
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
