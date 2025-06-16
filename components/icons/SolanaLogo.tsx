// components/icons/SolanaLogo.tsx
import React from "react";

interface SolanaLogoProps {
  className?: string;
}

export const SolanaLogo: React.FC<SolanaLogoProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 256 256" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00FFA3" stopOpacity={1} />
        <stop offset="100%" stopColor="#DC1FFF" stopOpacity={1} />
      </linearGradient>
    </defs>
    <path fill="url(#grad1)" d="M64 104h128l-24-24H64zM64 152h128l-24 24H64z" />
  </svg>
);
