import { useGetAdminStats } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookA, Target, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading || !stats) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-10 w-10 mb-4 rounded-lg" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="h-64"><Skeleton className="h-full w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">Platform statistics and activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold">{stats.totalUsers}</h3>
              <p className="text-sm text-muted-foreground font-medium">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center">
                <BookA className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold">{stats.totalVocabulary}</h3>
              <p className="text-sm text-muted-foreground font-medium">Total Words</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold">{stats.totalTests}</h3>
              <p className="text-sm text-muted-foreground font-medium">Tests Taken</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold">{stats.activeUsers}</h3>
              <p className="text-sm text-muted-foreground font-medium">Active Users</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Vocabulary by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.categoryBreakdown?.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{cat.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  <span className="text-sm font-bold bg-muted px-2 py-1 rounded-md">{cat.count} words</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
