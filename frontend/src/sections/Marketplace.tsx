import { useEffect, useState } from 'react';
import { ChevronLeft, Store, Leaf, Receipt, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { User as UserType, View } from '../App';
import { useScrollReveal } from '../hooks/use-scroll-reveal';
import { fetchMarketplace, fetchTransactions, purchaseMarketplaceItem } from '../lib/api';

interface MarketplaceProps {
  user: UserType;
  onNavigate: (view: View) => void;
}

export function Marketplace({ user, onNavigate }: MarketplaceProps) {
  const sectionRef = useScrollReveal<HTMLElement>();
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<any>(null);

  useEffect(() => {
    void loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    try {
      const [marketplaceItems, purchaseHistory] = await Promise.all([
        fetchMarketplace(),
        fetchTransactions(user.id),
      ]);

      setItems(marketplaceItems || []);
      setTransactions(purchaseHistory || []);
      setSelectedItem((current: any) => current ?? marketplaceItems?.[0] ?? null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load marketplace data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedItem) {
      return;
    }

    setPurchasing(true);
    try {
      const result = await purchaseMarketplaceItem(selectedItem.id);
      setConfirmation(result);
      toast.success('Purchase successful');
      await loadMarketplace();
    } catch (err: any) {
      toast.error(err.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-eco-bg pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="animate-pulse text-eco-sage">Loading marketplace...</div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="min-h-screen bg-eco-bg pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6 scroll-reveal">
          <button onClick={() => onNavigate('dashboard')} className="p-2 hover:bg-white rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6 text-eco-sage" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-eco-forest">Eco Marketplace</h1>
            <p className="text-sm text-eco-sage">Offset your footprint through verified eco-friendly actions.</p>
          </div>
        </div>

        {error && (
          <div className="eco-card p-4 mb-6 border border-amber-200 bg-amber-50 text-sm text-amber-800 scroll-reveal">
            {error}
          </div>
        )}

        {confirmation && (
          <div className="eco-card p-6 mb-6 scroll-reveal border border-eco-green/20 bg-gradient-to-r from-eco-green/5 to-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-eco-green/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-eco-green" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-heading font-bold text-eco-forest">Purchase Successful</h2>
                <p className="text-sm text-eco-sage mt-1">
                  Item: {confirmation.itemName} • Amount: ₹{confirmation.amount}
                </p>
                <p className="text-sm text-eco-sage mt-2">Thank you for supporting sustainability.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-6">
            <div className="eco-card p-6 scroll-reveal">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-heading font-bold text-eco-forest">Available Initiatives</h2>
                  <p className="text-sm text-eco-sage">Browse programs and choose the impact you want to support.</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-eco-green/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-eco-green" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`text-left p-5 rounded-2xl border transition-all ${selectedItem?.id === item.id ? 'border-eco-green shadow-eco bg-white' : 'border-[rgba(61,139,93,0.12)] hover:border-eco-green/40 bg-eco-bg-alt/40'}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-eco-green/10 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-eco-green" />
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-eco-bg-alt text-eco-forest capitalize">
                        {item.itemType.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-eco-forest">{item.itemName}</h3>
                    <p className="text-sm text-eco-sage mt-2 line-clamp-3">{item.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <p className="text-xs text-eco-sage uppercase tracking-wide">Offset</p>
                        <p className="text-base font-semibold text-eco-forest">{item.carbonOffsetValue} kg CO2e</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-eco-sage uppercase tracking-wide">Price</p>
                        <p className="text-xl font-heading font-bold text-eco-green">₹{item.price}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="eco-card p-6 scroll-reveal">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-bold text-eco-forest">Purchase History</h2>
                  <p className="text-sm text-eco-sage">Track your past offset contributions.</p>
                </div>
              </div>

              <div className="space-y-3">
                {transactions.length > 0 ? transactions.map((transaction) => (
                  <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-eco-bg-alt/60">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-eco-forest">{transaction.itemName}</p>
                      <p className="text-xs text-eco-sage mt-1">
                        Offset: {transaction.carbonOffsetValue} kg CO2e • Status: {transaction.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-eco-green">₹{transaction.amount}</p>
                      <p className="text-xs text-eco-sage">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )) : (
                  <div className="p-6 rounded-xl bg-eco-bg-alt/50 text-center text-sm text-eco-sage">
                    No purchases yet. Pick an item above to make your first offset contribution.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="eco-card p-6 h-fit scroll-reveal xl:sticky xl:top-24">
            {selectedItem ? (
              <>
                <p className="text-xs text-eco-sage font-medium uppercase tracking-wide">Marketplace Details</p>
                <h2 className="text-2xl font-heading font-bold text-eco-forest mt-2">{selectedItem.itemName}</h2>
                <p className="text-sm text-eco-sage mt-3">{selectedItem.description}</p>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="p-4 rounded-xl bg-eco-bg-alt/70">
                    <p className="text-xs text-eco-sage uppercase tracking-wide">Offset Value</p>
                    <p className="text-2xl font-heading font-bold text-eco-forest mt-1">{selectedItem.carbonOffsetValue}</p>
                    <p className="text-xs text-eco-sage mt-1">kg CO2e</p>
                  </div>
                  <div className="p-4 rounded-xl bg-eco-bg-alt/70">
                    <p className="text-xs text-eco-sage uppercase tracking-wide">Price</p>
                    <p className="text-2xl font-heading font-bold text-eco-green mt-1">₹{selectedItem.price}</p>
                    <p className="text-xs text-eco-sage mt-1">single contribution</p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl border border-dashed border-eco-green/25 bg-eco-green/5">
                  <p className="text-sm font-medium text-eco-forest">Why this matters</p>
                  <p className="text-sm text-eco-sage mt-2">
                    This contribution helps offset part of your tracked footprint while supporting verified environmental action.
                  </p>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full mt-6 eco-button py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {purchasing ? 'Processing purchase...' : 'Buy Now'}
                </button>
              </>
            ) : (
              <div className="p-6 rounded-xl bg-eco-bg-alt/50 text-center text-sm text-eco-sage">
                Select an item to view details and purchase options.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
