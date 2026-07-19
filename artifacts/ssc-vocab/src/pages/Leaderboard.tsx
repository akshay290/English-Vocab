import { useGetLeaderboard } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 50 });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-slate-400 fill-slate-400" />;
      case 3: return <Medal className="h-6 w-6 text-amber-700 fill-amber-700" />;
      default: return <span className="font-bold text-muted-foreground w-6 text-center">{rank}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="h-16 w-16 bg-accent/20 text-accent-foreground rounded-2xl flex items-center justify-center mb-4">
          <Trophy className="h-8 w-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Hall of Fame</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Top performers across SSC Vocab Master. Keep learning and practicing to climb the ranks.
        </p>
      </div>

      <Card className="border-none shadow-xl overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-accent via-primary to-secondary" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                <tr>
                  <th className="px-6 py-4 font-semibold w-16 text-center">Rank</th>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold text-right">Words Learned</th>
                  <th className="px-6 py-4 font-semibold text-right">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leaderboard?.map((entry) => (
                  <tr key={entry.userId} className={`hover:bg-muted/50 transition-colors ${entry.rank <= 3 ? 'bg-primary/5' : ''}`}>
                    <td className="px-6 py-4 flex justify-center items-center">
                      {getRankIcon(entry.rank)}
                    </td>
                    <td className="px-6 py-4 font-medium text-base">
                      {entry.name}
                      {entry.rank === 1 && <Badge variant="secondary" className="ml-2 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20"><Star className="h-3 w-3 mr-1 fill-current" /> Top Scholar</Badge>}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {entry.wordsLearned}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant="outline" className={`font-bold ${entry.averageScore >= 80 ? 'border-secondary text-secondary' : entry.averageScore >= 50 ? 'border-accent text-accent' : 'border-destructive text-destructive'}`}>
                        {Math.round(entry.averageScore)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!leaderboard || leaderboard.length === 0) && (
              <div className="p-12 text-center text-muted-foreground">
                No users found on the leaderboard yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
