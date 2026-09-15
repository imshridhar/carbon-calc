import {
  LayoutDashboard,
  ClipboardList,
  History,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Trophy,
  Award,
  X,
  Target,
  Store,
  Bell,
} from 'lucide-react';
import type { View } from '../App';

interface SidebarProps {
  isOpen: boolean;
  currentView: View;
  onNavigate: (view: View) => void;
  onClose: () => void;
  onLogout: () => void;
  userRole?: string;
}

const navItems: { label: string; view: View; icon: typeof LayoutDashboard }[] = [
  { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
  { label: 'Lifestyle Survey', view: 'survey', icon: ClipboardList },
  { label: 'Carbon History', view: 'carbonlog', icon: History },
  { label: 'Goals', view: 'goals', icon: Target },
  { label: 'Leaderboard', view: 'leaderboard', icon: Trophy },
  { label: 'Eco Badges', view: 'badges', icon: Award },
  { label: 'Marketplace', view: 'marketplace', icon: Store },
  { label: 'Notifications', view: 'notifications', icon: Bell },
];

export function Sidebar({ isOpen, currentView, onNavigate, onClose, onLogout, userRole }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 bg-eco-forest/35 backdrop-blur-[1px] z-40 md:hidden"
          aria-label="Close navigation"
        />
      )}

      <aside className={`fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-[rgba(61,139,93,0.12)] flex flex-col z-50 transform transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-eco-green rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <span className="text-lg font-heading font-bold text-eco-forest">CarbonCalc</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-1 rounded-lg hover:bg-eco-bg-alt transition-colors md:hidden"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4 text-eco-sage" />
          </button>
        </div>

        <nav className="flex-1 px-3 mt-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-all duration-200 ${isActive ? 'bg-eco-green text-white shadow-md' : 'text-eco-sage hover:bg-eco-bg-alt hover:text-eco-forest'}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
              </button>
            );
          })}

          {userRole === 'ADMIN' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-all duration-200 ${currentView === 'admin' ? 'bg-eco-green text-white shadow-md' : 'text-eco-sage hover:bg-eco-bg-alt hover:text-eco-forest'}`}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-left">Admin Panel</span>
              {currentView === 'admin' && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
            </button>
          )}
        </nav>

        <div className="px-3 pb-5 space-y-1">
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-eco-sage hover:bg-eco-bg-alt hover:text-eco-forest transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
