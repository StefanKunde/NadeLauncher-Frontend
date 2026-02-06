export interface User {
  id: string;
  steamId: string;
  username: string;
  avatar?: string;
  profileUrl?: string;
  isPremium: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Lineup {
  id: string;
  creatorId: string;
  creatorName?: string;
  mapName: string;
  isPublic: boolean;
  isPreset: boolean;
  grenadeType: 'smoke' | 'flash' | 'molotov' | 'he';
  name: string;
  description?: string;
  throwPosition: { x: number; y: number; z: number };
  throwAngles: { pitch: number; yaw: number };
  landingPosition: { x: number; y: number; z: number };
  releasePosition?: { x: number; y: number; z: number };
  movementPath?: { x: number; y: number; z: number; pitch: number; yaw: number }[];
  throwType: string;
  throwStrength?: string;
  instructions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MapInfo {
  name: string;
  displayName: string;
}

export type SessionStatus = 'pending' | 'provisioning' | 'ready' | 'active' | 'ending' | 'ended' | 'failed';

export interface Session {
  id: string;
  userId: string;
  token: string;
  serverIp?: string;
  serverPort?: number;
  serverPassword?: string;
  mapName: string;
  isActive: boolean;
  status: SessionStatus;
  provisioningError?: string;
  startedAt?: string;
  endedAt?: string;
  endReason?: 'connection_timeout' | 'afk_timeout' | 'user_ended' | 'time_expired' | 'disconnected' | 'provisioning_failed' | 'expired';
  expiresAt: string;
  connectionTimeoutAt?: string;
  createdAt: string;
}

export interface UsageStats {
  usedSeconds: number;
  remainingSeconds: number;
  limitSeconds: number;
  isPremium: boolean;
}

export interface LineupCollection {
  id: string;
  name: string;
  description?: string;
  mapName: string;
  coverImage?: string;
  isDefault: boolean;
  sortOrder: number;
  lineupCount: number;
  isSubscribed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  collectionId: string;
  collection: LineupCollection;
  subscribedAt: string;
  hiddenLineupIds: string[];
}

export interface CollectionWithLineups {
  collection: LineupCollection;
  lineups: Lineup[];
  hiddenLineupIds: string[];
}
