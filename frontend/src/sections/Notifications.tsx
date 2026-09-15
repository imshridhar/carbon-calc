import { useEffect, useState } from 'react';
import { ChevronLeft, BellRing, CheckCheck, Trash2, AlertTriangle, Award, Store, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import type { User as UserType, View } from '../App';
import { useScrollReveal } from '../hooks/use-scroll-reveal';
import { deleteNotification, fetchNotifications, markNotificationRead } from '../lib/api';

interface NotificationsProps {
  user: UserType;
  onNavigate: (view: View) => void;
}

const iconMap: Record<string, typeof BellRing> = {
  ALERT: AlertTriangle,
  BADGE: Award,
  GOAL: Award,
  LEADERBOARD: Trophy,
  MARKETPLACE: Store,
};

export function Notifications({ user: _user, onNavigate }: NotificationsProps) {
  const sectionRef = useScrollReveal<HTMLElement>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((current) => current.map((notification) => (
        notification.id === id ? { ...notification, read: true } : notification
      )));
    } catch (err: any) {
      toast.error(err.message || 'Unable to mark notification as read.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications((current) => current.filter((notification) => notification.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Unable to delete notification.');
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  if (loading) {
    return (
      <section className="min-h-screen bg-eco-bg pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="animate-pulse text-eco-sage">Loading notifications...</div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="min-h-screen bg-eco-bg pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6 scroll-reveal">
          <button onClick={() => onNavigate('dashboard')} className="p-2 hover:bg-white rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6 text-eco-sage" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-eco-forest">Notifications</h1>
            <p className="text-sm text-eco-sage">Stay on top of goals, badges, purchases, and alerts.</p>
          </div>
        </div>

        {error && (
          <div className="eco-card p-4 mb-6 border border-amber-200 bg-amber-50 text-sm text-amber-800 scroll-reveal">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 scroll-reveal">
          <div className="eco-card p-5">
            <p className="text-xs text-eco-sage uppercase tracking-wide">Total Notifications</p>
            <p className="text-3xl font-heading font-bold text-eco-forest mt-2">{notifications.length}</p>
          </div>
          <div className="eco-card p-5">
            <p className="text-xs text-eco-sage uppercase tracking-wide">Unread</p>
            <p className="text-3xl font-heading font-bold text-eco-green mt-2">{unreadCount}</p>
          </div>
          <div className="eco-card p-5">
            <p className="text-xs text-eco-sage uppercase tracking-wide">Status</p>
            <p className="text-base font-semibold text-eco-forest mt-2">
              {unreadCount > 0 ? 'Action needed' : 'All caught up'}
            </p>
          </div>
        </div>

        <div className="eco-card p-6 scroll-reveal">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-heading font-bold text-eco-forest">Recent Updates</h2>
              <p className="text-sm text-eco-sage">Mark items as read or remove them once handled.</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-eco-green/10 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-eco-green" />
            </div>
          </div>

          <div className="space-y-4">
            {notifications.length > 0 ? notifications.map((notification) => {
              const Icon = iconMap[notification.type] || BellRing;
              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-2xl border transition-colors ${notification.read ? 'border-[rgba(61,139,93,0.08)] bg-eco-bg-alt/30' : 'border-eco-green/20 bg-white'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${notification.read ? 'bg-eco-bg-alt' : 'bg-eco-green/10'}`}>
                      <Icon className={`w-5 h-5 ${notification.read ? 'text-eco-sage' : 'text-eco-green'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-heading font-bold text-eco-forest">{notification.title}</h3>
                        {!notification.read && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-eco-green text-white">Unread</span>
                        )}
                      </div>
                      <p className="text-sm text-eco-sage mt-2">{notification.message}</p>
                      <p className="text-xs text-eco-sage mt-3">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="p-2 rounded-lg hover:bg-eco-bg-alt transition-colors"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-4 h-4 text-eco-green" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="p-10 rounded-2xl bg-eco-bg-alt/50 text-center">
                <p className="text-base font-medium text-eco-forest">No notifications yet</p>
                <p className="text-sm text-eco-sage mt-2">
                  When you earn badges, complete goals, or make purchases, updates will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
