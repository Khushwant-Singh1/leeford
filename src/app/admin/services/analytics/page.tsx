'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Wrench,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart2,
  PieChart
} from 'lucide-react';

interface ServiceStats {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  parentServices: number;
  recentlyCreated: Array<{
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    isActive: boolean;
  }>;
  recentlyUpdated: Array<{
    id: string;
    name: string;
    slug: string;
    updatedAt: string;
    isActive: boolean;
    parent?: {
      name: string;
    };
  }>;
  servicesByMonth: Array<{
    month: string;
    count: number;
  }>;
  hierarchyStats: {
    maxDepth: number;
    avgChildrenPerParent: number;
    rootServices: number;
  };
}

export default function ServiceAnalyticsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  // Fetch analytics data
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/services/stats?days=${timeRange}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch analytics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Service Analytics</h1>
            <p className="text-muted-foreground">Monitor your service performance and statistics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load analytics data</p>
        <Button onClick={fetchStats} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Analytics</h1>
          <p className="text-muted-foreground">Monitor your service performance and statistics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              All services in system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeServices}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.activeServices / stats.totalServices) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Services</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveServices}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.inactiveServices / stats.totalServices) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Root Services</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hierarchyStats.rootServices}</div>
            <p className="text-xs text-muted-foreground">
              Top-level services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchy Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service Hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Max Depth</span>
              <span className="font-medium">{stats.hierarchyStats.maxDepth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg. Children per Parent</span>
              <span className="font-medium">{stats.hierarchyStats.avgChildrenPerParent.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Root Services</span>
              <span className="font-medium">{stats.hierarchyStats.rootServices}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recently Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentlyCreated.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent services</p>
              ) : (
                stats.recentlyCreated.slice(0, 5).map((service) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(service.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-2">
                      {service.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recently Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentlyUpdated.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent updates</p>
              ) : (
                stats.recentlyUpdated.slice(0, 5).map((service) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(service.updatedAt).toLocaleDateString()}
                        {service.parent && ` • ${service.parent.name}`}
                      </p>
                    </div>
                    <div className="ml-2">
                      {service.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Creation Chart */}
      {stats.servicesByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Services Created by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.servicesByMonth.map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(item.count / Math.max(...stats.servicesByMonth.map(m => m.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
