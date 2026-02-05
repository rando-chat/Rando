import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createCheckoutSession } from '@/lib/lemon-squeezy/checkout';
import { trackAnalytics } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';

export default function UserProfile() {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [updating, setUpdating] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user || !username.trim()) return;

    setUpdating(true);
    try {
      const result = await updateProfile({ username: username.trim() });
      if (result.success) {
        toast.success('Profile updated successfully');
        await trackAnalytics('profile_updated', { field: 'username' });
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpgrade = async (tier: 'premium' | 'student') => {
    if (!user) return;

    setUpgrading(true);
    try {
      const result = await createCheckoutSession(user.id, user.email!, tier);
      if (result.success) {
        window.location.href = result.url!;
        await trackAnalytics('upgrade_started', { tier });
      } else {
        toast.error(result.error || 'Failed to start checkout');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setUpgrading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-gradient-to-r from-gold to-yellow-500';
      case 'student':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-800';
    }
  };

  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case 'premium':
        return ['✅ Unlimited text chat', '✅ Send images (5MB max)', '✅ Priority matching', '✅ Ad-free experience'];
      case 'student':
        return ['✅ All premium features', '✅ 50% discount', '✅ .edu email verified', '✅ Student community'];
      default:
        return ['✅ Unlimited text chat', '✅ Link blocking', '✅ Safe environment', '✅ Basic matching'];
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Profile Header */}
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center text-3xl font-bold">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.username}</h1>
              <p className="text-gray-400">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getTierColor(user.tier)}`}>
                  {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                </span>
                <span className="text-sm text-gray-400">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="Choose a username"
                />
                <button
                  onClick={handleUpdateProfile}
                  disabled={updating || username === user.username}
                  className="btn-primary px-6 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={user.email || ''}
                className="input-field bg-gray-900"
                readOnly
              />
              <p className="text-sm text-gray-400 mt-1">
                Email verification required for security
              </p>
            </div>

            <div className="bg-card rounded-xl p-4">
              <h3 className="font-bold mb-2">Account Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Email Verified</span>
                  <span className={`px-2 py-1 rounded text-xs ${user.email_verified ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                    {user.email_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Age Verification</span>
                  <span className={`px-2 py-1 rounded text-xs ${user.age_verified ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                    {user.age_verified ? 'Verified' : 'Required'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Section */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">Upgrade Your Plan</h2>
          
          <div className="space-y-4">
            {/* Current Plan */}
            <div className={`rounded-xl p-6 ${getTierColor(user.tier)}`}>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">Current Plan</div>
                <div className="text-3xl font-bold mb-4">
                  {user.tier === 'free' && '$0/month'}
                  {user.tier === 'premium' && '$4.99/month'}
                  {user.tier === 'student' && '$2.49/month'}
                </div>
              </div>
            </div>

            {/* Available Upgrades */}
            {user.tier !== 'premium' && (
              <div className="border border-gold rounded-xl p-6">
                <h3 className="font-bold text-lg mb-2">Premium</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Get the full RANDO experience
                </p>
                <div className="text-2xl font-bold mb-4">$4.99/month</div>
                <ul className="space-y-2 mb-6">
                  {getTierBenefits('premium').map((benefit, idx) => (
                    <li key={idx} className="text-sm">{benefit}</li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade('premium')}
                  disabled={upgrading}
                  className="btn-primary w-full"
                >
                  {upgrading ? 'Loading...' : 'Upgrade to Premium'}
                </button>
              </div>
            )}

            {user.tier !== 'student' && (
              <div className="border border-green-500 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-2">Student</h3>
                <p className="text-gray-400 text-sm mb-4">
                  All Premium features at 50% off
                </p>
                <div className="text-2xl font-bold mb-4">$2.49/month</div>
                <ul className="space-y-2 mb-6">
                  {getTierBenefits('student').map((benefit, idx) => (
                    <li key={idx} className="text-sm">{benefit}</li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade('student')}
                  disabled={upgrading || !user.email?.endsWith('.edu')}
                  className={`w-full py-3 rounded-lg font-bold ${
                    !user.email?.endsWith('.edu')
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'btn-primary bg-green-500 hover:bg-green-600'
                  }`}
                  title={!user.email?.endsWith('.edu') ? 'Student discount requires .edu email' : ''}
                >
                  {upgrading ? 'Loading...' : 'Get Student Discount'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}