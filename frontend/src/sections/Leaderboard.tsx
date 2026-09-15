import { useEffect, useState } from 'react';
import { Award, ChevronLeft, Medal, Share2, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { User as UserType, View } from '../App';
import { useScrollReveal } from '../hooks/use-scroll-reveal';
import { fetchLeaderboard, type LeaderboardResponse } from '../lib/api';

interface LeaderboardProps {
  user: UserType;
  onNavigate: (view: View) => void;
}

export function Leaderboard({ user: _user, onNavigate }: LeaderboardProps) {
  const sectionRef = useScrollReveal<HTMLElement>();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetchLeaderboard();
      setData(response);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load leaderboard data.');
    } finally {
      setLoading(false);
    }
  };

  const entries = data?.entries ?? [];
  const topEntries = entries.slice(0, 5);

  if (loading) {
    return <section className="min-h-screen bg-eco-bg pt-24 pb-12 px-4 flex items-center justify-center"><div className="animate-pulse text-eco-sage">Loading leaderboard...</div></section>;
  }

  return (
    <section ref={sectionRef} className="min-h-screen bg-eco-bg pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between scroll-reveal">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('dashboard')} className="rounded-2xl bg-white p-3 text-eco-sage hover:bg-eco-bg-alt">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-heading font-bold text-eco-forest">Eco Leaderboard</h1>
              <p className="mt-1 text-sm text-eco-sage">See how your current impact compares with other active users.</p>
            </div>
          </div>

          <button onClick={() => toast.info('Invite flow coming next.')} className="eco-button flex items-center gap-2 px-5 py-3 text-sm">
            <Share2 className="w-4 h-4" />
            Invite Friends
          </button>
        </div>

        {error && <div className="eco-card mb-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 scroll-reveal">{error}</div>}

        {data && (
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr,0.85fr] scroll-reveal">
            <div className="eco-card bg-[linear-gradient(135deg,_rgba(123,200,141,0.22),_rgba(255,255,255,0.98))] p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-white text-4xl font-heading font-bold text-eco-green">
                    {data.currentUserEligible && data.currentUserRank ? `#${data.currentUserRank}` : '--'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-eco-sage">Your Position</p>
                    <p className="mt-2 text-2xl font-heading font-bold text-eco-forest">
                      {data.currentUserEligible ? 'On the board' : 'Unranked'}
                    </p>
                    <p className="mt-1 text-sm text-eco-sage">
                      {data.currentUserEligible ? `${data.currentUserPercentile}% percentile among tracked users.` : 'Add a carbon entry to join the leaderboard.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SummaryCard label="Current Score" value={String(data.currentUserScore)} />
                  <SummaryCard label="Tracked CO2e" value={`${data.currentUserTotal} kg`} />
                </div>
              </div>
            </div>

            <div className="eco-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Leaderboard Stats</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <SummaryCard label="Participants" value={String(data.totalParticipants)} />
                <SummaryCard label="Average CO2e" value={`${data.averageCarbonKg} kg`} />
                <SummaryCard label="Top Saver" value={data.topPerformer?.userName ?? 'TBD'} />
                <SummaryCard label="Best Score" value={data.topPerformer ? String(data.topPerformer.score) : '--'} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.45fr),320px] scroll-reveal">
          <div className="eco-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-heading font-bold text-eco-forest">Top Savers</h2>
                <p className="text-sm text-eco-sage">Sorted by lowest tracked emissions and strongest sustainability score.</p>
              </div>
              <div className="rounded-full bg-eco-bg px-4 py-2 text-sm font-semibold text-eco-green">
                {entries.length} ranked users
              </div>
            </div>

            <div className="space-y-3">
              {topEntries.map((entry) => (
                <div key={entry.userId} className={`rounded-[26px] border p-4 transition-all ${entry.isCurrentUser ? 'border-eco-green bg-[#eff8f1]' : 'border-[rgba(61,139,93,0.12)] bg-white'}`}>
                  <div className="grid grid-cols-[56px,minmax(0,1fr),auto] items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-eco-bg">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-eco-forest">{entry.userName}</p>
                        {entry.isCurrentUser && <span className="rounded-full bg-eco-green px-2 py-0.5 text-[10px] font-semibold text-white">You</span>}
                      </div>
                      <p className="mt-1 text-sm text-eco-sage">
                        {entry.completedGoals} goals completed, {entry.badgeCount} badges earned
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-heading font-bold text-eco-forest">{entry.totalCarbonKg} kg</p>
                      <p className="text-xs text-eco-green">{entry.impactPercent}% impact score</p>
                    </div>
                  </div>
                </div>
              ))}

              {entries.length === 0 && (
                <p className="rounded-[24px] bg-eco-bg p-6 text-center text-sm text-eco-sage">No users on the leaderboard yet.</p>
              )}
            </div>

            {entries.length > 5 && (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-eco-bg-alt">
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Rank</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">User</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">CO2e</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Goals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.slice(5).map((entry) => (
                      <tr key={entry.userId} className="border-b border-eco-bg-alt/60 hover:bg-eco-bg/60">
                        <td className="px-3 py-4 text-sm font-semibold text-eco-forest">#{entry.rank}</td>
                        <td className="px-3 py-4 text-sm text-eco-forest">{entry.userName}</td>
                        <td className="px-3 py-4 text-right text-sm font-semibold text-eco-forest">{entry.totalCarbonKg}</td>
                        <td className="px-3 py-4 text-right text-sm text-eco-sage">{entry.completedGoals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="eco-card p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#eef8f0] p-3">
                  <Users className="h-5 w-5 text-eco-green" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Community</p>
                  <p className="text-base font-semibold text-eco-forest">Compete with purpose</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-eco-sage">The leaderboard rewards lower emissions, completed goals, and steady follow-through. Invite more users to make the benchmark tougher.</p>
            </div>

            <div className="eco-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Podium</p>
              <div className="mt-4 space-y-3">
                {entries.slice(0, 3).map((entry) => (
                  <div key={entry.userId} className="rounded-[22px] bg-eco-bg p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {getRankIcon(entry.rank)}
                        <div>
                          <p className="text-sm font-semibold text-eco-forest">{entry.userName}</p>
                          <p className="text-xs text-eco-sage">{entry.score} score</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-eco-green">{entry.totalCarbonKg} kg</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-orange-500" />;
  return <span className="text-sm font-semibold text-eco-forest">#{rank}</span>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-eco-bg p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-eco-sage">{label}</p>
      <p className="mt-2 text-xl font-heading font-bold text-eco-forest">{value}</p>
    </div>
  );
}
