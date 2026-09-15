import { useEffect, useState } from 'react';
import { Search, Bell, User, Menu } from 'lucide-react';
import type { User as UserType, View } from '../App';
import { fetchNotifications } from '../lib/api';

interface NavigationProps {
  user: UserType;
  currentView: View;
  onNavigate: (view: View) => void;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

const AUTH_VIEWS: View[] = [
  'dashboard',
  'carbonlog',
  'leaderboard',
  'badges',
  'goals',
  'survey',
  'marketplace',
  'notifications',
  'admin',
];

export function Navigation({ user, currentView, onNavigate, onToggleSidebar }: NavigationProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const isAuthView = !!user && AUTH_VIEWS.includes(currentView);

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      if (!user) {
        setUnreadCount(0);
        return;
      }

      try {
        const notifications = await fetchNotifications();
        if (!cancelled) {
          const unread = Array.isArray(notifications)
            ? notifications.filter((notification: any) => !notification.read).length
            : 0;
          setUnreadCount(unread);
        }
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    };

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [user, currentView]);

  if (!isAuthView) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate(user ? 'dashboard' : 'hero')}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-eco-green rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <span className="text-xl font-heading font-bold text-eco-forest hidden sm:block">CarbonCalc</span>
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 md:left-[240px] right-0 z-40 bg-white/80 backdrop-blur-md border-b border-[rgba(61,139,93,0.08)] px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-eco-bg-alt transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5 text-eco-forest" />
          </button>

          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-eco-sage" />
            <input
              type="text"
              placeholder="Search logs, goals, or marketplace..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-eco-bg border border-[rgba(61,139,93,0.12)] text-sm text-eco-forest placeholder:text-eco-sage/60 focus:outline-none focus:ring-2 focus:ring-eco-green/20 focus:border-eco-green/30 transition-all"
            />
          </div>

          <div className="sm:hidden">
            <p className="text-sm font-semibold text-eco-forest">CarbonCalc</p>
            <p className="text-xs text-eco-sage capitalize">{currentView}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4 ml-4">
          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            className="relative p-2 rounded-lg hover:bg-eco-bg-alt transition-colors"
          >
            <Bell className="w-5 h-5 text-eco-sage" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-eco-green text-white rounded-full text-[10px] font-semibold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-[rgba(61,139,93,0.12)]">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-eco-forest">{user?.name}</p>
              <p className="text-xs text-eco-sage">{user?.role === 'ADMIN' ? 'Administrator' : 'Eco Member'}</p>
            </div>
            <div className="w-9 h-9 bg-eco-green-pale rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-eco-green" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
