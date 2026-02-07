'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface ConversationStartersProps {
  onSelect: (starter: string) => void;
}

const conversationStarters = [
  {
    category: 'Fun & Casual',
    starters: [
      "What's the most interesting thing you've learned recently?",
      "If you could master any skill instantly, what would it be?",
      "What's your go-to music when you need to focus?",
      "What's something that always makes you laugh?",
    ],
    emoji: '😄',
  },
  {
    category: 'Deep & Thoughtful',
    starters: [
      "What's one thing you wish everyone understood about you?",
      "What experience has changed your perspective the most?",
      "What does 'success' mean to you personally?",
      "What's something you're unlearning or relearning lately?",
    ],
    emoji: '🤔',
  },
  {
    category: 'Student Life',
    starters: [
      "What's the most interesting class you're taking this semester?",
      "What's your study routine like when exams are coming?",
      "What's one thing you wish your professors understood?",
      "How do you balance studies with social life?",
    ],
    emoji: '🎓',
  },
];

const ConversationStarters = ({ onSelect }: ConversationStartersProps) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (starter: string) => {
    setFavorites((prev) =>
      prev.includes(starter)
        ? prev.filter((s) => s !== starter)
        : [...prev, starter]
    );
  };

  const getRandomStarter = () => {
    const allStarters = conversationStarters.flatMap(cat => cat.starters);
    const randomIndex = Math.floor(Math.random() * allStarters.length);
    onSelect(allStarters[randomIndex]);
  };

  const currentCategory = conversationStarters[selectedCategory];

  return (
    <div className="p-6 bg-[#1a1a2e] rounded-xl border border-[#2d2d4a]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-[#D4AF37]">💡</span>
          <h3 className="font-semibold">Conversation Starters</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={getRandomStarter}
        >
          Random
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {conversationStarters.map((category, index) => (
          <button
            key={category.category}
            onClick={() => setSelectedCategory(index)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === index
                ? 'bg-[#D4AF37] text-[#0f0f1a]'
                : 'bg-[#252540] text-[#8a8aa3] hover:text-white'
            }`}
          >
            {category.emoji} {category.category}
          </button>
        ))}
      </div>

      {/* Starters List */}
      <div className="space-y-2 mb-4">
        {currentCategory.starters.map((starter, index) => (
          <div
            key={index}
            className="group flex items-center justify-between p-3 rounded-lg bg-[#252540] hover:bg-[#2d2d4a] transition-colors"
          >
            <button
              onClick={() => onSelect(starter)}
              className="flex-1 text-left hover:text-[#D4AF37] transition-colors text-sm"
            >
              {starter}
            </button>
            <button
              onClick={() => toggleFavorite(starter)}
              className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#1a1a2e] transition-all"
            >
              <span className={`text-sm ${
                favorites.includes(starter)
                  ? 'text-[#D4AF37]'
                  : 'text-[#8a8aa3]'
              }`}>
                {favorites.includes(starter) ? '★' : '☆'}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* AI Suggestion */}
      <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-[#2E235E]/20 to-[#D4AF37]/10 border border-[#2d2d4a]">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-[#D4AF37]">✨</span>
          <span className="text-sm font-medium">Pro Tip</span>
        </div>
        <p className="text-xs text-[#8a8aa3]">
          People respond best to open-ended questions that show genuine interest in their thoughts and experiences.
        </p>
      </div>
    </div>
  );
};

export default ConversationStarters;