import React from 'react';

interface RwLogoProps {
  className?: string;
  size?: number;
}

export const RwLogo: React.FC<RwLogoProps> = ({ className = 'w-10 h-10', size }) => {
  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Upper curve for PEDURUNGAN TENGAH */}
        <path
          id="upperCurve"
          d="M 65,250 A 185,185 0 1,1 435,250"
          fill="none"
        />
        {/* Lower curve for PERIODE 2021 - 2024 */}
        <path
          id="lowerCurve"
          d="M 95,290 A 180,180 0 0,0 405,290"
          fill="none"
        />
        {/* Shadow filter */}
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer dark ring */}
      <circle cx="250" cy="250" r="242" fill="#1b2024" stroke="#111827" strokeWidth="4" />

      {/* Main green circle matching the uploaded logo */}
      <circle cx="250" cy="250" r="236" fill="#71c356" />

      {/* Curved Upper Text: PEDURUNGAN TENGAH */}
      <text
        fontFamily="'Impact', 'Arial Black', sans-serif"
        fontSize="38"
        fontWeight="bold"
        letterSpacing="4"
        fill="#111827"
        stroke="#ea580c"
        strokeWidth="3.5"
        paintOrder="stroke fill"
      >
        <textPath href="#upperCurve" xlinkHref="#upperCurve" startOffset="50%" textAnchor="middle">
          PEDURUNGAN TENGAH
        </textPath>
      </text>

      {/* Palm Tree Graphic on the Left */}
      <g id="palmTree" transform="translate(42, 115)">
        {/* Trunk */}
        <path
          d="M 85,160 Q 95,85 70,25 Q 78,25 90,85 Q 98,135 95,160 Z"
          fill="#85512d"
          stroke="#422512"
          strokeWidth="2.5"
        />
        {/* Trunk Rings */}
        <line x1="83" y1="140" x2="94" y2="137" stroke="#5a341b" strokeWidth="2" />
        <line x1="81" y1="115" x2="92" y2="112" stroke="#5a341b" strokeWidth="2" />
        <line x1="77" y1="90" x2="87" y2="87" stroke="#5a341b" strokeWidth="2" />
        <line x1="73" y1="65" x2="81" y2="62" stroke="#5a341b" strokeWidth="2" />
        <line x1="70" y1="42" x2="77" y2="39" stroke="#5a341b" strokeWidth="2" />

        {/* Coconuts */}
        <circle cx="73" cy="28" r="7" fill="#6d8a32" stroke="#2e4210" strokeWidth="1.5" />
        <circle cx="82" cy="30" r="7" fill="#88a93a" stroke="#2e4210" strokeWidth="1.5" />
        <circle cx="78" cy="22" r="6" fill="#587325" stroke="#2e4210" strokeWidth="1.5" />

        {/* Frond 1 (Top Left) */}
        <path
          d="M 75,22 Q 40,-15 -5,12 Q 25,3 75,22 Z"
          fill="#2f7832"
          stroke="#1b4d1d"
          strokeWidth="1.5"
        />
        {/* Frond 2 (Far Left) */}
        <path
          d="M 75,24 Q 25,10 -15,55 Q 15,40 75,24 Z"
          fill="#2d6e30"
          stroke="#1b4d1d"
          strokeWidth="1.5"
        />
        {/* Frond 3 (Bottom Left) */}
        <path
          d="M 76,27 Q 45,45 8,115 Q 40,80 76,27 Z"
          fill="#235c26"
          stroke="#143d17"
          strokeWidth="1.5"
        />
        {/* Frond 4 (Top Center) */}
        <path
          d="M 76,20 Q 80,-25 65,-40 Q 82,-15 76,20 Z"
          fill="#3e9442"
          stroke="#1b4d1d"
          strokeWidth="1.5"
        />
        {/* Frond 5 (Top Right) */}
        <path
          d="M 78,21 Q 120,-10 155,20 Q 120,15 78,21 Z"
          fill="#37843a"
          stroke="#1b4d1d"
          strokeWidth="1.5"
        />
        {/* Frond 6 (Right Low) */}
        <path
          d="M 78,25 Q 135,40 170,95 Q 128,65 78,25 Z"
          fill="#2a662d"
          stroke="#143d17"
          strokeWidth="1.5"
        />
      </g>

      {/* Stylized Cyan Blue Inner Roof Silhouette */}
      <path
        d="M 265,198 L 305,160 L 440,288 L 418,290 L 305,185 L 265,220 Z"
        fill="#0ea5e9"
      />

      {/* Stylized Orange Outer House & Roof Silhouette */}
      {/* Orange roof chevron */}
      <path
        d="M 252,185 L 430,310 L 412,316 L 252,212 L 102,315 L 160,311 L 140,358 L 160,408 L 140,408 L 140,312 L 46,325 L 252,185 Z"
        fill="#f97316"
        stroke="#ea580c"
        strokeWidth="2"
      />

      {/* Orange vertical left pillar base */}
      <rect x="140" y="312" width="20" height="96" fill="#ea580c" />

      {/* Main Text: PENGURUS */}
      <text
        x="295"
        y="350"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="44"
        fontStyle="italic"
        fontWeight="900"
        textAnchor="middle"
        fill="#0f172a"
        stroke="#ffffff"
        strokeWidth="5"
        paintOrder="stroke fill"
      >
        PENGURUS
      </text>

      {/* Main Text: RW XIV */}
      <text
        x="295"
        y="410"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="64"
        fontWeight="900"
        textAnchor="middle"
        fill="#0f172a"
        stroke="#ffffff"
        strokeWidth="8"
        paintOrder="stroke fill"
      >
        RW XIV
      </text>

      {/* Bottom Text: PERIODE 2021 - 2024 */}
      <text
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="21"
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="3"
        fill="#0f172a"
        stroke="#ffffff"
        strokeWidth="3.5"
        paintOrder="stroke fill"
      >
        <textPath href="#lowerCurve" xlinkHref="#lowerCurve" startOffset="50%" textAnchor="middle">
          PERIODE 2021 - 2024
        </textPath>
      </text>
    </svg>
  );
};
