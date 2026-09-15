const DEFAULT_API_BASE = 'http://localhost:8085';
const TOKEN_STORAGE_KEY = 'carboncalc_token';
const USER_STORAGE_KEY = 'carboncalc_user';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '');
export const OAUTH_BASE = (import.meta.env.VITE_OAUTH_BASE_URL || API_BASE).replace(/\/$/, '');

export interface CarbonEntryRecord {
  id: number;
  category: string;
  activity: string;
  amount: number;
  unit?: string;
  notes?: string;
  date: string;
}

export interface GoalRecord {
  id: number;
  title: string;
  description?: string;
  category: string;
  baselineAmount: number;
  targetAmount: number;
  currentProgress: number;
  remainingAmount: number;
  targetPercentage: number;
  timeframeDays: number;
  recurrence: string;
  timeframeLabel: string;
  estimatedSavings: number;
  daysRemaining: number;
  unit: string;
  progressPercentage: number;
  deadline?: string;
  status: string;
  createdAt: string;
}

export interface BadgeRecord {
  code: string;
  name: string;
  description: string;
  category: string;
  iconName: string;
  bgColor: string;
  color: string;
  target: number;
  current: number;
  earned: boolean;
  progress: number;
  tier: string;
  statusLabel: string;
  progressLabel?: string;
}

export interface LeaderboardEntry {
  userId: number;
  userName: string;
  totalCarbonKg: number;
  score: number;
  impactPercent: number;
  badgeCount: number;
  completedGoals: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  currentUserTotal: number;
  currentUserEligible: boolean;
  currentUserScore: number;
  currentUserPercentile: number;
  totalParticipants: number;
  averageCarbonKg: number;
  topPerformer: LeaderboardEntry | null;
}

export interface DashboardCategoryInsight {
  category: string;
  amount: number;
  changePercent: number;
  miniTrend: number[];
}

export interface DashboardBadgeHighlight {
  code: string;
  name: string;
  iconName: string;
  bgColor: string;
  color: string;
  earned: boolean;
  progress: number;
}

export interface DashboardGoalHighlight {
  id: number;
  title: string;
  category: string;
  targetAmount: number;
  currentProgress: number;
  progressPercentage: number;
  targetPercentage: number;
  timeframeLabel: string;
  deadline?: string | null;
}

export interface DashboardResponseData {
  totalCarbonKg: number;
  monthlyChangePercent: number;
  weeklyTrend: Array<{ date: string; amount: number }>;
  categoryBreakdown: Record<string, number>;
  categoryInsights: DashboardCategoryInsight[];
  recentActivities: Array<{ date: string; category: string; description: string; emissionAmount: number }>;
  recentNotifications: Array<{ id: number; title: string; message: string; read: boolean }>;
  activeGoals: number;
  completedGoals: number;
  periodCarbonKg: number;
  periodLabel: string;
  totalBadges: number;
  leaderboardRank: number;
  unreadNotifications: number;
  estimatedAnnualFootprint?: number | null;
  activeGoal?: DashboardGoalHighlight | null;
  badgeHighlights: DashboardBadgeHighlight[];
  sustainabilityScore: number;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function getOAuthAuthorizationUrl(provider: 'google' | 'github') {
  return `${OAUTH_BASE}/oauth2/authorization/${provider}`;
}

async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      clearStoredUser();
    }

    const body = await response.json().catch(() => ({}));
    const defaultMessage = response.status === 401
      ? 'Your session expired. Please log in again.'
      : `Request failed (${response.status})`;

    throw new Error(body.error || body.message || defaultMessage);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

export async function apiLogin(email: string, password: string) {
  return apiFetch<{ user: { id: number; name: string; email: string; role: string }; token: string }>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
}

export async function fetchCurrentUser() {
  return apiFetch<{ id: number; name: string; email: string; role: string }>('/api/auth/me');
}

export async function apiRegister(name: string, email: string, password: string) {
  return apiFetch<{ message: string }>(
    '/api/auth/register',
    { method: 'POST', body: JSON.stringify({ name, email, password }) }
  );
}

export async function apiVerifyOtp(email: string, otp: string) {
  return apiFetch<{ message: string }>(
    '/api/auth/verify-otp',
    { method: 'POST', body: JSON.stringify({ email, otp }) }
  );
}

export async function apiResendOtp(email: string) {
  return apiFetch<{ message: string }>(
    '/api/auth/resend-otp',
    { method: 'POST', body: JSON.stringify({ email }) }
  );
}

