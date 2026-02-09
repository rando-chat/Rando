import React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-white">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8aa3]">
              {leftIcon}
            </div>
          )}
          <input
            className={`
              w-full bg-[#252540] border border-[#2d2d4a] rounded-lg 
              px-4 py-3 text-white placeholder:text-[#8a8aa3]
              focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent
              transition-all duration-200
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-[#EF4444] focus:ring-[#EF4444]' : ''}
              ${className || ''}
            `}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8aa3]">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p className={`text-sm ${error ? 'text-[#EF4444]' : 'text-[#B8B8D1]'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;