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

export interface Session {
  id: string;
  userId: string;
  token: string;
  serverIp?: string;
  serverPort?: number;
  serverPassword?: string;
  mapName: string;
  isActive: boolean;
  startedAt?: string;
  endedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface UsageStats {
  usedSeconds: number;
  remainingSeconds: number;
  limitSeconds: number;
  isPremium: boolean;
}
