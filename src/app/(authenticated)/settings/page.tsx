'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
      });
      setIsLoading(false);
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        setError(error.message || 'Failed to update profile');
        setIsSaving(false);
        return;
      }

      // Update session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          email: formData.email,
        },
      });

      setSuccess('Profile updated successfully');
      setIsSaving(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsSaving(false);
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0c3649] mb-2">Settings</h1>
        <p className="text-[#6b7280]">Manage your account settings and preferences</p>
      </div>

      {success && (
        <div className="bg-green-600 bg-opacity-10 border border-green-600 border-opacity-30 rounded-lg p-4">
          <p className="text-green-300 text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-600 bg-opacity-10 border border-red-600 border-opacity-30 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Profile Settings */}
      <Card title="Profile Settings" subtitle="Update your personal information">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            disabled
            helperText="Email cannot be changed at this time"
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-[#2A3A55]">
            <Button variant="ghost" href="/dashboard" size="md">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              size="md"
              loading={isSaving}
              disabled={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Account Information */}
      <Card title="Account Information">
        <div className="space-y-4">
          <div className="p-4 bg-[#0A1628] border border-[#2A3A55] rounded-lg">
            <p className="text-sm text-[#8899BB] mb-1">Account Status</p>
            <p className="text-lg font-semibold text-green-400">✓ Active</p>
          </div>

          <div className="p-4 bg-[#0A1628] border border-[#2A3A55] rounded-lg">
            <p className="text-sm text-[#8899BB] mb-1">Member Since</p>
            <p className="font-medium text-[#0c3649]">
              {session?.user && 'Recently joined'}
            </p>
          </div>

          <div className="pt-4 border-t border-[#2A3A55]">
            <Button variant="outline" href="/billing" size="md">
              View Billing & Subscription
            </Button>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card title="Notification Preferences">
        <div className="space-y-4">
          <label className="flex items-start gap-3 p-4 bg-[#0A1628] border border-[#2A3A55] rounded-lg cursor-pointer hover:border-[#3A4A65] transition-colors">
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 mt-1 accent-teal-600 cursor-pointer"
            />
            <div>
              <p className="font-medium text-[#0c3649]">Report Completion</p>
              <p className="text-sm text-[#8899BB]">Get notified when your reports are ready</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 bg-[#0A1628] border border-[#2A3A55] rounded-lg cursor-pointer hover:border-[#3A4A65] transition-colors">
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 mt-1 accent-teal-600 cursor-pointer"
            />
            <div>
              <p className="font-medium text-[#0c3649]">Low Credits Alert</p>
              <p className="text-sm text-[#8899BB]">Remind me when credits are running low</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 bg-[#0A1628] border border-[#2A3A55] rounded-lg cursor-pointer hover:border-[#3A4A65] transition-colors">
            <input
              type="checkbox"
              className="w-5 h-5 mt-1 accent-teal-600 cursor-pointer"
            />
            <div>
              <p className="font-medium text-[#0c3649]">Product Updates</p>
              <p className="text-sm text-[#8899BB]">Learn about new features and improvements</p>
            </div>
          </label>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card title="Danger Zone" className="border-red-600 border-opacity-30">
        <div className="space-y-4">
          <p className="text-[#8899BB] text-sm">
            These actions cannot be undone. Please proceed with caution.
          </p>
          <Button
            variant="danger"
            href="#"
            size="md"
            disabled
          >
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
