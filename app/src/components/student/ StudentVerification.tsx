// app/src/components/student/StudentVerification.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import Modal from '../ui/Modal';
import { 
  GraduationCap, 
  CheckCircle, 
  Shield, 
  Clock, 
  Mail,
  University,
  BookOpen
} from 'lucide-react';

interface StudentVerificationProps {
  isVerified: boolean;
  university?: string;
  onVerify: (email: string, university: string) => Promise<void>;
}

const universities = [
  'Ndejje University',
  'Makerere University',
  'Kyambogo University',
  'Uganda Christian University',
  'Kampala International University',
  'Mbarara University of Science & Technology',
  'Gulu University',
  'Other University',
];

const StudentVerification = ({ isVerified, university, onVerify }: StudentVerificationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!email || !selectedUniversity) return;
    
    setLoading(true);
    try {
      await onVerify(email, selectedUniversity);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <Card variant="default" padding="md" className="border-success/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="font-semibold">🎓 Student Verified</div>
              <div className="text-sm text-text-secondary">
                {university} • Eligible for 50% discount
              </div>
            </div>
          </div>
          <Badge variant="success" size="sm">
            Verified
          </Badge>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        variant="gradient"
        padding="md"
        hover
        onClick={() => setIsOpen(true)}
        className="cursor-pointer border-rando-gold/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-rando-gold to-rando-gold/20 rounded-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">🎓 Get Student Discount</div>
              <div className="text-sm text-text-secondary">
                Verify your student status for 50% off Premium
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Verify Now
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="🎓 Student Verification"
        description="Get 50% off Premium with your student email"
        size="lg"
      >
        <div className="space-y-6">
          {/* Benefits */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-rando-input rounded-lg">
              <div className="text-3xl mb-2">🎓</div>
              <div className="text-sm font-semibold">50% OFF</div>
              <div className="text-xs text-text-secondary">Premium</div>
            </div>
            <div className="text-center p-3 bg-rando-input rounded-lg">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-sm font-semibold">Badge</div>
              <div className="text-xs text-text-secondary">Student Status</div>
            </div>
            <div className="text-center p-3 bg-rando-input rounded-lg">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-sm font-semibold">Priority</div>
              <div className="text-xs text-text-secondary">Campus Matching</div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <University className="inline h-4 w-4 mr-1" />
                Select Your University
              </label>
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full bg-rando-input border border-rando-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-rando-gold"
              >
                <option value="">Select university...</option>
                {universities.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                University Email Address
              </label>
              <Input
                type="email"
                placeholder="e.g., student@university.ac.ug"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="mt-1 text-xs text-text-secondary">
                We'll send a verification link to this email
              </p>
            </div>
          </div>

          {/* Requirements */}
          <Card variant="default" padding="sm">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <div className="font-medium">How verification works:</div>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Must be a valid university email address</li>
                  <li>• One-time verification only</li>
                  <li>• Your student status is private</li>
                  <li>• Discount applies to Premium tier only</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              fullWidth
              onClick={handleVerify}
              loading={loading}
              disabled={!email || !selectedUniversity}
            >
              Verify Student Status
            </Button>
          </div>

          <div className="text-center text-sm text-text-secondary">
            <Clock className="inline h-4 w-4 mr-1" />
            Verification typically takes 2-5 minutes
          </div>
        </div>
      </Modal>
    </>
  );
};

export default StudentVerification;