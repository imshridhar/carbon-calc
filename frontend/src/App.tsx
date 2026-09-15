import { useEffect, useState } from 'react';
import { Hero } from './sections/Hero';
import { Login } from './sections/Login';
import { SignUp } from './sections/SignUp';
import { Dashboard } from './sections/Dashboard';
import { CarbonLog } from './sections/CarbonLog';
import { Leaderboard } from './sections/Leaderboard';
import { EcoBadges } from './sections/EcoBadges';
import { Goals } from './sections/Goals';
import { LifestyleSurvey } from './sections/LifestyleSurvey';
import { Marketplace } from './sections/Marketplace';
import { Notifications } from './sections/Notifications';
import { ClosingCTA } from './sections/ClosingCTA';
import { AdminPanel } from './sections/AdminPanel';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { clearStoredUser, clearToken, fetchCurrentUser, getToken, setToken as saveToken } from './lib/api';

export type User = {
  id: number;
  name: string;
  email: string;
  role?: string;
  memberSince?: string;
} | null;

export type View =
  | 'hero'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'carbonlog'
  | 'leaderboard'
  | 'badges'
  | 'goals'
  | 'survey'
  | 'marketplace'
  | 'notifications'
  | 'admin';

const AUTHENTICATED_VIEWS: View[] = [
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

function App() {
  const [user, setUser] = useState<User>(null);
  const [currentView, setCurrentView] = useState<View>('hero');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthToken = urlParams.get('token');

      if (oauthToken && window.location.pathname === '/oauth-success') {
        saveToken(oauthToken);
        const oauthUser: User = {
          id: parseInt(urlParams.get('id') || '0', 10),
          name: decodeURIComponent(urlParams.get('name') || ''),
          email: decodeURIComponent(urlParams.get('email') || ''),
          role: urlParams.get('role') || 'USER',
        };

        if (cancelled) {
          return;
        }

        setUser(oauthUser);
        localStorage.setItem('carboncalc_user', JSON.stringify(oauthUser));
        setCurrentView('dashboard');
        window.history.replaceState({}, '', '/');
        setIsLoading(false);
        return;
      }

      if (!getToken()) {
        clearStoredUser();
        if (!cancelled) {
          setUser(null);
          setCurrentView('hero');
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (cancelled) {
          return;
        }

        const restoredUser: User = {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
        };

        setUser(restoredUser);
        localStorage.setItem('carboncalc_user', JSON.stringify(restoredUser));
        setCurrentView('dashboard');
      } catch {
        clearStoredUser();
        clearToken();
        if (!cancelled) {
          setUser(null);
          setCurrentView('hero');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('carboncalc_user', JSON.stringify(userData));
    }
    setCurrentView('dashboard');
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    clearStoredUser();
    clearToken();
    setCurrentView('hero');
    setIsSidebarOpen(false);
  };

  const navigateTo = (view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAuthenticatedView = !!user && AUTHENTICATED_VIEWS.includes(currentView);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-eco-bg flex items-center justify-center">
        <div className="animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-eco-green rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <span className="text-2xl font-heading font-bold text-eco-forest">CarbonCalc</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-bg">
      <Navigation
        user={user}
        currentView={currentView}
        onNavigate={navigateTo}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        onLogout={handleLogout}
      />

      {isAuthenticatedView && (
        <Sidebar
          isOpen={isSidebarOpen}
          currentView={currentView}
          onNavigate={navigateTo}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
          userRole={user?.role}
        />
      )}

      <main className={isAuthenticatedView ? 'md:ml-[240px]' : ''}>
        {currentView === 'hero' && <Hero onStart={() => navigateTo('login')} />}

        {currentView === 'login' && (
          <Login
            onLogin={handleLogin}
            onNavigateToSignup={() => navigateTo('signup')}
          />
        )}

        {currentView === 'signup' && (
          <SignUp
            onSignup={handleLogin}
            onNavigateToLogin={() => navigateTo('login')}
          />
        )}

        {currentView === 'dashboard' && user && <Dashboard user={user} onNavigate={navigateTo} />}
        {currentView === 'carbonlog' && user && <CarbonLog user={user} onNavigate={navigateTo} />}
        {currentView === 'leaderboard' && user && <Leaderboard user={user} onNavigate={navigateTo} />}
        {currentView === 'badges' && user && <EcoBadges user={user} onNavigate={navigateTo} />}
        {currentView === 'goals' && user && <Goals user={user} onNavigate={navigateTo} />}
        {currentView === 'survey' && user && <LifestyleSurvey user={user} onNavigate={navigateTo} />}
        {currentView === 'marketplace' && user && <Marketplace user={user} onNavigate={navigateTo} />}
        {currentView === 'notifications' && user && <Notifications user={user} onNavigate={navigateTo} />}

        {currentView === 'admin' && user && user.role === 'ADMIN' && (
          <AdminPanel
            user={user}
            onNavigate={navigateTo}
          />
        )}
      </main>

      {currentView === 'hero' && !user && (
        <ClosingCTA onSignup={() => navigateTo('signup')} />
      )}

      {isAuthenticatedView && (
        <footer className="md:ml-[240px] py-4 text-center text-xs text-eco-sage border-t border-[rgba(61,139,93,0.08)] bg-white/50">
          &copy; 2026 CarbonCalc • Environmentally Conscious Tracking
        </footer>
      )}

      <Toaster position="top-center" />
    </div>
  );
}

export default App;
