"use client";

import React from "react";
import { Search, X } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  className?: string;
};

export function SearchBar({ value, onChange, placeholder = "Search...", onSubmit, className = "" }: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-100 w-5 h-5" />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label={placeholder}
        className="w-full pl-12 pr-10 py-2.5 md:py-3 bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-full text-white placeholder-gray-400 text-sm focus:outline-none focus:border-[#3985FF]/50 ring-1 ring-white/5 focus:ring-[#3985FF]/20 transition-all duration-300"
      />
    </div>
  );
}
