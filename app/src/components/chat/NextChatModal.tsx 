// app/src/components/chat/NextChatModal.tsx
'use client';

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Zap } from 'lucide-react';

interface NextChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNextChat: () => void;
  onRate: (rating: number, feedback?: string) => void;
  currentPartner?: string;
}

const NextChatModal = ({
  isOpen,
  onClose,
  onNextChat,
  onRate,
  currentPartner,
}: NextChatModalProps) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onRate(rating, feedback);
    }
    onNextChat();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How was your chat?"
      description="Your feedback helps us find better matches for you"
      size="lg"
    >
      <div className="space-y-6">
        {/* Rating */}
        <div className="text-center">
          <div className="flex justify-center space-x-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="text-3xl transition-transform hover:scale-110"
              >
                {star <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          <p className="text-text-secondary">
            Rate your conversation with {currentPartner || 'your partner'}
          </p>
        </div>

        {/* Quick Feedback */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '😊', label: 'Friendly', value: 'friendly' },
            { icon: '😂', label: 'Funny', value: 'funny' },
            { icon: '🤝', label: 'Helpful', value: 'helpful' },
            { icon: '💬', label: 'Talkative', value: 'talkative' },
            { icon: '🎯', label: 'Similar', value: 'similar' },
            { icon: '🌟', label: 'Great!', value: 'great' },
          ].map((item) => (
            <button
              key={item.value}
              className="p-3 rounded-lg border border-rando-border hover:border-rando-gold transition-colors"
              onClick={() => setFeedback(item.value)}
            >
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-sm">{item.label}</div>
            </button>
          ))}
        </div>

        {/* Custom Feedback */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Additional feedback (optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What made this chat good or bad?"
            className="input-field min-h-[100px] resize-none"
          />
        </div>

        {/* Stats */}
        <Card variant="default" padding="sm">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-rando-gold" />
              <span>Chats today: 3</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-success" />
              <span>Match rate: 85%</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            leftIcon={<ThumbsDown className="h-4 w-4" />}
          >
            Stay in Chat
          </Button>
          <Button
            variant="gold"
            fullWidth
            onClick={handleSubmit}
            leftIcon={<ThumbsUp className="h-4 w-4" />}
            disabled={rating === 0}
          >
            Next Chat
          </Button>
        </div>

        {/* Pro Tip */}
        <div className="text-center text-sm text-text-secondary">
          ⚡ Pro Tip: Rating chats helps our algorithm find better matches for you!
        </div>
      </div>
    </Modal>
  );
};

export default NextChatModal;