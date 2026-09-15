import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  Award,
  BellRing,
  Car,
  ChevronRight,
  Leaf,
  Plus,
  Sparkles,
  Store,
  Target,
  Trophy,
  Utensils,
  Zap,
} from 'lucide-react';
import type { User as UserType, View } from '../App';
import { useScrollReveal } from '../hooks/use-scroll-reveal';
import {
  type DashboardBadgeHighlight,
  type DashboardCategoryInsight,
  type DashboardResponseData,
  fetchDashboard,
} from '../lib/api';

interface DashboardProps {
  user: UserType;
  onNavigate: (view: View) => void;
}

type Period = 'daily' | 'weekly' | 'monthly';

const badgeIconMap = {
  Award,
  Car,
  Leaf,
  Sparkles,
  Target,
  Trophy,
  Utensils,
  Zap,
} as const;

const fallbackInsights: DashboardCategoryInsight[] = [
  { category: 'Transport', amount: 0, changePercent: 0, miniTrend: [0, 0, 0, 0, 0, 0, 0] },
  { category: 'Food & Diet', amount: 0, changePercent: 0, miniTrend: [0, 0, 0, 0, 0, 0, 0] },
  { category: 'Energy Usage', amount: 0, changePercent: 0, miniTrend: [0, 0, 0, 0, 0, 0, 0] },
];

