import { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  UserCog, Filter, Table2, BarChart3, ChevronLeft, ChevronRight,
  Leaf, Utensils, MoreVertical, Plus, Car, Zap, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import type { User as UserType, View } from '../App';
import { useScrollReveal } from '../hooks/use-scroll-reveal';
import { fetchCarbonEntries, createCarbonEntry, deleteCarbonEntry } from '../lib/api';

interface CarbonLogProps {
  user: UserType;
  onNavigate: (view: View) => void;
}

export function CarbonLog({ user: _user, onNavigate }: CarbonLogProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ category: 'transport', activity: '', amount: '', notes: '' });
  const sectionRef = useScrollReveal<HTMLElement>();
  const perPage = 5;

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await fetchCarbonEntries();
      setEntries(data || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load carbon history.');
    }
    finally { setLoading(false); }
  };

  const filteredEntries = activeCategory === 'all'
    ? entries
    : entries.filter(e => e.category?.toLowerCase() === activeCategory);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / perPage));
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Trend data grouped by month
  const trendData = entries.reduce((acc: any[], e: any) => {
    const month = e.date?.substring(0, 7) || 'Unknown';
    const existing = acc.find(a => a.month === month);
    if (existing) existing.value += e.amount || 0;
    else acc.push({ month, value: e.amount || 0 });
    return acc;
  }, []).sort((a: any, b: any) => a.month.localeCompare(b.month)).slice(-6);

  const totalKg = entries.reduce((s, e) => s + (e.amount || 0), 0);

  const handleAddEntry = async () => {
    if (!newEntry.activity || !newEntry.amount) {
      toast.error('Please fill activity and amount');
      return;
    }
    try {
      await createCarbonEntry({
        category: newEntry.category,
        activity: newEntry.activity,
        amount: parseFloat(newEntry.amount),
        notes: newEntry.notes,
      });
      toast.success('Entry added!');
      setShowAddForm(false);
      setNewEntry({ category: 'transport', activity: '', amount: '', notes: '' });
      loadEntries();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add entry');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCarbonEntry(id);
      toast.success('Entry deleted');
      loadEntries();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const getCategoryIcon = (cat: string) => {
    const lc = (cat || '').toLowerCase();
    if (lc === 'transport') return <Car className="w-4 h-4 text-blue-600" />;
    if (lc === 'food') return <Utensils className="w-4 h-4 text-green-600" />;
    if (lc === 'energy') return <Zap className="w-4 h-4 text-yellow-600" />;
    return <Leaf className="w-4 h-4 text-eco-green" />;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (<div className="bg-eco-forest text-white text-xs px-3 py-1.5 rounded-lg shadow-lg"><p>{`${Math.round(payload[0].value * 10) / 10} kg CO₂e`}</p></div>);
    }
    return null;
  };

  if (loading) {
    return <section className="min-h-screen bg-eco-bg pt-20 pb-8 px-4 flex items-center justify-center"><div className="animate-pulse text-eco-sage">Loading...</div></section>;
  }

  return (
    <section ref={sectionRef} className="min-h-screen bg-eco-bg pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 scroll-reveal">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-eco-forest">Carbon History</h1>
            <p className="text-sm text-eco-sage mt-1">Analyze your environmental progress and historical log data.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2.5 bg-eco-green text-white rounded-xl text-sm font-medium hover:bg-[#2d6b47] transition-all">
              <Plus className="w-4 h-4" /> Add Entry
            </button>
            <button onClick={() => onNavigate('survey')} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[rgba(61,139,93,0.22)] rounded-xl text-sm font-medium text-eco-forest hover:shadow-md transition-all">
              <UserCog className="w-4 h-4" /> Update Profile
            </button>
          </div>
        </div>

        {error && (
          <div className="eco-card p-4 mb-6 border border-amber-200 bg-amber-50 text-sm text-amber-800 scroll-reveal">
            {error}
          </div>
        )}

        {/* Add Entry Form */}
        {showAddForm && (
          <div className="eco-card p-5 mb-6 scroll-reveal">
            <h3 className="text-lg font-heading font-bold text-eco-forest mb-4">Add Carbon Entry</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-eco-forest mb-1">Category</label>
                <select value={newEntry.category} onChange={e => setNewEntry({ ...newEntry, category: e.target.value })} className="eco-input">
                  <option value="transport">Transport</option>
                  <option value="food">Food</option>
                  <option value="energy">Energy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-forest mb-1">Activity</label>
                <input value={newEntry.activity} onChange={e => setNewEntry({ ...newEntry, activity: e.target.value })} placeholder="e.g. Commute to Office" className="eco-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-forest mb-1">Amount (kg CO2)</label>
                <input type="number" value={newEntry.amount} onChange={e => setNewEntry({ ...newEntry, amount: e.target.value })} placeholder="e.g. 12.5" className="eco-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-forest mb-1">Notes</label>
                <input value={newEntry.notes} onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })} placeholder="Optional notes" className="eco-input" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAddEntry} className="eco-button text-sm px-6">Save</button>
              <button onClick={() => setShowAddForm(false)} className="eco-button-outline text-sm px-6">Cancel</button>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 scroll-reveal">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-eco-sage mr-1" />
              {['all', 'transport', 'food', 'energy'].map((cat) => (
                <button key={cat} onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeCategory === cat ? 'bg-eco-green text-white' : 'text-eco-sage hover:bg-eco-bg-alt'}`}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center rounded-xl border border-[rgba(61,139,93,0.15)] overflow-hidden bg-white">
            <button onClick={() => setViewMode('table')} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-eco-green text-white' : 'text-eco-sage hover:bg-eco-bg-alt'}`}>
              <Table2 className="w-3.5 h-3.5" /> Table View
            </button>
            <button onClick={() => setViewMode('chart')} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'chart' ? 'bg-eco-green text-white' : 'text-eco-sage hover:bg-eco-bg-alt'}`}>
              <BarChart3 className="w-3.5 h-3.5" /> Trend Chart
            </button>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'table' ? (
          <div className="eco-card p-5 mb-6 scroll-reveal">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-heading font-bold text-eco-forest">Detailed Logs</h3>
                <p className="text-xs text-eco-sage">Showing {paginatedEntries.length} of {filteredEntries.length} total records</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-eco-bg-alt">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Date</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Category</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Activity</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Amount (kg)</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEntries.length > 0 ? paginatedEntries.map((entry: any) => (
                    <tr key={entry.id} className="border-b border-eco-bg-alt/50 hover:bg-eco-bg/50 transition-colors">
                      <td className="py-4 px-3 text-sm text-eco-forest font-medium">{entry.date}</td>
                      <td className="py-4 px-3"><span className="flex items-center gap-1.5">{getCategoryIcon(entry.category)}<span className="text-sm text-eco-forest capitalize">{entry.category}</span></span></td>
                      <td className="py-4 px-3 text-sm text-eco-forest">{entry.activity}</td>
                      <td className="py-4 px-3 text-sm font-bold text-eco-forest text-right">{Math.round(entry.amount * 10) / 10}</td>
                      <td className="py-4 px-3 text-right">
                        <button onClick={() => handleDelete(entry.id)} className="p-1 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-8 text-center text-sm text-eco-sage">No entries yet. Add a carbon entry or complete a survey.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-eco-bg-alt">
                <p className="text-xs text-eco-sage">Page {currentPage} of {totalPages}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className="p-1.5 rounded-lg hover:bg-eco-bg-alt transition-colors text-eco-sage"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className="p-1.5 rounded-lg hover:bg-eco-bg-alt transition-colors text-eco-sage"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="eco-card p-5 mb-6 scroll-reveal">
            <h3 className="text-lg font-heading font-bold text-eco-forest mb-1">Emission Trend</h3>
            <p className="text-xs text-eco-sage mb-4">Monthly emission trend over time</p>
            <div className="h-72 w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs><linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3D8B5D" stopOpacity={0.3} /><stop offset="95%" stopColor="#3D8B5D" stopOpacity={0.05} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9F3EB" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B8A76', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B8A76', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#3D8B5D" strokeWidth={2} fill="url(#historyGradient)" dot={{ r: 4, fill: '#3D8B5D', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#3D8B5D', strokeWidth: 2, stroke: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-eco-sage text-sm">No data to display</div>}
            </div>
          </div>
        )}

        {/* Summary Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 scroll-reveal">
          <div className="eco-card p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-eco-green/10 rounded-xl flex items-center justify-center flex-shrink-0"><Leaf className="w-5 h-5 text-eco-green" /></div>
            <div><p className="text-xs text-eco-sage font-medium uppercase tracking-wide">Total Tracked</p><p className="text-xl font-heading font-bold text-eco-forest">{Math.round(totalKg * 10) / 10} kg CO2e</p></div>
          </div>
          <div className="eco-card p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0"><Utensils className="w-5 h-5 text-orange-600" /></div>
            <div><p className="text-xs text-eco-sage font-medium uppercase tracking-wide">Total Entries</p><p className="text-xl font-heading font-bold text-eco-forest">{entries.length}</p></div>
          </div>
          <div className="eco-card p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-eco-bg-alt rounded-xl flex items-center justify-center flex-shrink-0"><MoreVertical className="w-5 h-5 text-eco-sage" /></div>
            <div><p className="text-xs text-eco-sage font-medium uppercase tracking-wide">Categories</p><p className="text-xl font-heading font-bold text-eco-forest">{new Set(entries.map(e => e.category)).size}</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
