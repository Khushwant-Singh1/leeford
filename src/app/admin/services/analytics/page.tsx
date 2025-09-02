"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Wrench,
  TrendingUp,
  CheckCircle,
  XCircle,
  BarChart2,
  Clock,
  MoreHorizontal,
  RefreshCw,
  CalendarDays,
  Zap
} from 'lucide-react';

// ── Types & Initial Data ─────────────────────────────────────
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
    parent?: { name: string };
  }>;
  servicesByMonth: Array<{ month: string; count: number }>;
  hierarchyStats: {
    maxDepth: number;
    avgChildrenPerParent: number;
    rootServices: number;
  };
}

const initialStats: ServiceStats = {
  totalServices: 0,
  activeServices: 0,
  inactiveServices: 0,
  parentServices: 0,
  recentlyCreated: [],
  recentlyUpdated: [],
  servicesByMonth: [],
  hierarchyStats: {
    maxDepth: 0,
    avgChildrenPerParent: 0,
    rootServices: 0,
  },
};

// ── Reusable Loading Skeleton ────────────────────────────────
const StatSkeleton = () => (
  <Card className="p-4 space-y-2">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-8 w-1/2" />
  </Card>
);

// ── Stat Card Component ─────────────────────────────────────
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  caption,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  caption?: string;
}) => (
  <Card
    className={cn(
      'relative overflow-hidden group',
      'bg-gradient-to-br from-white/90 via-white/80 to-white/70',
      'dark:from-slate-800/80 dark:via-slate-800/70 dark:to-slate-800/60',
      'border border-slate-200/60 dark:border-slate-700/40',
      'hover:shadow-2xl hover:scale-[1.02] transition-all duration-300'
    )}
  >
    <div className={cn('absolute -top-3 -right-3 w-16 h-16 rounded-full opacity-10', color)} />
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
      <div
        className={cn(
          'p-2 rounded-lg shadow-md',
          color,
          'group-hover:scale-110 transition-transform duration-300'
        )}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      {caption && <p className="text-xs text-muted-foreground mt-1.5">{caption}</p>}
    </CardContent>
  </Card>
);

// ── List Card Component ─────────────────────────────────────
const ListCard = ({
  title,
  items,
}: {
  title: string;
  items: { id: string; name: string; date: string; isActive: boolean }[];
}) => {
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? items : items.slice(0, 4);
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        ) : (
          <>
            <ul className="space-y-3 flex-1">
              {visible.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{it.date}</p>
                  </div>
                  {it.isActive ? (
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 ml-2 shrink-0" />
                  )}
                </li>
              ))}
            </ul>
            {items.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ── Main Page ────────────────────────────────────────────────
export default function ServiceAnalyticsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<ServiceStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/services/stats?days=${timeRange}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setStats({ ...initialStats, ...data });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Analytics</h1>
          <p className="text-muted-foreground mt-1">Insights into your service ecosystem</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchStats}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-44">
              <CalendarDays className="h-4 w-4 mr-1" />
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Services"
              value={stats.totalServices}
              icon={Wrench}
              color="bg-blue-500"
            />
            <StatCard
              title="Active Services"
              value={stats.activeServices}
              icon={CheckCircle}
              color="bg-green-500"
              caption={
                stats.totalServices
                  ? `${((stats.activeServices / stats.totalServices) * 100).toFixed(1)}% of total`
                  : undefined
              }
            />
            <StatCard
              title="Inactive Services"
              value={stats.inactiveServices}
              icon={XCircle}
              color="bg-red-500"
              caption={
                stats.totalServices
                  ? `${((stats.inactiveServices / stats.totalServices) * 100).toFixed(1)}% of total`
                  : undefined
              }
            />
            <StatCard
              title="Root Services"
              value={stats.hierarchyStats.rootServices}
              icon={TrendingUp}
              color="bg-purple-500"
            />
          </>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Hierarchy Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Max Depth', value: stats.hierarchyStats.maxDepth },
                  {
                    label: 'Avg Children',
                    value: stats.hierarchyStats.avgChildrenPerParent.toFixed(1),
                  },
                  { label: 'Root Count', value: stats.hierarchyStats.rootServices },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <ListCard
              title="Recently Created"
              items={stats.recentlyCreated.map((r) => ({
                id: r.id,
                name: r.name,
                date: new Date(r.createdAt).toLocaleDateString(),
                isActive: r.isActive,
              }))}
            />

            <ListCard
              title="Recently Updated"
              items={stats.recentlyUpdated.map((r) => ({
                id: r.id,
                name: r.name,
                date: new Date(r.updatedAt).toLocaleDateString(),
                isActive: r.isActive,
              }))}
            />
          </>
        )}
      </div>

      {/* Monthly Chart */}
      {!loading && stats.servicesByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Monthly Creation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.servicesByMonth.map((item) => {
                const max = Math.max(...stats.servicesByMonth.map((m) => m.count));
                const pct = max ? (item.count / max) * 100 : 0;
                return (
                  <div key={item.month} className="flex items-center gap-4">
                    <span className="text-sm w-24 text-muted-foreground truncate">{item.month}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-medium text-sm w-6 text-right">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}