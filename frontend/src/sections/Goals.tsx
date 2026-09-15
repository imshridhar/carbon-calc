import { type ReactNode, useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Check, ChevronLeft, Leaf, Plus, Share2, Target, TrendingUp, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import type { User as UserType, View } from '../App';
import { useScrollReveal } from '../hooks/use-scroll-reveal';
import {
  createGoal,
  deleteGoal,
  fetchCarbonEntries,
  fetchGoals,
  type CarbonEntryRecord,
  type GoalRecord,
  updateGoalProgress,
} from '../lib/api';

interface GoalsProps {
  user: UserType;
  onNavigate: (view: View) => void;
}

type GoalMode = 'detail' | 'create' | 'success';

interface GoalDraft {
  title: string;
  category: 'transport' | 'food' | 'energy' | 'waste' | 'global';
  targetPercentage: number;
  timeframeDays: number;
  recurrence: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONE_TIME';
  description: string;
  baselineAmount: number;
}

const emptyDraft: GoalDraft = {
  title: '',
  category: 'transport',
  targetPercentage: 15,
  timeframeDays: 30,
  recurrence: 'WEEKLY',
  description: '',
  baselineAmount: 80,
};

const categories = [
  { value: 'transport', label: 'Transport' },
  { value: 'food', label: 'Food & Diet' },
  { value: 'energy', label: 'Home Energy' },
  { value: 'waste', label: 'Waste' },
  { value: 'global', label: 'Global' },
] as const;

export function Goals({ user, onNavigate }: GoalsProps) {
  const sectionRef = useScrollReveal<HTMLElement>();
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [entries, setEntries] = useState<CarbonEntryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<GoalMode>('detail');
  const [draft, setDraft] = useState<GoalDraft>(emptyDraft);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [successGoal, setSuccessGoal] = useState<GoalRecord | null>(null);
  const [progressDraft, setProgressDraft] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalData, entryData] = await Promise.all([fetchGoals(), fetchCarbonEntries()]);
      setGoals(goalData);
      setEntries(entryData);
      const activeGoal = goalData.find((goal) => goal.status === 'ACTIVE') ?? goalData[0] ?? null;
      setSelectedGoalId(activeGoal?.id ?? null);
      setMode(activeGoal ? 'detail' : 'create');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load goals.');
    } finally {
      setLoading(false);
    }
  };

  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? goals[0] ?? null;
  const activeGoals = goals.filter((goal) => goal.status === 'ACTIVE');
  const completedGoals = goals.filter((goal) => goal.status === 'COMPLETED');
  const targetReduction = Math.round((draft.baselineAmount * draft.targetPercentage) / 10) / 10;
  const filteredEntries = selectedGoal
    ? entries.filter((entry) => selectedGoal.category === 'global' || normalizeCategory(entry.category) === selectedGoal.category).slice(0, 4)
    : [];

  const handleCreateGoal = async () => {
    if (!draft.title.trim()) {
      toast.error('Enter a goal title.');
      return;
    }

    try {
      const createdGoal = await createGoal({
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        baselineAmount: draft.baselineAmount,
        targetPercentage: draft.targetPercentage,
        targetAmount: targetReduction,
        timeframeDays: draft.timeframeDays,
        recurrence: draft.recurrence,
        estimatedSavings: targetReduction,
      });
      setSuccessGoal(createdGoal);
      setDraft(emptyDraft);
      setMode('success');
      const refreshedGoals = await fetchGoals();
      setGoals(refreshedGoals);
      setSelectedGoalId(createdGoal.id);
      toast.success('Goal created.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create goal.');
    }
  };

  const handleUpdate = async (value?: number) => {
    if (!selectedGoal) {
      return;
    }
    const progress = value ?? Number(progressDraft);
    if (Number.isNaN(progress)) {
      toast.error('Enter a valid progress value.');
      return;
    }
    try {
      const updated = await updateGoalProgress(selectedGoal.id, progress);
      setGoals((current) => current.map((goal) => (goal.id === updated.id ? updated : goal)));
      setProgressDraft('');
      toast.success(updated.status === 'COMPLETED' ? 'Goal completed.' : 'Progress updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update progress.');
    }
  };

  const handleDelete = async (goalId: number) => {
    try {
      await deleteGoal(goalId);
      await loadData();
      toast.success('Goal deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete goal.');
    }
  };

  if (loading) {
    return <section className="min-h-screen bg-eco-bg pt-24 pb-12 px-4 flex items-center justify-center"><div className="animate-pulse text-eco-sage">Loading goals...</div></section>;
  }

  return (
    <section ref={sectionRef} className="min-h-screen bg-eco-bg pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between scroll-reveal">
          <div className="flex items-center gap-4">
            <button onClick={() => (mode === 'detail' ? onNavigate('dashboard') : setMode(selectedGoal ? 'detail' : 'create'))} className="rounded-2xl bg-white p-3 text-eco-sage hover:bg-eco-bg-alt">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-heading font-bold text-eco-forest">{mode === 'create' ? 'Create New Goal' : mode === 'success' ? 'Goal Created Successfully' : 'Sustainability Goals'}</h1>
              <p className="mt-1 text-sm text-eco-sage">{mode === 'detail' ? `Welcome back, ${user?.name.split(' ')[0] ?? 'member'}. Track your current milestones.` : 'Milestone 3 goal flow with planning, progress, and follow-up actions.'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setMode('detail')} className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'detail' ? 'bg-eco-green text-white' : 'bg-white text-eco-sage'}`}>Active Goals</button>
            <button onClick={() => setMode('create')} className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'create' ? 'bg-eco-green text-white' : 'bg-white text-eco-sage'}`}>Create Goal</button>
          </div>
        </div>

        {error && <div className="eco-card mb-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 scroll-reveal">{error}</div>}

        {mode === 'create' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.45fr),320px] scroll-reveal">
            <div className="eco-card p-6">
              <div className="rounded-[28px] bg-[linear-gradient(135deg,_rgba(168,217,181,0.22),_rgba(255,255,255,0.98))] p-5">
                <h2 className="text-xl font-heading font-bold text-eco-forest">Set a New Sustainability Goal</h2>
                <p className="mt-2 text-sm text-eco-sage">Define a measurable target, choose a timeframe, and turn intent into a concrete reduction plan.</p>
              </div>

              <div className="mt-6 space-y-5">
                <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Bike to work 3 times a week" className="eco-input" />

                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {categories.map((category) => (
                    <button key={category.value} onClick={() => setDraft((current) => ({ ...current, category: category.value }))} className={`rounded-[24px] border px-3 py-4 text-sm font-semibold ${draft.category === category.value ? 'border-eco-green bg-[#eff8f1]' : 'border-[rgba(61,139,93,0.12)] bg-white'}`}>
                      {category.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm font-semibold text-eco-forest">
                      <span>Reduction Target</span>
                      <span className="text-eco-green">{draft.targetPercentage}%</span>
                    </div>
                    <input type="range" min={5} max={40} value={draft.targetPercentage} onChange={(event) => setDraft((current) => ({ ...current, targetPercentage: Number(event.target.value) }))} className="w-full accent-[#3D8B5D]" />
                    <p className="mt-2 text-xs text-eco-sage">{targetReduction} kg CO2e projected reduction</p>
                  </div>
                  <div>
                    <select value={draft.timeframeDays} onChange={(event) => setDraft((current) => ({ ...current, timeframeDays: Number(event.target.value) }))} className="eco-input">
                      <option value={7}>Next 7 Days</option>
                      <option value={30}>Next 30 Days</option>
                      <option value={60}>Next 60 Days</option>
                      <option value={90}>Next 90 Days</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <input type="number" value={draft.baselineAmount} onChange={(event) => setDraft((current) => ({ ...current, baselineAmount: Number(event.target.value) || 0 }))} className="eco-input" placeholder="Baseline footprint (kg CO2e)" />
                  <select value={draft.recurrence} onChange={(event) => setDraft((current) => ({ ...current, recurrence: event.target.value as GoalDraft['recurrence'] }))} className="eco-input">
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="ONE_TIME">One Time</option>
                  </select>
                </div>

                <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows={5} className="eco-input min-h-[140px] resize-y" placeholder="Describe the actions you plan to take." />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-eco-bg p-5">
                <p className="text-sm text-eco-forest">Estimated impact: <span className="font-semibold text-eco-green">{targetReduction} kg CO2e</span> over {draft.timeframeDays} days.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDraft(emptyDraft)} className="eco-button-outline px-5 py-3 text-sm">Clear</button>
                  <button onClick={() => void handleCreateGoal()} className="eco-button px-5 py-3 text-sm">Create Goal</button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="eco-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Goal Tips</p>
                <p className="mt-4 text-sm text-eco-sage">Make the target specific, measurable, and realistic. Weekly routines tend to be easier to sustain than vague intentions.</p>
              </div>
              <div className="eco-card bg-[linear-gradient(135deg,_rgba(168,217,181,0.18),_rgba(255,255,255,0.95))] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Carbon Insight</p>
                <p className="mt-3 text-sm text-eco-forest">Users who set a 30-day window and log progress weekly usually reach completion faster because the cadence stays visible.</p>
              </div>
            </div>
          </div>
        )}

        {mode === 'success' && successGoal && (
          <div className="mx-auto max-w-4xl scroll-reveal">
            <div className="eco-card px-6 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#7BC88D] shadow-[0_18px_45px_rgba(123,200,141,0.35)]">
                <Check className="h-12 w-12 text-white" />
              </div>
              <h2 className="mt-6 text-4xl font-heading font-bold text-eco-forest">Goal Created Successfully!</h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-eco-sage">You now have a concrete milestone to track, celebrate, and support with future logs.</p>
              <div className="mx-auto mt-8 max-w-3xl rounded-[28px] border border-[rgba(61,139,93,0.12)] bg-white p-6 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Goal Details</p>
                <p className="mt-2 text-2xl font-heading font-bold text-eco-forest">{successGoal.title}</p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <MiniInfo label="Target" value={`${successGoal.targetAmount} kg`} />
                  <MiniInfo label="Timeframe" value={`${successGoal.timeframeDays} Days`} />
                  <MiniInfo label="Category" value={formatCategoryLabel(successGoal.category)} />
                </div>
              </div>
              <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
                <ActionCard icon={<Plus className="h-5 w-5 text-eco-green" />} title="Log First Activity" body="Record the first action that supports this goal and start the trend line." />
                <ActionCard icon={<Share2 className="h-5 w-5 text-eco-green" />} title="Share with Friends" body="Use badges and leaderboard progress to keep accountability visible." />
              </div>
              <div className="mt-8 flex flex-col items-center gap-3">
                <button onClick={() => onNavigate('dashboard')} className="eco-button min-w-[260px] justify-center">Return to Dashboard</button>
                <button onClick={() => setMode('create')} className="text-sm font-semibold text-eco-sage hover:text-eco-forest">Create another goal</button>
              </div>
            </div>
          </div>
        )}

        {mode === 'detail' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.55fr),340px] scroll-reveal">
            <div className="space-y-6">
              {selectedGoal ? (
                <>
                  <div className="eco-card p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-eco-sage">{formatCategoryLabel(selectedGoal.category)}</p>
                        <h2 className="mt-2 text-3xl font-heading font-bold text-eco-forest">{selectedGoal.title}</h2>
                        <p className="mt-3 max-w-2xl text-sm text-eco-sage">{selectedGoal.description || 'This goal is tracking a measurable carbon reduction milestone over time.'}</p>
                      </div>
                      <button onClick={() => setMode('create')} className="eco-button-outline px-4 py-3 text-sm">New Goal</button>
                    </div>
                    <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[220px,minmax(0,1fr)]">
                      <div className="rounded-[30px] bg-[radial-gradient(circle_at_top,_rgba(123,200,141,0.24),_rgba(255,255,255,0.95)_68%)] p-5 text-center">
                        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full" style={{ background: `conic-gradient(#3D8B5D ${selectedGoal.progressPercentage}%, rgba(61,139,93,0.12) 0)` }}>
                          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                            <span className="text-3xl font-heading font-bold text-eco-forest">{selectedGoal.progressPercentage}%</span>
                            <span className="text-xs text-eco-sage">complete</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <MetricCard icon={<TrendingUp className="w-5 h-5 text-eco-green" />} label="Current progress" value={`${selectedGoal.currentProgress} kg`} hint="Saved so far" />
                        <MetricCard icon={<Target className="w-5 h-5 text-eco-green" />} label="Target reduction" value={`${selectedGoal.targetAmount} kg`} hint={`${selectedGoal.targetPercentage}% of baseline`} />
                        <MetricCard icon={<Trophy className="w-5 h-5 text-eco-green" />} label="Days remaining" value={`${selectedGoal.daysRemaining}`} hint={selectedGoal.timeframeLabel} />
                      </div>
                    </div>
                  </div>

                  <div className="eco-card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-heading font-bold text-eco-forest">Accumulated Carbon Savings</h3>
                        <p className="text-sm text-eco-sage">Estimated progress curve across the current goal timeline.</p>
                      </div>
                    </div>
                    <div className="mt-5 h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={buildGoalTrend(selectedGoal)} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                          <defs><linearGradient id="goalProgressGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7BC88D" stopOpacity={0.4} /><stop offset="95%" stopColor="#7BC88D" stopOpacity={0.05} /></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4F0E7" />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6B8A76', fontSize: 11 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B8A76', fontSize: 11 }} />
                          <Tooltip content={<GoalTooltip />} />
                          <Area type="monotone" dataKey="value" stroke="#3D8B5D" strokeWidth={2.5} fill="url(#goalProgressGradient)" dot={false} activeDot={{ r: 5, fill: '#3D8B5D', strokeWidth: 2, stroke: '#fff' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <div className="eco-card p-10 text-center">
                  <Target className="mx-auto h-12 w-12 text-eco-sage" />
                  <h2 className="mt-4 text-2xl font-heading font-bold text-eco-forest">No active goals yet</h2>
                  <p className="mt-2 text-sm text-eco-sage">Create one to unlock the full milestone 3 goal tracking flow.</p>
                  <button onClick={() => setMode('create')} className="eco-button mt-6">Set your first goal</button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="eco-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Goal Tracker</p>
                    <h3 className="mt-2 text-xl font-heading font-bold text-eco-forest">Active goals</h3>
                  </div>
                  <span className="rounded-full bg-eco-bg px-3 py-1 text-xs font-semibold text-eco-green">{activeGoals.length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {activeGoals.length > 0 ? activeGoals.map((goal) => (
                    <button key={goal.id} onClick={() => setSelectedGoalId(goal.id)} className={`w-full rounded-[24px] border p-4 text-left ${selectedGoal?.id === goal.id ? 'border-eco-green bg-[#eff8f1]' : 'border-[rgba(61,139,93,0.12)] bg-white'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-eco-forest">{goal.title}</p>
                          <p className="mt-1 text-xs text-eco-sage">{goal.timeframeLabel}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-eco-green">{goal.progressPercentage}%</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/80"><div className="h-full rounded-full bg-eco-green" style={{ width: `${goal.progressPercentage}%` }} /></div>
                    </button>
                  )) : <p className="rounded-[24px] bg-eco-bg p-4 text-sm text-eco-sage">No active goals available.</p>}
                </div>
              </div>

              {selectedGoal && (
                <>
                  <div className="eco-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Recent Activity</p>
                    <div className="mt-4 space-y-3">
                      {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
                        <div key={entry.id} className="rounded-[22px] bg-eco-bg p-4">
                          <p className="text-sm font-semibold text-eco-forest">{entry.activity}</p>
                          <div className="mt-1 flex items-center justify-between text-xs text-eco-sage">
                            <span>{entry.date}</span>
                            <span>{Math.round(entry.amount * 10) / 10} kg</span>
                          </div>
                        </div>
                      )) : <p className="rounded-[22px] bg-eco-bg p-4 text-sm text-eco-sage">No related activity yet. Log supporting actions from the carbon history page.</p>}
                    </div>
                  </div>

                  <div className="eco-card p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-[#eef8f0] p-3"><Leaf className="h-5 w-5 text-eco-green" /></div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Quick Facts</p>
                        <p className="text-sm font-semibold text-eco-forest">{formatRecurrence(selectedGoal.recurrence)} cadence</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <MiniInfo label="Baseline" value={`${selectedGoal.baselineAmount} kg`} />
                      <MiniInfo label="Remaining" value={`${selectedGoal.remainingAmount} kg`} />
                    </div>
                  </div>

                  <div className="eco-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Update Progress</p>
                    <div className="mt-4 flex gap-3">
                      <input type="number" value={progressDraft} onChange={(event) => setProgressDraft(event.target.value)} className="eco-input" placeholder="e.g. 12.4" />
                      <button onClick={() => void handleUpdate()} className="eco-button px-5 py-3 text-sm">Save</button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button onClick={() => void handleUpdate(selectedGoal.targetAmount)} className="text-sm font-semibold text-eco-green hover:text-eco-forest">Mark as completed</button>
                      <button onClick={() => void handleDelete(selectedGoal.id)} className="text-sm font-semibold text-red-500 hover:text-red-700">Delete goal</button>
                    </div>
                  </div>
                </>
              )}

              {completedGoals.length > 0 && (
                <div className="eco-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-eco-sage">Completed</p>
                  <div className="mt-4 space-y-3">
                    {completedGoals.slice(0, 3).map((goal) => (
                      <div key={goal.id} className="rounded-[22px] bg-eco-bg p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-eco-forest">{goal.title}</p>
                          <Check className="h-4 w-4 text-eco-green" />
                        </div>
                        <p className="mt-1 text-xs text-eco-sage">{goal.targetAmount} kg saved over {goal.timeframeDays} days</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return <div className="rounded-[26px] bg-eco-bg p-5"><div className="flex items-center gap-3"><div className="rounded-2xl bg-white p-3">{icon}</div><p className="text-sm font-semibold text-eco-forest">{label}</p></div><p className="mt-5 text-2xl font-heading font-bold text-eco-forest">{value}</p><p className="mt-1 text-xs text-eco-sage">{hint}</p></div>;
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[20px] bg-eco-bg p-4"><p className="text-xs uppercase tracking-[0.2em] text-eco-sage">{label}</p><p className="mt-2 font-semibold text-eco-forest">{value}</p></div>;
}

function ActionCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <div className="rounded-[28px] border border-[rgba(61,139,93,0.12)] bg-white p-5 text-left">{icon}<p className="mt-4 text-lg font-heading font-bold text-eco-forest">{title}</p><p className="mt-2 text-sm text-eco-sage">{body}</p></div>;
}

function GoalTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl bg-eco-forest px-3 py-2 text-xs text-white shadow-xl"><p>{label}</p><p>{Math.round(payload[0].value * 10) / 10} kg CO2e saved</p></div>;
}

function buildGoalTrend(goal: GoalRecord | null) {
  if (!goal) return [];
  return ['Start', 'Week 2', 'Week 4', 'Week 6', 'Week 8', 'Now'].map((label, index, all) => {
    const factor = index / Math.max(all.length - 1, 1);
    const value = factor < 0.6 ? goal.currentProgress * (factor * 1.15) : goal.currentProgress * (0.7 + (factor - 0.6) * 0.75);
    return { label, value: Math.round(Math.min(value, goal.currentProgress) * 10) / 10 };
  });
}

function normalizeCategory(category: string) {
  switch (category.toLowerCase()) {
    case 'food & diet': return 'food';
    case 'home energy':
    case 'energy usage': return 'energy';
    default: return category.toLowerCase();
  }
}

function formatCategoryLabel(category: string) {
  switch (category) {
    case 'food': return 'Food & Diet';
    case 'energy': return 'Home Energy';
    case 'waste': return 'Waste';
    case 'global': return 'Global';
    default: return 'Transport';
  }
}

function formatRecurrence(recurrence: string) {
  return recurrence.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
