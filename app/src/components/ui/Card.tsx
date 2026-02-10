import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gold' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  glow = false,
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
  const hoverClass = hover ? "hover:border-[#D4AF37] hover:shadow-lg hover:shadow-yellow-500/10" : "";

  return (
    <div
      className={`${base} ${variants[variant]} ${paddings[padding]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardTitle({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-xl font-bold ${className}`} {...props}>
      {children}
    </h3>
  );
}

function CardContent({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

function CardFooter({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
export default Card;