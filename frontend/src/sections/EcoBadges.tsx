import { type ReactNode, useEffect, useState } from 'react';
import {
  Award,
  Car,
  ChevronLeft,
  Leaf,
  Shield,
  ShieldCheck,
  Sparkles,
  TreePine,
  Trophy,
  Utensils,
  Wind,
  Zap,
} from 'lucide-react';
import type { User as UserType, View } from '../App';
import { useScrollReveal } from '../hooks/use-scroll-reveal';
import { fetchBadges, type BadgeRecord } from '../lib/api';

interface EcoBadgesProps {
  user: UserType;
  onNavigate: (view: View) => void;
}

type BadgeFilter = 'all' | 'earned' | 'progress';

const iconMap = {
  Award,
  Car,
  Leaf,
  Shield,
  ShieldCheck,
  Sparkles,
  TreePine,
  Trophy,
  Utensils,
  Wind,
  Zap,
} as const;

export function EcoBadges({ user: _user, onNavigate }: EcoBadgesProps) {
  const sectionRef = useScrollReveal<HTMLElement>();
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<BadgeFilter>('all');

  useEffect(() => {
    void loadBadges();
  }, []);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const data = await fetchBadges();
      setBadges(data ?? []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load badges.');
    } finally {
      setLoading(false);
    }
  };

  const earnedBadges = badges.filter((badge) => badge.earned);
  const inProgressBadges = badges.filter((badge) => !badge.earned);
  const visibleBadges = filter === 'earned' ? earnedBadges : filter === 'progress' ? inProgressBadges : badges;
  const nextBadge = inProgressBadges.sort((left, right) => right.progress - left.progress)[0];
  const totalEcoPoints = earnedBadges.length * 45 + inProgressBadges.reduce((sum, badge) => sum + Math.round(badge.progress / 4), 0);

  if (loading) {
    return <section className="min-h-screen bg-eco-bg pt-24 pb-12 px-4 flex items-center justify-center"><div className="animate-pulse text-eco-sage">Loading badges...</div></section>;
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
              <h1 className="text-3xl font-heading font-bold text-eco-forest">Badges Gallery</h1>
              <p className="mt-1 text-sm text-eco-sage">Showcase of your sustainability milestones and upcoming achievements.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All Badges</FilterButton>
            <FilterButton active={filter === 'earned'} onClick={() => setFilter('earned')}>Earned</FilterButton>
            <FilterButton active={filter === 'progress'} onClick={() => setFilter('progress')}>In Progress</FilterButton>
          </div>
        </div>

        {error && <div className="eco-card mb-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 scroll-reveal">{error}</div>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.65fr),320px] scroll-reveal">
          <div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleBadges.map((badge) => {
                const Icon = iconMap[badge.iconName as keyof typeof iconMap] ?? Award;
                const tone = getBadgeTone(badge.code);
                return (
                  <div key={badge.code} className={`eco-card p-5 transition-all ${badge.earned ? 'hover:-translate-y-1 hover:shadow-eco' : 'opacity-95'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className={`rounded-[22px] ${tone.bg} p-4`}>
                        <Icon className={`h-7 w-7 ${tone.icon}`} />
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.earned ? 'bg-[#eff8f1] text-eco-green' : 'bg-eco-bg text-eco-sage'}`}>
                        {badge.statusLabel}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-heading font-bold text-eco-forest">{badge.name}</h3>
                    <p className="mt-2 text-sm text-eco-sage">{badge.description}</p>
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-eco-sage uppercase tracking-[0.2em]">{badge.category}</span>
                        <span className="font-semibold text-eco-forest">{badge.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-eco-bg-alt">
                        <div className="h-full rounded-full bg-eco-green" style={{ width: `${badge.progress}%` }} />
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-eco-sage">
                      {badge.earned ? 'Unlocked and counting toward your eco reputation.' : badge.progressLabel ?? `${badge.current} / ${badge.target} target progress`}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="eco-card mt-6 p-6 text-center">
              <h3 className="text-2xl font-heading font-bold text-eco-forest">Ready to earn your next badge?</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-eco-sage">Set a new sustainability goal or log a supporting activity today. The fastest path to badge progress is a clear milestone plus consistent entries.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button onClick={() => onNavigate('goals')} className="eco-button px-6 py-3 text-sm">Add New Goal</button>
                <button onClick={() => onNavigate('dashboard')} className="eco-button-outline px-6 py-3 text-sm">Back to Dashboard</button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="eco-card bg-[linear-gradient(135deg,_rgba(168,217,181,0.18),_rgba(255,255,255,0.95))] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">How it Works</p>
              <ol className="mt-4 space-y-3 text-sm text-eco-sage">
                <li>Track daily activities in transport, food, and energy.</li>
                <li>Complete goals or offset emissions to unlock milestone badges.</li>
                <li>Each earned badge boosts your profile and leaderboard presence.</li>
              </ol>
            </div>

            <div className="eco-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Your Progress</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-heading font-bold text-eco-forest">{earnedBadges.length}</p>
                  <p className="text-sm text-eco-sage">badges earned</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-heading font-bold text-eco-green">{totalEcoPoints}</p>
                  <p className="text-sm text-eco-sage">eco points</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-eco-bg-alt">
                <div className="h-full rounded-full bg-eco-green" style={{ width: `${badges.length ? (earnedBadges.length / badges.length) * 100 : 0}%` }} />
              </div>
              <p className="mt-2 text-xs text-eco-sage">Next rank: Eco Master</p>
            </div>

            <div className="eco-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Weekly Challenge</p>
              {nextBadge ? (
                <>
                  <p className="mt-3 text-lg font-heading font-bold text-eco-forest">{nextBadge.name}</p>
                  <p className="mt-2 text-sm text-eco-sage">{nextBadge.description}</p>
                  <p className="mt-3 text-sm font-semibold text-eco-green">{nextBadge.progress}% complete</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-eco-sage">You are caught up. Create a new goal to unlock more progress opportunities.</p>
              )}
            </div>
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

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? 'bg-eco-green text-white' : 'bg-white text-eco-sage hover:bg-eco-bg-alt'}`}
    >
      {children}
    </button>
  );
}
