'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { User, Shield } from 'lucide-react';

export default function AccountOverviewPage() {
  const { fullName, email, role } = useAuthStore();

  useEffect(() => {
    document.title = 'My Account — Haus of Hafsah';
  }, []);

  return (
    <div className="space-y-8 font-sans">
      <div className="border-b border-border/40 pb-5">
        <h1 className="font-serif text-2xl text-charcoal tracking-wide">
          My Account
        </h1>
        <p className="text-xs text-brown-muted mt-1">
          Review your account profile settings and active memberships.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="border border-border/40 rounded-md p-6 bg-beige/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-accent/15 p-2.5 text-accent">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                Personal Information
              </h3>
              <p className="text-[10px] text-brown-muted mt-0.5">Manage your display details.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex justify-between">
              <span className="text-brown-muted">Full Name:</span>
              <span className="font-semibold text-charcoal">{fullName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brown-muted">Email:</span>
              <span className="font-semibold text-charcoal">{email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Security Role Info */}
        <div className="border border-border/40 rounded-md p-6 bg-beige/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-accent/15 p-2.5 text-accent">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                Security & Role
              </h3>
              <p className="text-[10px] text-brown-muted mt-0.5">Verification & clearance status.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex justify-between">
              <span className="text-brown-muted">Clearance Level:</span>
              <span className="font-bold text-success capitalize">{role?.toLowerCase() || 'Customer'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brown-muted">Status:</span>
              <span className="font-semibold text-charcoal">Active Verified</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-dashed border-border/50 rounded-md p-6 text-center bg-beige/10">
        <p className="text-xs text-brown-muted">
          Need to change your password or edit profile information? Contact our customer support at{' '}
          <a href="mailto:support@hausofhafsah.com" className="text-accent hover:underline font-semibold">
            support@hausofhafsah.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
