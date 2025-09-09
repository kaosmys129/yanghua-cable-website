'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import StatsDashboard from '@/components/admin/StatsDashboard';
import { 
  RefreshCw,
  Settings,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Users,
  Activity
} from 'lucide-react';

// 系统统计数据接口
interface SystemStats {
  general: {
    totalPages: number;
    totalComponents: number;
    lastBuild: string;
    buildStatus: 'success' | 'failed' | 'building';
  };
  performance: {
    loadTime: number;
    bundleSize: number;
    cacheHitRate: number;
  };
}

// 最近活动接口
interface RecentActivity {
  id: string;
  type: 'build' | 'deploy' | 'update' | 'maintenance';
  message: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
}

export default function AdminPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 获取系统统计数据
  const fetchStats = async () => {
    try {
      // Mock data since image management system is removed
      const mockStats: SystemStats = {
        general: {
          totalPages: 15,
          totalComponents: 45,
          lastBuild: new Date().toISOString(),
          buildStatus: 'success'
        },
        performance: {
          loadTime: 1.2,
          bundleSize: 2.5,
          cacheHitRate: 85
        }
      };
      setStats(mockStats);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 获取最近活动
  const fetchActivities = async () => {
    try {
      // Mock activities data
      const mockActivities: RecentActivity[] = [
        {
          id: '1',
          type: 'build',
          message: '网站构建完成',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'deploy',
          message: '部署到生产环境',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          status: 'success'
        },
        {
          id: '3',
          type: 'update',
          message: '更新产品页面内容',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          status: 'success'
        }
      ];
      setActivities(mockActivities);
    } catch (error) {
      console.error('获取活动记录失败:', error);
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchActivities()]);
    setRefreshing(false);
  };

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      await Promise.all([fetchStats(), fetchActivities()]);
      setLoading(false);
    };
    initData();
  }, []);

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'building':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">系统管理</h1>
          <p className="text-muted-foreground mt-2">
            监控和管理您的网站系统
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 页面统计 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总页面数</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.general.totalPages}</div>
              <p className="text-xs text-muted-foreground mt-2">
                网站总页面数量
              </p>
            </CardContent>
          </Card>

          {/* 组件统计 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">组件数量</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.general.totalComponents}</div>
              <p className="text-xs text-muted-foreground mt-2">
                可重用组件总数
              </p>
            </CardContent>
          </Card>

          {/* 性能统计 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">加载时间</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.performance.loadTime}s</div>
              <div className="mt-2">
                <Progress value={stats.performance.cacheHitRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  缓存命中率: {stats.performance.cacheHitRate}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 构建状态 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">构建状态</CardTitle>
              {getStatusIcon(stats.general.buildStatus)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge 
                  variant={stats.general.buildStatus === 'success' ? 'secondary' : 
                          stats.general.buildStatus === 'failed' ? 'destructive' : 'default'}
                >
                  {stats.general.buildStatus === 'success' ? '成功' :
                   stats.general.buildStatus === 'failed' ? '失败' : '构建中'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                最后构建: {formatTime(stats.general.lastBuild)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主要功能区域 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="activities">活动记录</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-4">
          <StatsDashboard refreshInterval={30000} />
        </TabsContent>

        {/* 活动记录标签页 */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>最近活动</CardTitle>
              <CardDescription>系统最近的操作记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTime(activity.timestamp)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="outline">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 设置标签页 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>系统设置</CardTitle>
              <CardDescription>配置系统参数和选项</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">自动刷新</h3>
                    <p className="text-sm text-muted-foreground">
                      启用数据自动刷新功能
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    配置
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">性能监控</h3>
                    <p className="text-sm text-muted-foreground">
                      监控网站性能指标
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Activity className="h-4 w-4 mr-2" />
                    查看
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">系统维护</h3>
                    <p className="text-sm text-muted-foreground">
                      执行系统维护任务
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    执行
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}