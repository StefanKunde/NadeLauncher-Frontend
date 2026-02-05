'use client';

interface WeaponSilhouetteProps {
  weapon: 'ak47' | 'awp' | 'knife';
  className?: string;
}

function AK47Path() {
  return (
    <path
      d="M10 52 L10 48 L45 48 L45 44 L60 44 L60 40 L130 40 L135 38 L180 38 L185 36 L220 36 L225 38 L240 38 L240 42 L260 42 L265 40 L280 40 L280 44 L260 44 L260 48 L240 48 L240 52 L225 52 L225 48 L185 48 L180 50 L135 50 L130 48 L60 48 L55 52 Z M240 36 L240 30 L245 28 L250 30 L250 36 Z M140 44 L140 40 L150 40 L150 44 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function AWPPath() {
  return (
    <path
      d="M8 50 L8 46 L30 46 L30 42 L55 42 L55 38 L80 38 L80 36 L200 36 L205 34 L250 34 L255 32 L280 32 L282 34 L285 34 L285 38 L280 38 L275 40 L250 40 L245 38 L200 38 L195 40 L80 40 L75 42 L55 42 L55 46 L50 50 Z M120 36 L120 28 L125 26 L125 36 Z M260 34 L258 30 L262 28 L265 30 L265 34 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function KnifePath() {
  return (
    <path
      d="M40 80 L45 75 L50 72 L55 68 L70 55 L90 40 L110 28 L130 20 L150 16 L170 14 L190 14 L200 16 L205 20 L200 26 L190 30 L170 32 L150 30 L130 32 L110 38 L90 48 L75 60 L65 70 L55 78 L50 82 L45 84 Z M50 82 L42 86 L38 82 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

const VIEWBOXES: Record<WeaponSilhouetteProps['weapon'], string> = {
  ak47: '0 20 290 40',
  awp: '0 20 295 40',
  knife: '30 8 185 85',
};

export default function WeaponSilhouette({ weapon, className = '' }: WeaponSilhouetteProps) {
  return (
    <svg
      viewBox={VIEWBOXES[weapon]}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color: 'rgba(42, 42, 62, 0.3)' }}
      aria-hidden="true"
    >
      {weapon === 'ak47' && <AK47Path />}
      {weapon === 'awp' && <AWPPath />}
      {weapon === 'knife' && <KnifePath />}
    </svg>
  );
}
