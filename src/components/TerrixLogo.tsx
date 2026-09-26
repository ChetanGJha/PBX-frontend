import React from 'react';

interface TerrixLogoProps {
  size?: 'small' | 'medium' | 'large';
  light?: boolean;
}

export const TerrixLogo: React.FC<TerrixLogoProps> = ({ size = 'medium', light = false }) => {
  const dimensions = {
    small: { w: 32, h: 32, iconSize: 20 },
    medium: { w: 48, h: 48, iconSize: 30 },
    large: { w: 72, h: 72, iconSize: 46 },
  }[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${
          light ? 'bg-white text-[#FF5430]' : 'bg-[#FF5430] text-white'
        }`}
        style={{ width: dimensions.w, height: dimensions.h }}
      >
        <svg
          width={dimensions.iconSize}
          height={dimensions.iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
          <circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="6" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>

      {size !== 'small' && (
        <div className="text-left">
          <div className={`font-extrabold leading-none tracking-tight ${size === 'large' ? 'text-2xl text-white' : 'text-lg text-slate-900'}`}>
            Terrix <span className="text-[#FF5430]">AI</span>
          </div>
          <small className={`block text-[10px] font-bold uppercase tracking-widest mt-1 ${light || size === 'large' ? 'text-slate-400' : 'text-slate-500'}`}>
            PBX Engine
          </small>
        </div>
      )}
    </div>
  );
};
