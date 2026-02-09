'use client';

import React, { useState } from 'react';
import Button from '../../ui/Button';

interface ConversationStartersProps {
  onSelect: (starter: string) => void;
}

export default function ConversationStarters({ onSelect }: ConversationStartersProps) {
  const starters = [
    "What's the most interesting thing you've learned recently?",
    "If you could master any skill instantly, what would it be?",
    "What's your go-to music when you need to focus?",
    "What's something that always makes you laugh?",
  ];

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
          onClick={() => onSelect(starters[Math.floor(Math.random() * starters.length)])}
        >
          Random
        </Button>
      </div>

      <div className="space-y-2">
        {starters.map((starter, index) => (
          <button
            key={index}
            onClick={() => onSelect(starter)}
            className="w-full text-left p-3 bg-[#252540] rounded-lg hover:bg-[#2d2d4a] transition-colors text-sm hover:text-[#D4AF37]"
          >
            {starter}
          </button>
        ))}
      </div>
    </div>
  );
}