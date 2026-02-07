// app/src/components/student/CampusBadge.tsx
import React from 'react';
import { Badge } from '../ui/Badge';

interface CampusBadgeProps {
  campus: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const campusColors: Record<string, { bg: string; text: string; icon: string }> = {
  'Ndejje University': {
    bg: 'from-blue-800 to-indigo-900',
    text: 'text-white',
    icon: '🎓',
  },
  'Makerere University': {
    bg: 'from-red-700 to-yellow-600',
    text: 'text-white',
    icon: '🦁',
  },
  'Kyambogo University': {
    bg: 'from-green-700 to-emerald-800',
    text: 'text-white',
    icon: '🌿',
  },
  'Uganda Christian University': {
    bg: 'from-purple-700 to-pink-800',
    text: 'text-white',
    icon: '⛪',
  },
  'Kampala International University': {
    bg: 'from-orange-600 to-red-700',
    text: 'text-white',
    icon: '🌍',
  },
  'Mbarara University of Science & Technology': {
    bg: 'from-teal-700 to-cyan-800',
    text: 'text-white',
    icon: '🔬',
  },
  'Gulu University': {
    bg: 'from-gray-800 to-gray-900',
    text: 'text-white',
    icon: '🐘',
  },
  default: {
    bg: 'from-rando-purple to-rando-gold',
    text: 'text-white',
    icon: '🏫',
  },
};

const CampusBadge = ({ campus, size = 'md', showIcon = true }: CampusBadgeProps) => {
  const campusConfig = campusColors[campus] || campusColors.default;

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${campusConfig.bg} ${campusConfig.text} text-xs font-semibold`}
    >
      {showIcon && <span className="mr-1.5">{campusConfig.icon}</span>}
      {campus}
    </div>
  );
};

export default CampusBadge;