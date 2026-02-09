/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // RANDO Design System Colors
        'rando': {
          // Primary Brand
          'purple': {
            DEFAULT: '#2E235E',
            50: '#F0F1FA',
            100: '#D9DBF2',
            200: '#B3B7E5',
            300: '#8D93D8',
            400: '#676FCB',
            500: '#2E235E', // Main brand
            600: '#251C4B',
            700: '#1C1538',
            800: '#130E25',
            900: '#0A0712',
          },
          'gold': {
            DEFAULT: '#D4AF37',
            50: '#FDF8E7',
            100: '#FAF0CF',
            200: '#F5E19F',
            300: '#F0D26F',
            400: '#EBC33F',
            500: '#D4AF37', // Academic gold
            600: '#B8972F',
            700: '#9C7F27',
            800: '#80671F',
            900: '#644F17',
          },
          'coral': {
            DEFAULT: '#FB6962',
            50: '#FFF0EF',
            100: '#FEE0DF',
            200: '#FCC1BF',
            300: '#FAA29F',
            400: '#F8837F',
            500: '#FB6962', // Action/urgency
            600: '#F9453C',
            700: '#F72116',
            800: '#D90F05',
            900: '#B30C04',
          },
          // Neutral Foundation
          'bg': {
            DEFAULT: '#0f0f1a',
            dark: '#0A0A12',
            light: '#141422',
          },
          'card': {
            DEFAULT: '#1a1a2e',
            light: '#252540',
            dark: '#151525',
          },
          'border': '#2d2d4a',
          'input': '#252540',
        },
        // Status Colors
        'success': '#10B981',
        'warning': '#F59E0B',
        'danger': '#EF4444',
        'info': '#3B82F6',
        // Text Colors
        'text': {
          primary: '#FFFFFF',
          secondary: '#B8B8D1',
          muted: '#8A8AA3',
          inverse: '#0F0F1A',
        }
      },
      fontSize: {
        // Typography Scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
      },
      spacing: {
        // Spacing System (4px grid)
        '0': '0px',
        '1': '0.25rem',    // 4px
        '2': '0.5rem',     // 8px
        '3': '0.75rem',    // 12px
        '4': '1rem',       // 16px
        '5': '1.25rem',    // 20px
        '6': '1.5rem',     // 24px
        '8': '2rem',       // 32px
        '10': '2.5rem',    // 40px
        '12': '3rem',      // 48px
        '16': '4rem',      // 64px
        '20': '5rem',      // 80px
        '24': '6rem',      // 96px
      },
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',   // 4px
        'DEFAULT': '0.5rem', // 8px
        'md': '0.75rem',   // 12px
        'lg': '1rem',      // 16px
        'xl': '1.5rem',    // 24px
        '2xl': '2rem',     // 32px
        'full': '9999px',
      },
      animation: {
        // Micro-interactions
        'gradient': 'gradient 15s ease infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'message-sent': 'messageSent 0.3s ease-out',
        'match-pulse': 'matchPulse 0.6s ease-in-out',
        'typing': 'typingBounce 1.4s infinite ease-in-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2E235E 0%, #4A3F8C 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)',
        'gradient-coral': 'linear-gradient(135deg, #FB6962 0%, #FF8C7F 100%)',
        'gradient-card': 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.15)',
        'medium': '0 10px 30px rgba(0, 0, 0, 0.2)',
        'large': '0 20px 60px rgba(0, 0, 0, 0.3)',
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.3)',
        'purple-glow': '0 0 20px rgba(46, 35, 94, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}