export async function apiForgotPassword(email: string) {
  return apiFetch<{ message: string }>(
    '/api/auth/forgot-password',
    { method: 'POST', body: JSON.stringify({ email }) }
  );
}

export async function apiResetPassword(email: string, otp: string, newPassword: string) {
  return apiFetch<{ message: string }>(
    '/api/auth/reset-password',
    { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }
  );
}

export async function fetchDashboard(period = 'monthly') {
  return apiFetch<DashboardResponseData>(`/api/dashboard?period=${period}`);
}

export async function fetchCarbonEntries() {
  return apiFetch<CarbonEntryRecord[]>('/api/carbon');
}

export async function createCarbonEntry(data: {
  category: string;
  activity: string;
  amount: number;
  unit?: string;
  notes?: string;
  date?: string;
}) {
  return apiFetch('/api/carbon', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCarbonEntry(id: number, data: {
  category: string;
  activity: string;
  amount: number;
  unit?: string;
  notes?: string;
  date?: string;
}) {
  return apiFetch(`/api/carbon/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteCarbonEntry(id: number) {
  return apiFetch(`/api/carbon/${id}`, { method: 'DELETE' });
}

export async function fetchGoals() {
  return apiFetch<GoalRecord[]>('/api/goals');
}

export async function createGoal(data: {
  title: string;
  description?: string;
  category?: string;
  baselineAmount?: number;
  targetAmount?: number;
  targetPercentage?: number;
  timeframeDays?: number;
  recurrence?: string;
  estimatedSavings?: number;
  deadline?: string;
}) {
  return apiFetch<GoalRecord>('/api/goals', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateGoalProgress(id: number, progress: number) {
  return apiFetch<GoalRecord>(`/api/goals/${id}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ progress }),
  });
}

export async function deleteGoal(id: number) {
  return apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
}

export async function fetchLeaderboard() {
  return apiFetch<LeaderboardResponse>('/api/leaderboard');
}

export async function fetchBadges() {
  return apiFetch<BadgeRecord[]>('/api/badges/current');
}

export async function fetchMarketplace() {
  return apiFetch('/api/marketplace');
}

export async function fetchMarketplaceItem(id: number) {
  return apiFetch(`/api/marketplace/${id}`);
}

export async function createMarketplaceItem(data: {
  itemName: string;
  itemType: string;
  price: number;
  description: string;
  carbonOffsetValue: number;
}) {
  return apiFetch('/api/marketplace', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateMarketplaceItem(id: number, data: {
  itemName: string;
  itemType: string;
  price: number;
  description: string;
  carbonOffsetValue: number;
}) {
  return apiFetch(`/api/marketplace/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteMarketplaceItem(id: number) {
  return apiFetch(`/api/marketplace/${id}`, { method: 'DELETE' });
}

export async function purchaseMarketplaceItem(marketplaceItemId: number) {
  return apiFetch('/api/transactions', {
    method: 'POST',
    body: JSON.stringify({ marketplaceItemId }),
  });
}

export async function fetchTransactions(userId: number) {
  return apiFetch(`/api/transactions/user/${userId}`);
}

export async function fetchAllTransactions() {
  return apiFetch('/api/transactions');
}

export async function fetchNotifications() {
  return apiFetch('/api/notifications');
}

export async function markNotificationRead(id: number) {
  return apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
}

export async function deleteNotification(id: number) {
  return apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
}

export async function fetchSurvey() {
  return apiFetch('/api/survey');
}

export async function submitSurvey(data: any) {
  return apiFetch('/api/survey', { method: 'POST', body: JSON.stringify(data) });
}

export async function fetchAdminAnalytics() {
  return apiFetch('/api/admin/analytics');
}

export async function fetchAdminUsers() {
  return apiFetch('/api/admin/users');
}

export async function changeUserRole(userId: number, role: string) {
  return apiFetch(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export async function fetchAdminBadges() {
  return apiFetch('/api/admin/badges');
}

export async function createAdminBadge(data: {
  name: string;
  description: string;
  icon?: string;
  category?: string;
  thresholdKg: number;
  color?: string;
  bgColor?: string;
}) {
  return apiFetch('/api/admin/badges', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateAdminBadge(id: number, data: any) {
  return apiFetch(`/api/admin/badges/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteAdminBadge(id: number) {
  return apiFetch(`/api/admin/badges/${id}`, { method: 'DELETE' });
}
