'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'gold' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({ 
  variant = 'default', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  
  const base = "inline-flex items-center justify-center rounded-lg font-semibold transition-all";
  const variants = {
    default: "bg-[#2E235E] text-white hover:bg-[#4A3F8C]",
    gold: "bg-[#D4AF37] text-[#0F0F1A] hover:bg-[#F4D03F]",
    outline: "border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0F0F1A]",
    ghost: "text-[#B8B8D1] hover:text-white hover:bg-[#1A1A2E]",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base", 
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}