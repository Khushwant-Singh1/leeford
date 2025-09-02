'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Wrench,
  TrendingUp,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';

interface Count {
  children: number;
}
interface Parent {
  id: string;
  name: string;
}
interface Child {
  id: string;
  name: string;
  slug: string;
}
interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent: Parent | null;
  children: Child[];
  _count?: Count;
}

export default function ServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [stats, setStats] = useState({
    totalServices: 0,
    activeServices: 0,
    inactiveServices: 0,
    parentServices: 0,
  });

  /* ------------------ Data fetching ------------------ */
  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/services?${params}`);
      const data = await res.json();

      if (res.ok) {
        setServices(data.services ?? []);
        setTotalPages(data.pagination?.pages ?? 1);

        const list = data.services ?? [];
        setStats({
          totalServices: data.pagination?.total ?? list.length,
          activeServices: list.filter((s: Service) => s.isActive).length,
          inactiveServices: list.filter((s: Service) => !s.isActive).length,
          parentServices: list.filter((s: Service) => !s.parent).length,
        });
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to fetch services', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch services', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [currentPage, searchTerm, statusFilter]);

  /* ------------------ Actions ------------------ */
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Deleted' });
        fetchServices();
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Delete failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleStatusToggle = async (service: Service) => {
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      if (res.ok) {
        toast({ title: `Service ${service.isActive ? 'deactivated' : 'activated'}` });
        fetchServices();
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Update failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Update failed', variant: 'destructive' });
    }
  };

  /* ------------------ Render helpers ------------------ */
  const StatCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) => (
    <Card className="border-neutral-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-neutral-600">{label}</CardTitle>
        <Icon className="w-5 h-5 text-neutral-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-neutral-800">{value}</div>
      </CardContent>
    </Card>
  );

  const getStatusBadge = (active: boolean) => (
    <Badge variant={active ? 'default' : 'secondary'} className="rounded-full">
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
      <div className="flex justify-center items-center gap-1 mt-6">
        <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === currentPage ? 'default' : 'ghost'}
            size="sm"
            className="w-8 h-8"
            onClick={() => setCurrentPage(p)}
          >
            {p}
          </Button>
        ))}
        <Button variant="ghost" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Services</h1>
          <p className="text-sm text-neutral-600 mt-1">Manage your service offerings and categories</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/services/categories">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Categories
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/services/add">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wrench} label="Total Services" value={stats.totalServices} />
        <StatCard icon={CheckCircle} label="Active" value={stats.activeServices} />
        <StatCard icon={XCircle} label="Inactive" value={stats.inactiveServices} />
        <StatCard icon={TrendingUp} label="Parent Services" value={stats.parentServices} />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-neutral-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/5">Service</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sub-services</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="py-4">
                    <Skeleton className="h-6 w-full rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-neutral-500">
                  No services found
                </TableCell>
              </TableRow>
            ) : (
              services.map((s) => (
                <TableRow key={s.id} className="hover:bg-neutral-50">
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-neutral-900">{s.name}</p>
                      <p className="text-xs text-neutral-500 truncate max-w-xs">{s.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.parent ? (
                      <Badge variant="outline" className="text-xs">
                        {s.parent.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-neutral-500 italic">Root</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(s.isActive)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {s._count?.children || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/services/edit/${s.id}`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleStatusToggle(s)}>
                        {s.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Pagination />
    </div>
  );
}