/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface FreiSeraficoLogoProps {
  className?: string;
  hasPillBackground?: boolean;
}

export default function FreiSeraficoLogo({ className = "w-10 h-10", hasPillBackground = false }: FreiSeraficoLogoProps) {
  const logoSvg = (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      id="frei-serafico-logo-svg"
    >
      {/* Red outer circle border matching Frei Seráfico brand colors */}
      <circle cx="50" cy="50" r="41.5" stroke="#a12e2e" strokeWidth="9" fill="#ffffff" />
      
      {/* Polished exact stylized S swirl corresponding to yin-yang shape */}
      <path
        d="M 50,13 C 29.5,13 13,29.5 13,50 C 13,70.5 29.5,87 50,87 C 62.1,87 73.1,81.2 80,72.2 C 78,74.5 70.8,79.5 61,79.5 C 43,79.5 45.5,58 36.5,58 C 27,58 40,42 50,42 C 60,42 53,20.5 63,20.5 C 72,20.5 78.5,25.5 81,28 C 74.3,18.8 63,13 50,13 Z"
        fill="#121214"
      />
    </svg>
  );

  if (hasPillBackground) {
    return (
      <div 
        id="frei-serafico-pill" 
        className="inline-flex flex-col items-center justify-center p-3 sm:p-4 bg-[#8b2626] border-2 border-white rounded-[2rem] shadow-xl relative select-none"
      >
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 p-0.5 bg-white rounded-full border border-black shadow-md">
          {logoSvg}
        </div>
        <div className="mt-4 px-5 text-white font-black tracking-widest text-sm uppercase">
          FREI SERÁFICO
        </div>
      </div>
    );
  }

  return logoSvg;
}
