import React, { useState, useEffect } from "react";
import { api, type LeaderboardUser } from "../lib/api";
import { Trophy, Medal, Award, Flame, Target, CheckCircle2 } from "lucide-react";

export function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"overall" | "weekly" | "daily">("overall");

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const data = await api.getLeaderboard();
        setUsers(data);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [period]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl mx-auto bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
          <Trophy className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          SSC Aspirants Leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Compete with fellow learners across India preparing for SSC CGL, CHSL, and CPO examinations.
        </p>
      </div>

      {/* Podium Top 3 */}
      {!loading && users.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 pt-4 max-w-lg mx-auto items-end">
          {/* Rank 2 */}
          <div className="p-4 rounded-2xl bg-card border text-center space-y-1 shadow-sm">
            <div className="w-10 h-10 rounded-full mx-auto bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center font-bold text-sm">
              🥈 2
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate mt-2">
              {users[1].name}
            </h4>
            <span className="text-[11px] text-muted-foreground block">
              {users[1].wordsLearned} words
            </span>
          </div>

          {/* Rank 1 */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/15 via-card to-card border-2 border-amber-500/40 text-center space-y-1 shadow-md scale-105">
            <div className="w-12 h-12 rounded-full mx-auto bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/30">
              👑 1
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground truncate mt-2">
              {users[0].name}
            </h4>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block">
              {users[0].wordsLearned} words • {users[0].averageScore}%
            </span>
          </div>

          {/* Rank 3 */}
          <div className="p-4 rounded-2xl bg-card border text-center space-y-1 shadow-sm">
            <div className="w-10 h-10 rounded-full mx-auto bg-amber-700/20 text-amber-800 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
              🥉 3
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate mt-2">
              {users[2].name}
            </h4>
            <span className="text-[11px] text-muted-foreground block">
              {users[2].wordsLearned} words
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="p-6 rounded-2xl bg-card border shadow-sm">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Rank</th>
                  <th className="py-3 px-4">Aspirant Name</th>
                  <th className="py-3 px-4">Words Mastered</th>
                  <th className="py-3 px-4">Tests Taken</th>
                  <th className="py-3 px-4 rounded-r-lg text-right">Avg. Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold">
                      {u.rank === 1 ? "🥇 1" : u.rank === 2 ? "🥈 2" : u.rank === 3 ? "🥉 3" : `#${u.rank}`}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">{u.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-600">{u.wordsLearned}</span>
                      <span className="text-xs text-muted-foreground"> words</span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">{u.testsAttempted} tests</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-primary">{u.averageScore}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
