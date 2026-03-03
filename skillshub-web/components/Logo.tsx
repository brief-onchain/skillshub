import React from 'react';

export const Logo = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ filter: 'drop-shadow(0 0 6px rgba(240, 190, 87, 0.4))' }}
  >
    <defs>
      <linearGradient id="logoGold" x1="6" y1="8" x2="42" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F0BE57" />
        <stop offset="100%" stopColor="#C58B2E" />
      </linearGradient>
      <linearGradient id="logoGoldFade" x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F0BE57" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#C58B2E" stopOpacity="0.08" />
      </linearGradient>
    </defs>

    {/* Outer hexagon ring */}
    <path
      d="M24 4L43.0526 15V37L24 48L4.94744 37V15L24 4Z"
      stroke="url(#logoGoldFade)"
      strokeWidth="1.2"
    />

    {/* Inner S-shaped circuit path */}
    <path
      d="M30 12H20C16.134 12 13 15.134 13 19V19C13 21.761 15.239 24 18 24H30C32.761 24 35 26.239 35 29V29C35 32.866 31.866 36 28 36H18"
      stroke="url(#logoGold)"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Top node */}
    <circle cx="32" cy="12" r="2.5" fill="#F0BE57" />
    {/* Bottom node */}
    <circle cx="16" cy="36" r="2.5" fill="#C58B2E" />

    {/* Center hub dot */}
    <circle cx="24" cy="24" r="1.8" fill="#F0BE57" opacity="0.6" />
  </svg>
);
