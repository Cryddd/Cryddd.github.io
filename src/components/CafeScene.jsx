/**
 * A quiet café scene: one person at a laptop with a cup of coffee, framed by
 * a large window opening onto trees and distant hills. Restrained, adult,
 * Japan-inspired. Gentle animation only (steam, leaves, light).
 */
export default function CafeScene() {
  return (
    <svg
      className="cafe-scene"
      viewBox="0 0 640 420"
      role="img"
      aria-label="A person working on a laptop in a quiet café, with trees and hills visible through a large window"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d3ad" />
          <stop offset="45%" stopColor="#e7c9a0" />
          <stop offset="100%" stopColor="#dcae84" />
        </linearGradient>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a211c" />
          <stop offset="100%" stopColor="#1c1714" />
        </linearGradient>
        <linearGradient id="table" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6f4a32" />
          <stop offset="100%" stopColor="#553522" />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff4dd" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff4dd" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9fb083" />
          <stop offset="100%" stopColor="#7e9468" />
        </linearGradient>
      </defs>

      {/* Interior wall */}
      <rect x="0" y="0" width="640" height="420" fill="url(#wall)" />

      {/* Window frame */}
      <rect x="60" y="34" width="520" height="250" rx="10" fill="#0f0c0a" />
      <rect x="72" y="46" width="496" height="226" rx="6" fill="url(#sky)" />

      {/* Sun glow */}
      <circle cx="200" cy="120" r="90" fill="url(#sun)" />
      <circle cx="200" cy="120" r="26" fill="#fff6e3" />

      {/* Distant hills */}
      <path d="M72 210 Q180 150 300 196 T568 188 L568 272 L72 272 Z" fill="url(#hill)" opacity="0.92" />
      <path d="M72 234 Q210 188 360 224 T568 220 L568 272 L72 272 Z" fill="#6b8257" opacity="0.95" />

      {/* Trees outside */}
      <g className="tree tree--a">
        <rect x="118" y="150" width="8" height="60" fill="#4b3826" />
        <circle cx="122" cy="140" r="28" fill="#6f8a52" />
        <circle cx="104" cy="152" r="20" fill="#5f7a46" />
        <circle cx="140" cy="152" r="22" fill="#7b9760" />
      </g>
      <g className="tree tree--b">
        <rect x="486" y="150" width="9" height="64" fill="#4b3826" />
        <circle cx="490" cy="138" r="32" fill="#647f4a" />
        <circle cx="468" cy="154" r="22" fill="#566e3f" />
        <circle cx="514" cy="152" r="24" fill="#74905a" />
      </g>

      {/* Falling leaves */}
      <g className="leaves">
        <path className="leaf leaf--1" d="M0 0 q4 -5 8 0 q-4 5 -8 0Z" fill="#c98a4a" />
        <path className="leaf leaf--2" d="M0 0 q4 -5 8 0 q-4 5 -8 0Z" fill="#b9743a" />
        <path className="leaf leaf--3" d="M0 0 q4 -5 8 0 q-4 5 -8 0Z" fill="#d49a55" />
      </g>

      {/* Window mullions */}
      <rect x="316" y="46" width="6" height="226" fill="#0f0c0a" opacity="0.85" />
      <rect x="72" y="156" width="496" height="6" fill="#0f0c0a" opacity="0.85" />

      {/* Hanging pendant light */}
      <line x1="430" y1="34" x2="430" y2="70" stroke="#33271f" strokeWidth="2" />
      <path d="M414 70 h32 l-6 16 h-20 Z" fill="#caa46a" />
      <circle cx="430" cy="90" r="5" fill="#ffe6ad" className="bulb" />

      {/* Table */}
      <rect x="120" y="320" width="400" height="18" rx="6" fill="url(#table)" />
      <rect x="120" y="320" width="400" height="5" rx="2" fill="#7d5638" opacity="0.7" />

      {/* Person (back view, seated) */}
      <g>
        {/* chair back */}
        <rect x="300" y="300" width="44" height="60" rx="8" fill="#2c2018" />
        {/* torso */}
        <path d="M286 318 q36 -34 72 0 l-4 14 q-32 -10 -64 0 Z" fill="#3f5063" />
        {/* shoulders/hoodie */}
        <path d="M286 318 q36 -28 72 0 l0 6 q-36 -22 -72 0 Z" fill="#4a5d72" />
        {/* head */}
        <circle cx="322" cy="288" r="20" fill="#caa07a" />
        {/* hair */}
        <path d="M302 286 q20 -26 40 0 q-8 -10 -20 -10 q-12 0 -20 10Z" fill="#241a14" />
      </g>

      {/* Laptop */}
      <g>
        <rect x="296" y="300" width="52" height="34" rx="3" fill="#11100f" />
        <rect x="300" y="304" width="44" height="26" rx="2" fill="#7fa7c4" />
        <rect x="288" y="334" width="68" height="6" rx="3" fill="#1b1815" />
        <rect className="screen-flicker" x="304" y="308" width="36" height="3" rx="1" fill="#cfe6f5" />
        <rect className="screen-flicker" x="304" y="315" width="24" height="3" rx="1" fill="#a9cbe0" />
      </g>

      {/* Coffee cup + steam */}
      <g>
        <ellipse cx="232" cy="332" rx="20" ry="6" fill="#1b1815" />
        <path d="M214 320 h36 l-4 14 q-14 6 -28 0 Z" fill="#efe7da" />
        <path d="M250 322 q12 0 12 8 q0 8 -12 8" fill="none" stroke="#efe7da" strokeWidth="3" />
        <path className="steam steam--1" d="M226 314 q-6 -10 0 -20 q6 -10 0 -20" fill="none" stroke="#f5efe4" strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
        <path className="steam steam--2" d="M238 314 q6 -10 0 -20 q-6 -10 0 -20" fill="none" stroke="#f5efe4" strokeWidth="2.4" strokeLinecap="round" opacity="0.4" />
      </g>

      {/* Small potted plant on the table */}
      <g>
        <path d="M404 320 h26 l-4 16 h-18 Z" fill="#8a5a3a" />
        <path d="M410 320 q4 -22 8 -2" fill="none" stroke="#6f8a52" strokeWidth="3" strokeLinecap="round" />
        <path d="M417 320 q0 -26 6 -6" fill="none" stroke="#7b9760" strokeWidth="3" strokeLinecap="round" />
        <path d="M424 320 q4 -20 6 -2" fill="none" stroke="#5f7a46" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Warm light wash from the window */}
      <path d="M72 46 L568 46 L520 320 L150 320 Z" fill="#ffdf9e" opacity="0.06" />
    </svg>
  );
}
