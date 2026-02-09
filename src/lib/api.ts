import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import type { AuthResponse, Lineup, MapInfo, Session, UsageStats, LineupCollection, UserSubscription, CollectionWithLineups, ProCollection, ProTeam, ProPlayer, ProMatch, Notification } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nadelauncher-backend-a99d397c.apps.deploypilot.stefankunde.dev';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post<{ data: AuthResponse }>(
            `${API_URL}/auth/refresh`,
            { refreshToken },
          );
          const authData = data.data;
          useAuthStore.getState().setTokens(authData.accessToken, authData.refreshToken, authData.user);
          originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  },
);

// Auth
export const authApi = {
  getMe: () => api.get<{ data: AuthResponse }>('/auth/me').then((r) => r.data.data),
  refresh: (refreshToken: string) =>
    api.post<{ data: AuthResponse }>('/auth/refresh', { refreshToken }).then((r) => r.data.data),
};

// Maps
export const mapsApi = {
  getAll: () => api.get<{ data: MapInfo[] }>('/api/maps').then((r) => r.data.data),
};

// Lineups
export const lineupsApi = {
  getPresets: (map?: string) =>
    api.get<{ data: Lineup[] }>('/api/lineups/presets', { params: { map } }).then((r) => r.data.data),
  getMy: (map?: string) =>
    api.get<{ data: Lineup[] }>('/api/lineups/my', { params: { map } }).then((r) => r.data.data),
  getById: (id: string) =>
    api.get<{ data: Lineup }>(`/api/lineups/${id}`).then((r) => r.data.data),
  assign: (id: string) => api.post(`/api/lineups/${id}/assign`),
  unassign: (id: string) => api.delete(`/api/lineups/${id}/unassign`),
  delete: (id: string) => api.delete(`/api/lineups/${id}`),
};

// Sessions
export const sessionsApi = {
  create: (mapName: string) =>
    api.post<{ data: Session }>('/api/sessions', { mapName }).then((r) => r.data.data),
  getActive: () =>
    api.get<{ data: Session | null }>('/api/sessions/active').then((r) => r.data.data),
  getUsage: () =>
    api.get<{ data: UsageStats }>('/api/sessions/usage').then((r) => r.data.data),
  end: (id: string) => api.delete(`/api/sessions/${id}`),
};

// Collections
export const collectionsApi = {
  getAll: (map?: string) =>
    api.get<{ data: LineupCollection[] }>('/api/collections', { params: { map } }).then((r) => r.data.data),
  getAllWithStatus: (map?: string) =>
    api.get<{ data: LineupCollection[] }>('/api/collections/user/all', { params: { map } }).then((r) => r.data.data),
  getById: (id: string) =>
    api.get<{ data: CollectionWithLineups }>(`/api/collections/${id}`).then((r) => r.data.data),
  getByIdWithUserState: (id: string) =>
    api.get<{ data: CollectionWithLineups }>(`/api/collections/${id}/details`).then((r) => r.data.data),
  getSubscriptions: () =>
    api.get<{ data: UserSubscription[] }>('/api/collections/user/subscriptions').then((r) => r.data.data),
  subscribe: (id: string) =>
    api.post<{ data: UserSubscription }>(`/api/collections/${id}/subscribe`).then((r) => r.data.data),
  unsubscribe: (id: string) =>
    api.delete(`/api/collections/${id}/unsubscribe`),
  hideLineup: (collectionId: string, lineupId: string) =>
    api.post(`/api/collections/${collectionId}/lineups/${lineupId}/hide`),
  unhideLineup: (collectionId: string, lineupId: string) =>
    api.delete(`/api/collections/${collectionId}/lineups/${lineupId}/hide`),
};

// Pro Nades
export const proNadesApi = {
  getCollections: (map?: string, category?: string, timeWindow?: string) =>
    api.get<{ data: ProCollection[] }>('/api/collections', {
      params: { map, proCategory: category, timeWindow },
    }).then((r) => r.data.data),
  getTeams: () =>
    api.get<{ data: ProTeam[] }>('/api/pro-nades/teams').then((r) => r.data.data),
  getPlayers: () =>
    api.get<{ data: ProPlayer[] }>('/api/pro-nades/players').then((r) => r.data.data),
  getMatches: () =>
    api.get<{ data: ProMatch[] }>('/api/pro-nades/matches').then((r) => r.data.data),
  getMatch: (id: string) =>
    api.get<{ data: ProMatch }>(`/api/pro-nades/matches/${id}`).then((r) => r.data.data),
};

// Notifications
export const notificationsApi = {
  getAll: (limit = 20, offset = 0) =>
    api.get<{ data: Notification[] }>('/api/notifications', { params: { limit, offset } }).then((r) => r.data.data),
  getUnreadCount: () =>
    api.get<{ data: number }>('/api/notifications/unread-count').then((r) => r.data.data),
  markAsRead: (id: string) =>
    api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () =>
    api.post('/api/notifications/read-all'),
};

export default api;