export function Dashboard({ user, onNavigate }: DashboardProps) {
  const sectionRef = useScrollReveal<HTMLElement>();
  const [goalPeriod, setGoalPeriod] = useState<Period>('weekly');
  const [data, setData] = useState<DashboardResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadDashboard();
  }, [goalPeriod]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetchDashboard(goalPeriod);
      setData(response);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.name.split(' ')[0] ?? 'there';
  const totalKg = data?.totalCarbonKg ?? 0;
  const changePct = data?.monthlyChangePercent ?? 0;
  const periodKg = data?.periodCarbonKg ?? 0;
  const periodLabel = data?.periodLabel ?? 'This Month';
  const trendData = data?.weeklyTrend?.map((point) => ({ date: point.date, value: point.amount })) ?? [];
  const categoryInsights = data?.categoryInsights?.length ? data.categoryInsights.slice(0, 3) : fallbackInsights;
  const badgeHighlights = data?.badgeHighlights ?? [];
  const recentActivity = data?.recentActivities ?? [];
  const activeGoal = data?.activeGoal;
  const sustainabilityScore = data?.sustainabilityScore ?? 0;
  const unreadNotifications = data?.unreadNotifications ?? 0;

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transport':
        return <Car className="w-5 h-5 text-sky-600" />;
      case 'food & diet':
        return <Utensils className="w-5 h-5 text-emerald-600" />;
      case 'energy usage':
        return <Zap className="w-5 h-5 text-amber-600" />;
      default:
        return <Leaf className="w-5 h-5 text-eco-green" />;
    }
  };

  const getCategoryAccent = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transport':
        return 'from-sky-100 to-white text-sky-700';
      case 'food & diet':
        return 'from-emerald-100 to-white text-emerald-700';
      case 'energy usage':
        return 'from-amber-100 to-white text-amber-700';
      default:
        return 'from-eco-bg-alt to-white text-eco-forest';
    }
  };

  const getCategoryBarTone = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transport':
        return 'from-sky-600 via-sky-500 to-sky-300';
      case 'food & diet':
        return 'from-emerald-600 via-emerald-500 to-emerald-300';
      case 'energy usage':
        return 'from-amber-500 via-amber-400 to-yellow-300';
      default:
        return 'from-eco-green via-emerald-400 to-emerald-200';
    }
  };

  const getBadgeIcon = (badge: DashboardBadgeHighlight) => {
    const Icon = badgeIconMap[badge.iconName as keyof typeof badgeIconMap] ?? Award;
    return <Icon className={`w-5 h-5 ${getBadgeTone(badge.code).icon}`} />;
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
    if (!active || !payload?.length) {
      return null;
    }

    return (
      <div className="rounded-xl bg-eco-forest px-3 py-2 text-xs text-white shadow-xl">
        {Math.round(payload[0].value * 10) / 10} kg CO2e
      </div>
    );
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-eco-bg pt-20 pb-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="animate-pulse text-eco-sage">Loading dashboard...</div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="min-h-screen bg-eco-bg pt-20 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between scroll-reveal">
          <div>
            <h1 className="text-3xl font-heading font-bold text-eco-forest sm:text-4xl">
              Welcome back, {firstName}!
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-eco-sage sm:text-base">
              Here&apos;s your environmental impact snapshot for this week, with live goal progress and the next badges within reach.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('carbonlog')}
              className="rounded-2xl border border-[rgba(61,139,93,0.14)] bg-white px-4 py-3 text-sm font-semibold text-eco-forest transition-all hover:shadow-md"
            >
              Live Monitoring
            </button>
            <button
              onClick={() => onNavigate('goals')}
              className="eco-button flex items-center gap-2 py-3"
            >
              <Plus className="w-4 h-4" />
              New Goal
            </button>
          </div>
        </div>

        {error && (
          <div className="eco-card mb-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 scroll-reveal">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr,1fr,1fr] scroll-reveal">
          <div className="eco-card overflow-hidden p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Total Footprint</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-heading font-bold text-eco-forest">{totalKg}</span>
                  <span className="pb-1 text-sm text-eco-sage">kg CO2e</span>
                </div>
              </div>
              <div className="rounded-2xl bg-eco-green/10 p-3">
                <Leaf className="h-6 w-6 text-eco-green" />
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f2faf4] px-3 py-1.5 text-xs font-semibold">
              <ArrowUpRight className={`h-3.5 w-3.5 ${changePct <= 0 ? 'rotate-180 text-eco-green' : 'text-eco-error'}`} />
              <span className={changePct <= 0 ? 'text-eco-green' : 'text-eco-error'}>
                {changePct > 0 ? '+' : ''}
                {changePct}%
              </span>
              <span className="text-eco-sage">vs last month</span>
            </div>
            <div className="mt-5 rounded-[24px] bg-[radial-gradient(circle_at_top_left,_rgba(61,139,93,0.18),_rgba(61,139,93,0.04)_55%)] p-4">
              <div className="flex items-center justify-between text-sm text-eco-sage">
                <span>{periodLabel}</span>
                <span>{periodKg} kg tracked</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-eco-green"
                  style={{ width: `${Math.min(Math.max(sustainabilityScore, 8), 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-eco-sage">
                Sustainability score: <span className="font-semibold text-eco-forest">{sustainabilityScore}/100</span>
              </p>
            </div>
          </div>

          <div className="eco-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Quick Actions</p>
                <h2 className="mt-2 text-xl font-heading font-bold text-eco-forest">Keep momentum up</h2>
              </div>
              <div className="rounded-2xl bg-[#eef8f0] p-3">
                <Sparkles className="h-5 w-5 text-eco-green" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate('carbonlog')}
                className="rounded-[22px] bg-eco-bg px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Plus className="mb-4 h-4 w-4 text-eco-green" />
                <p className="text-sm font-semibold text-eco-forest">Add Log</p>
                <p className="mt-1 text-xs text-eco-sage">Track a new activity</p>
              </button>
              <button
                onClick={() => onNavigate('goals')}
                className="rounded-[22px] bg-eco-bg px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Target className="mb-4 h-4 w-4 text-eco-green" />
                <p className="text-sm font-semibold text-eco-forest">New Goal</p>
                <p className="mt-1 text-xs text-eco-sage">Set a fresh target</p>
              </button>
              <button
                onClick={() => onNavigate('marketplace')}
                className="rounded-[22px] bg-eco-bg px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Store className="mb-4 h-4 w-4 text-eco-green" />
                <p className="text-sm font-semibold text-eco-forest">Offset Carbon</p>
                <p className="mt-1 text-xs text-eco-sage">Browse climate projects</p>
              </button>
              <button
                onClick={() => onNavigate('notifications')}
                className="rounded-[22px] bg-eco-bg px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <BellRing className="mb-4 h-4 w-4 text-eco-green" />
                <p className="text-sm font-semibold text-eco-forest">Alerts</p>
                <p className="mt-1 text-xs text-eco-sage">{unreadNotifications} unread updates</p>
              </button>
            </div>
          </div>

          <div className="eco-card overflow-hidden p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Active Monthly Goal</p>
                <h2 className="mt-2 text-xl font-heading font-bold text-eco-forest">
                  {activeGoal?.title ?? 'Create your first reduction goal'}
                </h2>
              </div>
              <div className="rounded-2xl bg-[#eef8f0] px-3 py-2 text-xs font-semibold text-eco-green">
                {activeGoal?.progressPercentage ?? 0}% complete
              </div>
            </div>

            <div className="mt-5 rounded-[28px] border border-[rgba(61,139,93,0.12)] bg-[linear-gradient(135deg,_rgba(122,200,141,0.22),_rgba(255,255,255,0.95))] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">
                {activeGoal?.category ?? 'No active goals'}
              </p>
              <p className="mt-3 text-sm font-medium text-eco-forest">
                {activeGoal
                  ? `Reduce emissions by ${activeGoal.targetPercentage}% over ${activeGoal.timeframeLabel.toLowerCase()}.`
                  : 'Define a measurable milestone and we will track progress, insights, and badge opportunities for you.'}
              </p>
              <div className="mt-4 h-2 rounded-full bg-white/90">
                <div
                  className="h-full rounded-full bg-eco-green"
                  style={{ width: `${activeGoal?.progressPercentage ?? 0}%` }}
                />
              </div>
              <div className="mt-4 flex items-end justify-between text-sm">
                <div>
                  <p className="text-eco-sage">Target reduction</p>
                  <p className="font-heading text-xl font-bold text-eco-forest">{activeGoal?.targetAmount ?? 0} kg</p>
                </div>
                <button
                  onClick={() => onNavigate('goals')}
                  className="inline-flex items-center gap-1 font-semibold text-eco-green transition-colors hover:text-eco-forest"
                >
                  Manage goals
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 scroll-reveal">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-heading font-bold text-eco-forest">Category Breakdown</h2>
              <p className="text-sm text-eco-sage">Weekly comparison across your major emission sources.</p>
            </div>
            <div className="flex overflow-hidden rounded-full border border-[rgba(61,139,93,0.15)] bg-white">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setGoalPeriod(period)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${goalPeriod === period ? 'bg-eco-green text-white' : 'text-eco-sage hover:bg-eco-bg-alt'}`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {categoryInsights.map((insight) => {
              const trendBars = insight.miniTrend.length > 0 ? insight.miniTrend : [insight.amount];
              const maxBarValue = Math.max(...trendBars, 1);
              const activeDays = trendBars.filter((value) => value > 0).length;

              return (
                <div key={insight.category} className={`eco-card bg-gradient-to-br ${getCategoryAccent(insight.category)} p-5`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/90 p-3">
                        {getCategoryIcon(insight.category)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-eco-forest">{insight.category}</p>
                        <p className="text-xs text-eco-sage">
                          {insight.changePercent > 0 ? '+' : ''}
                          {insight.changePercent}% from previous week
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-heading font-bold text-eco-forest">{insight.amount}</p>
                      <p className="text-xs text-eco-sage">kg CO2e</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-eco-sage">7 Day Trend</p>
                      <p className="text-[11px] text-eco-sage">{activeDays} active days</p>
                    </div>

                    <div className="flex h-24 items-end gap-2">
                      {trendBars.map((value, index) => {
                        const height = `${Math.max((value / maxBarValue) * 100, value > 0 ? 18 : 8)}%`;

                        return (
                          <div key={`${insight.category}-${index}`} className="flex-1">
                            <div className="flex h-24 w-full items-end rounded-[18px] bg-white/80 p-1.5">
                              <div
                                className={`w-full rounded-[12px] bg-gradient-to-t ${getCategoryBarTone(insight.category)} transition-[height] duration-300`}
                                style={{ height }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-eco-sage">
                      <span>6 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr),minmax(320px,0.9fr)]">
          <div className="eco-card p-5 scroll-reveal">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-heading font-bold text-eco-forest">Emission Trend</h3>
                <p className="text-sm text-eco-sage">Visualizing your carbon output over the last 7 days.</p>
              </div>
            </div>

            <div className="mt-5 h-72 w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7BC88D" stopOpacity={0.42} />
                        <stop offset="95%" stopColor="#7BC88D" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4F0E7" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B8A76', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B8A76', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3D8B5D"
                      strokeWidth={2.5}
                      fill="url(#dashboardTrend)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#3D8B5D', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[28px] bg-eco-bg text-sm text-eco-sage">
                  No emissions tracked yet. Complete your survey or add a carbon log to populate the chart.
                </div>
              )}
            </div>
          </div>

          <div className="eco-card p-5 scroll-reveal">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-heading font-bold text-eco-forest">Eco Badges</h3>
                <p className="text-sm text-eco-sage">Milestones and near-term unlocks.</p>
              </div>
              <button
                onClick={() => onNavigate('badges')}
                className="text-sm font-semibold text-eco-green transition-colors hover:text-eco-forest"
              >
                View all
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {badgeHighlights.length > 0 ? badgeHighlights.map((badge) => (
                <button
                  key={badge.code}
                  onClick={() => onNavigate('badges')}
                  className="rounded-[24px] bg-eco-bg p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={`mb-4 inline-flex rounded-2xl ${getBadgeTone(badge.code).bg} p-3`}>
                    {getBadgeIcon(badge)}
                  </div>
                  <p className="text-sm font-semibold text-eco-forest">{badge.name}</p>
                  <p className="mt-2 text-xs text-eco-sage">
                    {badge.earned ? 'Unlocked and counted toward your eco points.' : `${badge.progress}% complete`}
                  </p>
                </button>
              )) : (
                <div className="col-span-2 rounded-[24px] bg-eco-bg p-5 text-center text-sm text-eco-sage">
                  Your badge gallery will appear here once you start tracking activity and completing goals.
                </div>
              )}
            </div>

            <div className="mt-5 rounded-[24px] border border-[rgba(61,139,93,0.12)] bg-[linear-gradient(135deg,_rgba(168,217,181,0.18),_rgba(255,255,255,1))] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Progress Pulse</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-heading font-bold text-eco-forest">{data?.totalBadges ?? 0}</p>
                  <p className="text-sm text-eco-sage">badges earned</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-heading font-bold text-eco-green">{data?.completedGoals ?? 0}</p>
                  <p className="text-sm text-eco-sage">goals completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="eco-card p-5 scroll-reveal">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-heading font-bold text-eco-forest">Recent Activity</h3>
              <p className="text-sm text-eco-sage">Your latest carbon tracking actions and their impact.</p>
            </div>
            <button
              onClick={() => onNavigate('carbonlog')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-eco-green transition-colors hover:text-eco-forest"
            >
              View full history
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-eco-bg-alt">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Activity</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Emission Impact</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length > 0 ? recentActivity.map((entry) => (
                  <tr key={`${entry.date}-${entry.description}`} className="border-b border-eco-bg-alt/60 transition-colors hover:bg-eco-bg/50">
                    <td className="px-4 py-4 text-sm text-eco-forest">{entry.date}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-eco-bg px-3 py-1 text-xs font-semibold text-eco-forest">
                        {getCategoryIcon(entry.category)}
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-eco-forest">{entry.description}</td>
                    <td className="px-4 py-4 text-right text-sm font-bold text-eco-forest">{entry.emissionAmount} kg</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-eco-sage">
                      No activity yet. Log your first carbon entry to unlock the milestone 3 dashboard experience.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function getBadgeTone(code: string) {
  switch (code) {
    case 'green-commuter':
      return { bg: 'bg-sky-100', icon: 'text-sky-600' };
    case 'eco-warrior':
      return { bg: 'bg-amber-100', icon: 'text-amber-600' };
    case 'plant-based-pro':
      return { bg: 'bg-lime-100', icon: 'text-lime-600' };
    case 'renewable-master':
      return { bg: 'bg-yellow-100', icon: 'text-yellow-600' };
    case 'zero-waste-hero':
      return { bg: 'bg-emerald-100', icon: 'text-emerald-600' };
    case 'carbon-neutralist':
      return { bg: 'bg-violet-100', icon: 'text-violet-600' };
    case 'forest-guardian':
      return { bg: 'bg-green-100', icon: 'text-green-600' };
    case 'solar-sentinel':
      return { bg: 'bg-indigo-100', icon: 'text-indigo-600' };
    default:
      return { bg: 'bg-eco-bg-alt', icon: 'text-eco-green' };
  }
}
