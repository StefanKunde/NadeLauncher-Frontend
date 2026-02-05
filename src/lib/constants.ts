export const MAPS = [
  { name: 'de_dust2', displayName: 'Dust II', image: '/maps/de_dust2.jpg' },
  { name: 'de_mirage', displayName: 'Mirage', image: '/maps/de_mirage.jpg' },
  { name: 'de_inferno', displayName: 'Inferno', image: '/maps/de_inferno.jpg' },
  { name: 'de_nuke', displayName: 'Nuke', image: '/maps/de_nuke.jpg' },
  { name: 'de_overpass', displayName: 'Overpass', image: '/maps/de_overpass.jpg' },
  { name: 'de_ancient', displayName: 'Ancient', image: '/maps/de_ancient.jpg' },
  { name: 'de_anubis', displayName: 'Anubis', image: '/maps/de_anubis.jpg' },
] as const;

export const GRENADE_TYPES = {
  smoke: { label: 'Smoke', color: '#88bbee' },
  flash: { label: 'Flash', color: '#ffee44' },
  molotov: { label: 'Molotov', color: '#ff6633' },
  he: { label: 'HE', color: '#ff4444' },
} as const;

export const THROW_TYPES = {
  normal: 'Normal',
  stepthrow: 'Step Throw',
  walkthrow: 'Walk Throw',
  runthrow: 'Run Throw',
  jumpthrow: 'Jump Throw',
  stepjumpthrow: 'Step Jump Throw',
  walkjumpthrow: 'Walk Jump Throw',
  runjumpthrow: 'Run Jump Throw',
} as const;

export const DIFFICULTIES = {
  easy: { label: 'Easy', color: '#00c850' },
  medium: { label: 'Medium', color: '#f0a500' },
  hard: { label: 'Hard', color: '#ff4444' },
} as const;

export const MAP_COLORS: Record<string, string> = {
  de_dust2: '#d4a04a',
  de_mirage: '#4a9fd4',
  de_inferno: '#d44a4a',
  de_nuke: '#4ad49f',
  de_overpass: '#9f4ad4',
  de_ancient: '#4ad4d4',
  de_anubis: '#d4c04a',
};
