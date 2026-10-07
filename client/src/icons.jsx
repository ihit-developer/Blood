const paths = {
  drop: <path d="M12 2.5c3.2 4.2 6.5 7.7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.2 8.8 6.7 12 2.5z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 13l4 4L19 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  trash: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
  logout: <path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  shield: <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />,
  alert: <path d="M12 3l10 18H2L12 3zM12 10v5M12 18v.01" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.4c2.2.7 3.5 2.6 3.5 5.6" />
    </>
  ),
  dash: <path d="M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z" />,
  heart: <path d="M12 20s-7-4.6-9-9.2C1.6 7.2 4 4 7.2 4c1.9 0 3.5 1 4.8 2.8C13.3 5 14.9 4 16.8 4 20 4 22.4 7.2 21 10.8 19 15.4 12 20 12 20z" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5" />,
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  sidebar: <path d="M4 5h16v14H4zM9 5v14" />,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  inbox: <path d="M3 13l3-8h12l3 8v6H3v-6zM3 13h5l1 3h6l1-3h5" />,
};

export function Icon({ name, size = 20, className, title }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  );
}

export function BrandMark({ size = 30, light = false }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        fill={light ? "#fff" : "#C8102E"}
        d="M12 1.8c3.5 4.5 7 8.2 7 12.2a7 7 0 0 1-14 0c0-4 3.5-7.7 7-12.2z"
      />
      <path
        d="M7.4 14.2h2.5l1.2-2.6 1.9 5 1.4-2.4h2.2"
        fill="none"
        stroke={light ? "#C8102E" : "#fff"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
