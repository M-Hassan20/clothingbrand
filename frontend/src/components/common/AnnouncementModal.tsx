'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { apiGet } from '@/lib/api/client';

interface AnnouncementResponse {
  enabled: boolean;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  dismissDays?: number;
  isPreview?: boolean;
}

interface AnnouncementModalProps {
  previewToken?: string;
}

function AnnouncementModalContent({ previewToken: explicitToken }: AnnouncementModalProps) {
  const searchParams = useSearchParams();
  const activeToken = explicitToken || searchParams.get('token') || searchParams.get('previewToken') || undefined;

  const [announcement, setAnnouncement] = useState<AnnouncementResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const query = activeToken ? `?token=${encodeURIComponent(activeToken)}` : '';
        const data = await apiGet<AnnouncementResponse>(`/announcement${query}`);
        if (!data) return;

        // If preview mode is active, always display
        if (data.isPreview) {
          setAnnouncement(data);
          setIsOpen(true);
          return;
        }

        // If disabled, don't display
        if (!data.enabled) return;

        // Check dismissal in localStorage
        const dismissedKey = 'announcement_dismissed_timestamp';
        const lastDismissed = localStorage.getItem(dismissedKey);

        if (lastDismissed) {
          const dismissTime = parseInt(lastDismissed, 10);
          const days = data.dismissDays || 1;
          const expiryTime = dismissTime + days * 24 * 60 * 60 * 1000;
          if (Date.now() < expiryTime) {
            return; // Still within dismissal window
          }
        }

        setAnnouncement(data);
        const timer = setTimeout(() => setIsOpen(true), 300);
        return () => clearTimeout(timer);
      } catch (err) {
        console.error('Failed to load announcement config:', err);
      }
    }

    fetchAnnouncement();
  }, [activeToken]);

  const handleClose = () => {
    setIsOpen(false);
    if (announcement && !announcement.isPreview) {
      localStorage.setItem('announcement_dismissed_timestamp', Date.now().toString());
    }
  };

  if (!isOpen || !announcement) return null;

  const displayTitle = announcement.title || 'Summer Sale is Live';
  const displaySubtitle = announcement.subtitle || 'Enjoy up to 40% off our curated luxury collection silhouettes.';
  const displayCtaText = announcement.ctaText || 'Shop Sale Now';
  const displayCtaLink = announcement.ctaLink || '/shop?collection=sale';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg min-h-[380px] bg-neutral-950 text-white rounded-xl shadow-2xl overflow-hidden border border-white/15 transform transition-all duration-300 scale-100 flex flex-col justify-end p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Full Banner Background Image */}
        {announcement.imageUrl ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={announcement.imageUrl}
              alt={displayTitle}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 500px"
              priority
            />
            {/* Overlay gradient to guarantee text readability over any background image */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/40" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-white hover:text-black flex items-center justify-center text-white/90 transition-all duration-200 border border-white/10 cursor-pointer"
          aria-label="Close Announcement"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Body over Background */}
        <div className="relative z-10 space-y-4 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white tracking-wide leading-tight drop-shadow-md">
            {displayTitle}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-200 font-sans leading-relaxed max-w-md mx-auto drop-shadow-sm">
            {displaySubtitle}
          </p>

          <div className="pt-2">
            <Link
              href={displayCtaLink}
              onClick={handleClose}
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-white text-neutral-950 font-semibold text-xs uppercase tracking-widest hover:bg-neutral-100 transition-all duration-300 shadow-xl rounded-md"
            >
              <span>{displayCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementModal(props: AnnouncementModalProps) {
  return (
    <Suspense fallback={null}>
      <AnnouncementModalContent {...props} />
    </Suspense>
  );
}
