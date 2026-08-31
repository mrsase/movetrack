import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'home'
  | 'list'
  | 'package'
  | 'plus'
  | 'search'
  | 'back'
  | 'close'
  | 'pencil'
  | 'trash'
  | 'check'
  | 'chevron-right'
  | 'truck'
  | 'inbox'
  | 'archive'
  | 'open-box'
  | 'tag'
  | 'link'
  | 'layers'
  | 'laptop'
  | 'cpu'
  | 'monitor'
  | 'keyboard'
  | 'drive'
  | 'table'
  | 'box-open'
  | 'spark'
  | 'alert';

const P: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M3 10.2 12 3l9 7.2" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  list: (
    <>
      <path d="M8.5 6h11M8.5 12h11M8.5 18h11" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </>
  ),
  package: (
    <>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.3 7 12 12l8.7-5" />
      <path d="M12 21.9V12" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-3.9-3.9" />
    </>
  ),
  back: <path d="m15 18-6-6 6-6" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  pencil: (
    <>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  truck: (
    <>
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.3a4 4 0 0 0-1.17-2.83L19 9h-5" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </>
  ),
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
  archive: (
    <>
      <path d="M21 8v13H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
    </>
  ),
  'open-box': (
    <>
      <path d="M21 9v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
      <path d="M3 9h18" />
      <path d="M5 9V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
      <path d="M9 13h6" />
    </>
  ),
  tag: (
    <>
      <path d="M20.6 13.4 12.2 5H2v10.2l8.4 8.4a2 2 0 0 0 2.8 0l7.4-7.4a2 2 0 0 0 0-2.8z" />
      <path d="M7 7h.01" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2 10 6-10 6L2 8z" />
      <path d="m2 16 10 6 10-6" />
      <path d="m2 12 10 6 10-6" />
    </>
  ),
  laptop: (
    <>
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9" />
      <path d="M4 16H2l1.3 2.6a1 1 0 0 0 .9.4h15.6a1 1 0 0 0 .9-.4L22 16h-2" />
    </>
  ),
  cpu: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </>
  ),
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 16v5" />
    </>
  ),
  keyboard: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M10 14h4" />
    </>
  ),
  drive: (
    <>
      <path d="M22 12H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      <path d="M6 16h.01M10 16h.01" />
    </>
  ),
  table: (
    <>
      <path d="M5 9h14" />
      <path d="M7 9v7" />
      <path d="M17 9v7" />
      <path d="M9.5 16v4.5M14.5 16v4.5" />
    </>
  ),
  'box-open': (
    <>
      <path d="M21 9v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
      <path d="M3 9h18M5 9V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
    </>
  ),
  spark: <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8" />,
  alert: (
    <>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
    </>
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, strokeWidth = 1.8, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {P[name]}
    </svg>
  );
}

export function CategoryIcon({ category, size = 20 }: { category: string; size?: number }) {
  const map: Record<string, IconName> = {
    mac: 'laptop',
    computer: 'cpu',
    monitor: 'monitor',
    input: 'keyboard',
    storage: 'drive',
    peripheral: 'layers',
    cable: 'link',
    accessory: 'tag',
    furniture: 'table',
    other: 'package',
  };
  return <Icon name={map[category] ?? 'package'} size={size} />;
}