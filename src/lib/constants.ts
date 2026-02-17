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
  stepthrow: 'StepThrow',
  walkthrow: 'WalkThrow',
  runthrow: 'RunThrow',
  jumpthrow: 'Jumpthrow',
  wjumpthrow: 'W-Jumpthrow',
  duckthrow: 'DuckThrow',
  duckjumpthrow: 'DuckJumpThrow',
  stepjumpthrow: 'StepJumpThrow',
  walkjumpthrow: 'WalkJumpThrow',
  runjumpthrow: 'RunJumpThrow',
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
