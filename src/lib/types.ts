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
  tags: string[];
  collectionId?: string;
  collectionName?: string;
  // Impact data (from pro demo analysis)
  totalDamage?: number;
  enemiesBlinded?: number;
  totalBlindDuration?: number;
  flashAssists?: number;
  // Pro references
  playerName?: string;
  teamName?: string;
  teamSide?: string;
  roundNumber?: number;
  isPistolRound?: boolean;
  proMatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MapInfo {
  name: string;
  displayName: string;
}

export type SessionStatus = 'queued' | 'pending' | 'provisioning' | 'ready' | 'active' | 'ending' | 'ended' | 'failed';

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
  endReason?: 'connection_timeout' | 'afk_timeout' | 'user_ended' | 'time_expired' | 'disconnected' | 'provisioning_failed' | 'expired' | 'queue_stale';
  expiresAt: string;
  connectionTimeoutAt?: string;
  createdAt: string;
  queuePosition?: number;
  queuedAt?: string;
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
  autoManaged?: boolean;
  proCategory?: string;
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

// Pro Nades types
export interface ProTeam {
  id: string;
  name: string;
  hltvId?: number;
  logoUrl?: string;
  createdAt: string;
}

export interface ProPlayer {
  id: string;
  nickname: string;
  steamId: string;
  teamId?: string;
  teamName?: string;
  hltvId?: number;
  createdAt: string;
}

export interface ProDemo {
  id: string;
  matchId?: string;
  fileName: string;
  sourceUrl?: string;
  status: 'pending' | 'downloading' | 'extracting' | 'analyzing' | 'completed' | 'failed';
  errorMessage?: string;
  throwsExtracted: number;
  patternsDetected: number;
  processedAt?: string;
  createdAt: string;
}

export interface ProMatch {
  id: string;
  hltvMatchId?: number;
  team1Id?: string;
  team2Id?: string;
  team1Name?: string;
  team2Name?: string;
  mapName: string;
  matchDate: string;
  eventName?: string;
  score?: string;
  demos: ProDemo[];
  createdAt: string;
}

export interface ProCollection extends LineupCollection {
  proCategory?: string;
  proTeamId?: string;
  proPlayerId?: string;
  proMatchId?: string;
  timeWindow?: string;
  autoManaged: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export type ProCategory = 'meta' | 'team' | 'player' | 'match' | 'top_he' | 'top_flash' | 'most_used' | 'pistol' | 'eco';
export type TimeWindow = 'last_30d' | 'last_90d' | 'all_time';
