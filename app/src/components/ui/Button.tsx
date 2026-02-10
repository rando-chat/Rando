'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'gold' | 'outline' | 'ghost' | 'coral';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

function Button({
  variant = 'default',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {

  const base = "inline-flex items-center justify-center rounded-lg font-semibold transition-all";
  const variants = {
    default: "bg-[#2E235E] text-white hover:bg-[#4A3F8C]",
    gold: "bg-[#D4AF37] text-[#0F0F1A] hover:bg-[#F4D03F]",
    outline: "border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0F0F1A]",
    ghost: "text-[#B8B8D1] hover:text-white hover:bg-[#1A1A2E]",
    coral: "bg-[#FB6962] text-white hover:bg-[#FF8C7F]",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
    icon: "p-2"
  };
  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = (disabled || loading) ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="mr-2 animate-spin">⏳</span>}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}

export { Button };
export default Button;