import React from 'react';
import UserProfile from '@/components/UserProfile';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-dark">
      {/* Navigation */}
      <div className="glass border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 hover:text-gold transition-colors"
            >
              ← Back to Home
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                <span className="text-dark font-bold">R</span>
              </div>
              <h1 className="text-xl font-bold">RANDO</h1>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/chat'}
            className="btn-primary px-6 py-2"
          >
            Back to Chat
          </button>
        </div>
      </div>

      <UserProfile />

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="glass rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Your Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-gold mb-2">0</div>
              <div className="text-gray-400">Chats Today</div>
            </div>
            <div className="bg-card rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-gold mb-2">0</div>
              <div className="text-gray-400">Total Chats</div>
            </div>
            <div className="bg-card rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-gold mb-2">0</div>
              <div className="text-gray-400">Messages Sent</div>
            </div>
            <div className="bg-card rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-gold mb-2">100%</div>
              <div className="text-gray-400">Positive Ratings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}