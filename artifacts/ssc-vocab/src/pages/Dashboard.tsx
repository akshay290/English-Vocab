import { useGetDashboardStats } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { BookA, BrainCircuit, Calendar, Target, Trophy, Clock, ChevronRight, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!stats) return null;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's how you're doing.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="secondary" className="gap-2">
            <Link href="/revision">
              <BrainCircuit className="h-4 w-4" />
              Smart Revision
              {stats.wordsToRevise ? (
                <span className="ml-1 bg-secondary-foreground text-secondary px-1.5 py-0.5 rounded-full text-xs font-bold">
                  {stats.wordsToRevise}
                </span>
              ) : null}
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/tests">
              <Target className="h-4 w-4" />
              Take a Test
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <BookA className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold">{stats.wordsLearned}</h3>
              <p className="text-sm text-muted-foreground font-medium">Words Learned</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-accent/20 text-accent-foreground rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold">{Math.round(stats.averageScore)}%</h3>
              <p className="text-sm text-muted-foreground font-medium">Avg. Score</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold">{stats.testsAttempted}</h3>
              <p className="text-sm text-muted-foreground font-medium">Tests Taken</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">Active</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-primary">{stats.currentStreak} Days</h3>
              <p className="text-sm text-muted-foreground font-medium">Current Streak</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Daily Goal */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Daily Goal</CardTitle>
              <CardDescription>Keep up your momentum</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-medium">{stats.dailyGoalProgress}%</span>
                </div>
                <Progress value={stats.dailyGoalProgress} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {stats.dailyGoalProgress >= 100 
                    ? "Great job! You've hit your goal for today."
                    : "Learn a few more words or take a test to complete your daily goal."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Tests */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-lg">Recent Tests</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                <Link href="/tests/history">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {stats.recentTests && stats.recentTests.length > 0 ? (
                <div className="divide-y">
                  {stats.recentTests.map((test) => (
                    <div key={test.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Vocabulary Test</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> 
                            {new Date(test.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">{test.score || 0}%</p>
                          <p className="text-xs text-muted-foreground">{test.totalQuestions} Questions</p>
                        </div>
                        {test.status === 'completed' && (
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
                            <Link href={`/tests/${test.id}/result`}><ChevronRight className="h-4 w-4"/></Link>
                          </Button>
                        )}
                        {test.status === 'in_progress' && (
                          <Button variant="secondary" size="sm" asChild>
                            <Link href={`/tests/${test.id}`}>Resume</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Target className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">No tests taken yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Start practicing to track your progress</p>
                  <Button size="sm" asChild><Link href="/tests">Take a Test</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Action Items */}
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Action Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-sm">Words to Revise</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Spaced repetition queue</p>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded-full ${stats.wordsToRevise && stats.wordsToRevise > 0 ? 'bg-secondary/20 text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {stats.wordsToRevise || 0}
                  </span>
                </div>
                <Button className="w-full mt-3 h-9" size="sm" variant={stats.wordsToRevise && stats.wordsToRevise > 0 ? "default" : "outline"} disabled={!stats.wordsToRevise} asChild={!!stats.wordsToRevise}>
                  {stats.wordsToRevise ? <Link href="/revision">Start Revision</Link> : <span>All caught up!</span>}
                </Button>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-sm">Weak Words</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Need more practice</p>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded-full ${stats.weakWordsCount && stats.weakWordsCount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                    {stats.weakWordsCount || 0}
                  </span>
                </div>
                <Button className="w-full mt-3 h-9 bg-destructive/10 text-destructive hover:bg-destructive/20" variant="ghost" size="sm" disabled={!stats.weakWordsCount}>
                  Review Weak Words
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-bold text-xl mb-2 text-white">Daily Word Challenge</h3>
              <p className="text-indigo-100 text-sm mb-4">Learn 5 new words today and boost your vocabulary score.</p>
              <Button variant="secondary" className="w-full font-bold" asChild>
                <Link href="/vocabulary">Explore Words</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-10 rounded-lg mb-4" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32 mb-6" />
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-8">
          <Card>
            <CardContent className="p-6 space-y-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
