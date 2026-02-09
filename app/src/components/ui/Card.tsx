import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gold' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Card({ 
  variant = 'default', 
  padding = 'md', 
  children, 
  className = '',
  ...props 
}: CardProps) {
  
  const base = "rounded-xl border transition-all duration-200";
  const variants = {
    default: "bg-[#1A1A2E] border-[#2D2D4A]",
    gold: "bg-gradient-to-br from-[#1A1A2E] to-[#151525] border-2 border-[#D4AF37] shadow-lg shadow-yellow-500/10",
    gradient: "bg-gradient-to-br from-[#2E235E]/20 to-[#D4AF37]/10 border-[#2D2D4A]",
  };
  const paddings = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`${base} ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}