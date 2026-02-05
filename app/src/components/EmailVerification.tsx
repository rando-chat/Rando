import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { trackAnalytics } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';

interface EmailVerificationProps {
  onVerified?: () => void;
}

export default function EmailVerification({ onVerified }: EmailVerificationProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'verified'>('email');
  const [loading, setLoading] = useState(false);
  const [isStudent, setIsStudent] = useState(false);

  const sendVerificationCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Call our Vercel Edge Function
      const response = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          isStudent: isStudent && email.endsWith('.edu'),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      await supabase
        .from('email_verifications')
        .insert({
          email,
          code: data.code,
          verified: false,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });

      setStep('code');
      toast.success('Verification code sent to your email');

      await trackAnalytics('verification_code_sent', {
        email,
        isStudent,
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        throw new Error('Invalid or expired verification code');
      }

      // Mark as verified
      await supabase
        .from('email_verifications')
        .update({ verified: true })
        .eq('id', data.id);

      // Update user profile
      if (user) {
        const updates: any = { email_verified: true };
        
        if (isStudent && email.endsWith('.edu')) {
          updates.tier = 'student';
        }

        await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id);
      }

      setStep('verified');
      toast.success('Email verified successfully!');

      await trackAnalytics('email_verified', {
        email,
        isStudent,
      });

      if (onVerified) onVerified();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setCode('');
    await sendVerificationCode();
  };

  if (step === 'email') {
    return (
      <div className="glass rounded-xl p-8 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
          <p className="text-gray-400">
            Verify your email to unlock all features and ensure account security
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="student"
              checked={isStudent}
              onChange={(e) => setIsStudent(e.target.checked)}
              className="rounded border-gray-700 bg-card"
              disabled={!email.endsWith('.edu')}
            />
            <label htmlFor="student" className="text-sm">
              I'm a student with a .edu email (get 50% off!)
            </label>
          </div>

          {isStudent && !email.endsWith('.edu') && (
            <p className="text-warning text-sm">
              ⚠️ Student discount only available for .edu email addresses
            </p>
          )}

          <button
            onClick={sendVerificationCode}
            disabled={loading || !email}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <h4 className="font-bold mb-2">Why verify?</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>✅ Secure your account</li>
            <li>✅ Unlock premium features</li>
            <li>✅ Get student discounts</li>
            <li>✅ Enable password recovery</li>
          </ul>
        </div>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <div className="glass rounded-xl p-8 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold mb-2">Enter Verification Code</h2>
          <p className="text-gray-400">
            We sent a 6-digit code to <span className="text-gold">{email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">6-Digit Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="input-field text-center text-2xl tracking-widest"
              maxLength={6}
              disabled={loading}
            />
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              Code expires in 10 minutes
            </p>
            <button
              onClick={resendCode}
              disabled={loading}
              className="text-gold hover:text-gold/80 text-sm"
            >
              Didn't receive code? Resend
            </button>
          </div>

          <button
            onClick={verifyCode}
            disabled={loading || code.length !== 6}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-8 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
      <p className="text-gray-400 mb-6">
        {isStudent
          ? 'Congratulations! You now have student access with 50% discount.'
          : 'Your email has been successfully verified.'}
      </p>

      {isStudent && (
        <div className="bg-gradient-to-r from-primary to-gold rounded-xl p-6 mb-6">
          <h3 className="font-bold text-lg mb-2">🎓 Student Benefits Activated</h3>
          <p className="text-sm">
            You now have access to all premium features at 50% off!
          </p>
        </div>
      )}

      <button
        onClick={onVerified}
        className="btn-primary w-full py-3"
      >
        Continue to Chat
      </button>
    </div>
  );
}