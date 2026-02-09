'use client';

import React from 'react';
import Button from '../ui/Button';

interface GuestProgressProps {
  currentChatCount: number;
  onUpgrade: () => void;
  onContinue: () => void;
}

export default function GuestProgress({ 
  currentChatCount, 
  onUpgrade, 
  onContinue 
}: GuestProgressProps) {
  return (
    <div className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-xl border border-[#2E235E]/50">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gradient-to-r from-[#2E235E] to-[#4A3F8C] text-white">
          🎭 Guest Mode • Chat #{currentChatCount}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#8a8aa3]">Progress to next feature</span>
            <span className="text-[#D4AF37] font-semibold">
              {currentChatCount}/5 chats
            </span>
          </div>
          <div className="h-2 bg-[#252540] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2E235E] to-[#D4AF37] rounded-full"
              style={{ width: `${(currentChatCount / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onContinue}
          >
            💬 Continue Chatting
          </Button>
          <Button
            variant="gold"
            size="lg"
            onClick={onUpgrade}
          >
            ⚡ Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
}