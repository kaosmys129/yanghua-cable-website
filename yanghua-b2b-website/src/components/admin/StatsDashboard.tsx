"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/Button';

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

interface StatsDashboardProps {
  refreshInterval?: number;
}

export default function StatsDashboard({ refreshInterval = 30000 }: StatsDashboardProps) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
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
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load system statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'building': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchStats} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const general = stats.general || { totalPages: 0, totalComponents: 0, lastBuild: '', buildStatus: 'success' };
  const performance = stats.performance || { loadTime: 0, bundleSize: 0, cacheHitRate: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Dashboard</h2>
          <p className="text-gray-600">
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={fetchStats} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* General Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 General
            </CardTitle>
            <CardDescription>System overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Total Pages:</span>
              <span className="font-semibold">{general.totalPages}</span>
            </div>
            <div className="flex justify-between">
              <span>Components:</span>
              <span className="font-semibold">{general.totalComponents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Build Status:</span>
              <Badge className={getStatusColor(general.buildStatus)}>
                {general.buildStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚡ Performance
            </CardTitle>
            <CardDescription>System performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Load Time:</span>
              <span className="font-semibold">{performance.loadTime}s</span>
            </div>
            <div className="flex justify-between">
              <span>Bundle Size:</span>
              <span className="font-semibold">{performance.bundleSize}MB</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Cache Hit Rate:</span>
                <span className="font-semibold">{performance.cacheHitRate}%</span>
              </div>
              <Progress value={performance.cacheHitRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💚 System Health
            </CardTitle>
            <CardDescription>Overall system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">Healthy</div>
              <p className="text-sm text-gray-600 mt-2">
                All systems operational
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uptime:</span>
                <span className="text-green-600">99.9%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Response Time:</span>
                <span className="text-green-600">&lt; 200ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}