import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { trackAnalytics } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';

interface ReportModalProps {
  sessionId: string;
  reportedUserId: string;
  reportedUsername?: string;
  onClose: () => void;
  onSubmit: () => void;
}

export default function ReportModal({
  sessionId,
  reportedUserId,
  reportedUsername,
  onClose,
  onSubmit,
}: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reportReasons = [
    { id: 'inappropriate', label: 'Inappropriate content' },
    { id: 'harassment', label: 'Harassment or bullying' },
    { id: 'spam', label: 'Spam or advertising' },
    { id: 'fake', label: 'Fake profile or bot' },
    { id: 'underage', label: 'Underage user' },
    { id: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reason) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          session_id: sessionId,
          reason,
          details: details || null,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Check if user has 3 or more reports
      const { count } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('reported_user_id', reportedUserId)
        .eq('status', 'pending');

      if (count && count >= 3) {
        // Auto-ban user with 3 or more pending reports
        await supabase
          .from('users')
          .update({
            banned: true,
            ban_reason: 'Multiple reports',
            banned_at: new Date().toISOString(),
          })
          .eq('id', reportedUserId);

        toast.success('User has been banned due to multiple reports');
      } else {
        toast.success('Report submitted successfully');
      }

      await trackAnalytics('user_reported', {
        reporterId: user.id,
        reportedUserId,
        reason,
      });

      onSubmit();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="glass rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-2">Report User</h2>
        <p className="text-gray-400 mb-6">
          Reporting: <span className="text-gold">{reportedUsername || 'Anonymous User'}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">
              Reason for report *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reportReasons.map((reportReason) => (
                <button
                  key={reportReason.id}
                  type="button"
                  onClick={() => setReason(reportReason.id)}
                  className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                    reason === reportReason.id
                      ? 'border-gold bg-gold bg-opacity-10'
                      : 'border-gray-700 hover:border-gold'
                  }`}
                >
                  {reportReason.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide any additional information that might help us investigate..."
              className="input-field h-32 resize-none"
              maxLength={500}
            />
            <p className="text-gray-400 text-xs mt-1">
              {details.length}/500 characters
            </p>
          </div>

          <div className="bg-card rounded-xl p-4">
            <h3 className="font-bold mb-2 text-sm">What happens next?</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>✅ Your report is reviewed within 24 hours</li>
              <li>✅ The reported user won't know who reported them</li>
              <li>⚠️ Users with 3+ reports get automatically banned</li>
              <li>🔒 All reports are handled confidentially</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason}
              className="btn-primary flex-1 bg-gradient-to-r from-primary to-coral"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}