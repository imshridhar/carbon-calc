import { useEffect, useState } from 'react';
import {
  Users,
  BarChart3,
  Award,
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  TrendingUp,
  Leaf,
  Activity,
  ChevronLeft,
  Store,
  Receipt,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import type { User as UserType, View } from '../App';
import { useScrollReveal } from '../hooks/use-scroll-reveal';
import {
  changeUserRole,
  createAdminBadge,
  createMarketplaceItem,
  deleteAdminBadge,
  deleteMarketplaceItem,
  fetchAdminAnalytics,
  fetchAdminBadges,
  fetchAdminUsers,
  fetchAllTransactions,
  fetchMarketplace,
  updateMarketplaceItem,
} from '../lib/api';

interface AdminPanelProps {
  user: UserType;
  onNavigate: (view: View) => void;
}

type AdminTab = 'analytics' | 'users' | 'badges' | 'marketplace' | 'transactions';

const emptyMarketplaceForm = {
  itemName: '',
  itemType: 'tree_planting',
  price: '',
  description: '',
  carbonOffsetValue: '',
};

export function AdminPanel({ user: _user, onNavigate }: AdminPanelProps) {
  const sectionRef = useScrollReveal<HTMLElement>();
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    icon: 'Award',
    category: 'general',
    thresholdKg: '',
  });

  const [marketplaceForm, setMarketplaceForm] = useState(emptyMarketplaceForm);
  const [editingMarketplaceId, setEditingMarketplaceId] = useState<number | null>(null);

  useEffect(() => {
    void loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        setAnalytics(await fetchAdminAnalytics());
      } else if (activeTab === 'users') {
        setUsers((await fetchAdminUsers()) || []);
      } else if (activeTab === 'badges') {
        setBadges((await fetchAdminBadges()) || []);
      } else if (activeTab === 'marketplace') {
        setMarketplaceItems((await fetchMarketplace()) || []);
      } else {
        setTransactions((await fetchAllTransactions()) || []);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await changeUserRole(userId, newRole);
      toast.success(`Role changed to ${newRole}`);
      await loadTabData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to change role');
    }
  };

  const handleCreateBadge = async () => {
    const threshold = parseFloat(newBadge.thresholdKg);
    if (!newBadge.name || !newBadge.description || Number.isNaN(threshold) || threshold <= 0) {
      toast.error('Name, description, and a positive threshold are required');
      return;
    }

    try {
      await createAdminBadge({
        name: newBadge.name,
        description: newBadge.description,
        icon: newBadge.icon,
        category: newBadge.category,
        thresholdKg: threshold,
      });
      toast.success('Badge created');
      setShowBadgeForm(false);
      setNewBadge({ name: '', description: '', icon: 'Award', category: 'general', thresholdKg: '' });
      await loadTabData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create badge');
    }
  };

  const handleDeleteBadge = async (id: number) => {
    try {
      await deleteAdminBadge(id);
      toast.success('Badge deleted');
      await loadTabData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete badge');
    }
  };

  const handleMarketplaceSubmit = async () => {
    if (!marketplaceForm.itemName || !marketplaceForm.price || !marketplaceForm.description) {
      toast.error('Item name, price, and description are required');
      return;
    }

    const payload = {
      itemName: marketplaceForm.itemName,
      itemType: marketplaceForm.itemType,
      price: parseFloat(marketplaceForm.price),
      description: marketplaceForm.description,
      carbonOffsetValue: parseFloat(marketplaceForm.carbonOffsetValue || '0'),
    };

    try {
      if (editingMarketplaceId) {
        await updateMarketplaceItem(editingMarketplaceId, payload);
        toast.success('Marketplace item updated');
      } else {
        await createMarketplaceItem(payload);
        toast.success('Marketplace item created');
      }
      setMarketplaceForm(emptyMarketplaceForm);
      setEditingMarketplaceId(null);
      await loadTabData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save marketplace item');
    }
  };

  const handleEditMarketplace = (item: any) => {
    setEditingMarketplaceId(item.id);
    setMarketplaceForm({
      itemName: item.itemName,
      itemType: item.itemType,
      price: String(item.price),
      description: item.description,
      carbonOffsetValue: String(item.carbonOffsetValue ?? 0),
    });
  };

  const handleDeleteMarketplace = async (id: number) => {
    try {
      await deleteMarketplaceItem(id);
      toast.success('Marketplace item deleted');
      await loadTabData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete marketplace item');
    }
  };

  const tabs = [
    { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { key: 'users' as const, label: 'Users', icon: Users },
    { key: 'badges' as const, label: 'Badges', icon: Award },
    { key: 'marketplace' as const, label: 'Marketplace', icon: Store },
    { key: 'transactions' as const, label: 'Transactions', icon: Receipt },
  ];

  return (
    <section ref={sectionRef} className="min-h-screen bg-eco-bg pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6 scroll-reveal">
          <button onClick={() => onNavigate('dashboard')} className="p-2 hover:bg-white rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6 text-eco-sage" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-eco-green" />
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-eco-forest">Admin Panel</h1>
            </div>
            <p className="text-sm text-eco-sage mt-1">Manage users, badges, marketplace items, and transactions.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 scroll-reveal">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-eco-green text-white shadow-md' : 'bg-white text-eco-sage hover:bg-eco-bg-alt border border-[rgba(61,139,93,0.15)]'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="eco-card p-4 mb-6 border border-amber-200 bg-amber-50 text-sm text-amber-800 scroll-reveal">
            {error}
          </div>
        )}

        {loading ? (
          <div className="eco-card p-12 text-center">
            <div className="animate-pulse text-eco-sage">Loading...</div>
          </div>
        ) : (
          <>
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6 scroll-reveal">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="eco-card p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-eco-sage font-medium uppercase tracking-wide">Total Users</p>
                        <p className="text-2xl font-heading font-bold text-eco-forest">{analytics.totalUsers ?? 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="eco-card p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
                        <Activity className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-eco-sage font-medium uppercase tracking-wide">Active Users</p>
                        <p className="text-2xl font-heading font-bold text-eco-forest">{analytics.activeUsers ?? 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="eco-card p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-eco-green/10 rounded-xl flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-eco-green" />
                      </div>
                      <div>
                        <p className="text-xs text-eco-sage font-medium uppercase tracking-wide">Total CO2</p>
                        <p className="text-2xl font-heading font-bold text-eco-forest">{analytics.totalCo2Kg ?? analytics.totalCarbonKg ?? 0} kg</p>
                      </div>
                    </div>
                  </div>
                  <div className="eco-card p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-eco-sage font-medium uppercase tracking-wide">Avg/User</p>
                        <p className="text-2xl font-heading font-bold text-eco-forest">{analytics.avgCo2PerUser ?? analytics.avgCarbonPerUser ?? 0} kg</p>
                      </div>
                    </div>
                  </div>
                </div>

                {analytics.categoryBreakdown && (
                  <div className="eco-card p-6">
                    <h3 className="text-lg font-heading font-bold text-eco-forest mb-4">Category Breakdown</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.categoryBreakdown).map(([category, kg]) => {
                        const total = Object.values(analytics.categoryBreakdown).reduce((sum: number, value: any) => sum + value, 0) || 1;
                        const percentage = Math.round(((kg as number) / (total as number)) * 100);
                        return (
                          <div key={category}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-eco-forest capitalize">{category}</span>
                              <span className="text-sm text-eco-sage">{kg as number} kg ({percentage}%)</span>
                            </div>
                            <div className="h-2 bg-eco-bg-alt rounded-full overflow-hidden">
                              <div className="h-full bg-eco-green rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="eco-card p-6 scroll-reveal">
                <h3 className="text-lg font-heading font-bold text-eco-forest mb-4">User Management</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-eco-bg-alt">
                        <th className="text-left py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Name</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Email</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Role</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Status</th>
                        <th className="text-right py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((entry: any) => (
                        <tr key={entry.id} className="border-b border-eco-bg-alt/50 hover:bg-eco-bg/50 transition-colors">
                          <td className="py-3 px-3 text-sm font-medium text-eco-forest">{entry.name}</td>
                          <td className="py-3 px-3 text-sm text-eco-sage">{entry.email}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${entry.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-eco-bg-alt text-eco-forest'}`}>
                              {entry.role}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${entry.enabled ? 'bg-eco-success/20 text-eco-success' : 'bg-red-100 text-red-600'}`}>
                              {entry.enabled ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleChangeRole(entry.id, entry.role)}
                              className="flex items-center gap-1 ml-auto text-sm text-eco-green hover:text-eco-forest font-medium transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              {entry.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'badges' && (
              <div className="space-y-6 scroll-reveal">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowBadgeForm((value) => !value)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-eco-green text-white rounded-xl text-sm font-medium hover:bg-[#2d6b47] transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create Badge
                  </button>
                </div>

                {showBadgeForm && (
                  <div className="eco-card p-6">
                    <h3 className="text-lg font-heading font-bold text-eco-forest mb-4">Create New Badge</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input value={newBadge.name} onChange={(event) => setNewBadge({ ...newBadge, name: event.target.value })} placeholder="Badge name" className="eco-input" />
                      <select value={newBadge.category} onChange={(event) => setNewBadge({ ...newBadge, category: event.target.value })} className="eco-input">
                        <option value="general">General</option>
                        <option value="transport">Transport</option>
                        <option value="food">Food</option>
                        <option value="energy">Energy</option>
                      </select>
                      <input value={newBadge.description} onChange={(event) => setNewBadge({ ...newBadge, description: event.target.value })} placeholder="Description" className="eco-input sm:col-span-2" />
                      <select value={newBadge.icon} onChange={(event) => setNewBadge({ ...newBadge, icon: event.target.value })} className="eco-input">
                        <option value="Award">Award</option>
                        <option value="Leaf">Leaf</option>
                        <option value="Trophy">Trophy</option>
                        <option value="Shield">Shield</option>
                      </select>
                      <input type="number" min="0.1" step="0.1" value={newBadge.thresholdKg} onChange={(event) => setNewBadge({ ...newBadge, thresholdKg: event.target.value })} placeholder="Threshold kg" className="eco-input" />
                    </div>
                    <p className="mt-3 text-xs text-eco-sage">Custom badges unlock from tracked kilograms in the selected category.</p>
                    <div className="flex gap-3 mt-4">
                      <button onClick={handleCreateBadge} className="eco-button text-sm px-6">Create</button>
                      <button onClick={() => setShowBadgeForm(false)} className="eco-button-outline text-sm px-6">Cancel</button>
                    </div>
                  </div>
                )}

                <div className="eco-card p-6">
                  <h3 className="text-lg font-heading font-bold text-eco-forest mb-4">All Badges</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {badges.map((badge: any) => (
                      <div key={badge.id} className="flex items-start gap-4 p-4 bg-eco-bg rounded-xl">
                        <div className="w-12 h-12 bg-eco-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6 text-eco-green" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-eco-forest">{badge.name}</h4>
                          <p className="text-xs text-eco-sage mt-0.5">{badge.description}</p>
                          <p className="text-[11px] text-eco-sage mt-2 capitalize">{badge.category} threshold: {badge.thresholdKg} kg</p>
                        </div>
                        <button onClick={() => handleDeleteBadge(badge.id)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6 scroll-reveal">
                <div className="eco-card p-6">
                  <h3 className="text-lg font-heading font-bold text-eco-forest mb-4">
                    {editingMarketplaceId ? 'Edit Marketplace Item' : 'Add Marketplace Item'}
                  </h3>
                  <div className="space-y-4">
                    <input value={marketplaceForm.itemName} onChange={(event) => setMarketplaceForm({ ...marketplaceForm, itemName: event.target.value })} placeholder="Item name" className="eco-input" />
                    <select value={marketplaceForm.itemType} onChange={(event) => setMarketplaceForm({ ...marketplaceForm, itemType: event.target.value })} className="eco-input">
                      <option value="tree_planting">Tree Planting</option>
                      <option value="carbon_credit">Carbon Credit</option>
                      <option value="renewable_energy">Renewable Energy</option>
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" value={marketplaceForm.price} onChange={(event) => setMarketplaceForm({ ...marketplaceForm, price: event.target.value })} placeholder="Price" className="eco-input" />
                      <input type="number" value={marketplaceForm.carbonOffsetValue} onChange={(event) => setMarketplaceForm({ ...marketplaceForm, carbonOffsetValue: event.target.value })} placeholder="Offset kg" className="eco-input" />
                    </div>
                    <textarea value={marketplaceForm.description} onChange={(event) => setMarketplaceForm({ ...marketplaceForm, description: event.target.value })} placeholder="Description" className="eco-input min-h-28" />
                    <div className="flex gap-3">
                      <button onClick={handleMarketplaceSubmit} className="eco-button text-sm px-6">
                        {editingMarketplaceId ? 'Update Item' : 'Create Item'}
                      </button>
                      <button
                        onClick={() => {
                          setMarketplaceForm(emptyMarketplaceForm);
                          setEditingMarketplaceId(null);
                        }}
                        className="eco-button-outline text-sm px-6"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                <div className="eco-card p-6">
                  <h3 className="text-lg font-heading font-bold text-eco-forest mb-4">Marketplace Inventory</h3>
                  <div className="space-y-3">
                    {marketplaceItems.map((item: any) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl bg-eco-bg-alt/60">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-eco-forest">{item.itemName}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white text-eco-sage capitalize">
                              {item.itemType.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-eco-sage mt-2">{item.description}</p>
                          <p className="text-xs text-eco-sage mt-2">Offset {item.carbonOffsetValue} kg CO2e</p>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                          <p className="text-lg font-heading font-bold text-eco-green">₹{item.price}</p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEditMarketplace(item)} className="p-2 rounded-lg hover:bg-white transition-colors">
                              <Pencil className="w-4 h-4 text-eco-green" />
                            </button>
                            <button onClick={() => handleDeleteMarketplace(item.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="eco-card p-6 scroll-reveal">
                <h3 className="text-lg font-heading font-bold text-eco-forest mb-4">Transaction Monitoring</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-eco-bg-alt">
                        <th className="text-left py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">User</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Item</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Type</th>
                        <th className="text-right py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Amount</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Status</th>
                        <th className="text-right py-3 px-3 text-xs font-semibold text-eco-sage uppercase tracking-wide">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction: any) => (
                        <tr key={transaction.id} className="border-b border-eco-bg-alt/50 hover:bg-eco-bg/50 transition-colors">
                          <td className="py-3 px-3 text-sm font-medium text-eco-forest">{transaction.userName}</td>
                          <td className="py-3 px-3 text-sm text-eco-forest">{transaction.itemName}</td>
                          <td className="py-3 px-3 text-sm text-eco-sage capitalize">{transaction.itemType.replace('_', ' ')}</td>
                          <td className="py-3 px-3 text-sm font-semibold text-eco-green text-right">₹{transaction.amount}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-eco-success/20 text-eco-success">
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-sm text-eco-sage text-right">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-sm text-eco-sage">No transactions found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
