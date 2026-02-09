import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'guest' | 'student' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Badge({ 
  variant = 'default', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}: BadgeProps) {
  
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const variants = {
    default: "bg-[#252540] text-white",
    guest: "bg-gradient-to-r from-[#2E235E] to-[#4A3F8C] text-white",
    student: "bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0F0F1A]",
    premium: "bg-gradient-to-r from-[#FB6962] to-[#FF8C7F] text-white",
  };
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };

  return (
    <div
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}