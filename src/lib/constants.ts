export const MAPS = [
  { name: 'de_dust2', displayName: 'Dust II', screenshot: '/maps/screenshots/de_dust2.png', radar: '/maps/radar/de_dust2.png' },
  { name: 'de_mirage', displayName: 'Mirage', screenshot: '/maps/screenshots/de_mirage.png', radar: '/maps/radar/de_mirage.png' },
  { name: 'de_inferno', displayName: 'Inferno', screenshot: '/maps/screenshots/de_inferno.png', radar: '/maps/radar/de_inferno.png' },
  { name: 'de_nuke', displayName: 'Nuke', screenshot: '/maps/screenshots/de_nuke.png', radar: '/maps/radar/de_nuke.png' },
  { name: 'de_overpass', displayName: 'Overpass', screenshot: '/maps/screenshots/de_overpass.png', radar: '/maps/radar/de_overpass.png' },
  { name: 'de_ancient', displayName: 'Ancient', screenshot: '/maps/screenshots/de_ancient.png', radar: '/maps/radar/de_ancient.png' },
  { name: 'de_anubis', displayName: 'Anubis', screenshot: '/maps/screenshots/de_anubis.png', radar: '/maps/radar/de_anubis.png' },
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
  duckjumpthrow: 'Duck Jump Throw',
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
