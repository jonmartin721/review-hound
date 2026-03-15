import Image from 'next/image';
import Link from 'next/link';
import { LightboxImage } from '@/components/ui/Lightbox';
import { GITHUB_REPO_URL } from '@/lib/portfolio';

export default function WelcomePage() {
  return (
    <div className="max-w-4xl mx-auto fade-in">
      {/* Header */}
      <div className="text-center mb-16">
        <Image src="/logo.png" alt="Review Hound" width={160} height={160} className="mx-auto mb-6" priority />
        <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-3">Welcome to Review Hound</h1>
        <p className="text-lg text-[var(--text-muted)] mb-6">
          Explore a browser-local sample workspace, then switch to an empty local workspace if you want to click around with your own data.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-contrast)] px-6 py-3 rounded-none hover:brightness-105 transition font-medium"
          >
            Open Sample Workspace
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-[var(--border)] px-6 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition font-medium"
          >
            View Full Project
          </a>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-4">
          This hosted version keeps data in your browser only. Scrapes and alerts can run while you are using it, but always-on monitoring still lives in the full project.
        </p>
      </div>

      {/* Hero video */}
      <div className="mb-16">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto border border-[var(--border)]"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Section 1: Add a Business */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <LightboxImage src="/screenshots/add-business.png" alt="Add business modal with source search results" width={1280} height={800} />
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Add a Business</h2>
          <p className="text-[var(--text-secondary)]">
            Search for Trustpilot and BBB profiles, save businesses locally in your browser, and kick off an initial scrape without standing up your own backend database.
          </p>
        </div>
      </div>

      {/* Section 2: Dashboard Overview */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <div className="md:order-2">
          <LightboxImage src="/screenshots/dashboard.png" alt="Dashboard with business cards showing ratings and sentiment" width={1280} height={800} />
        </div>
        <div className="md:order-1">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Dashboard Overview</h2>
          <p className="text-[var(--text-secondary)]">
            See all your businesses at a glance with average ratings, review counts, and sentiment analysis. Color-coded bars show the balance of positive and negative feedback.
          </p>
        </div>
      </div>

      {/* Section 3: Review Details */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <LightboxImage src="/screenshots/business-detail.png" alt="Business detail page with rating trend chart and reviews" width={1280} height={800} />
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Review Details</h2>
          <p className="text-[var(--text-secondary)]">
            Track rating trends over time with interactive charts. Browse individual reviews, filter by source or sentiment, and export data to CSV for further analysis.
          </p>
        </div>
      </div>

      {/* Section 4: Alerts */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <div className="md:order-2">
          <LightboxImage src="/screenshots/alerts.png" alt="Alert configuration modal with email and threshold settings" width={1280} height={800} />
        </div>
        <div className="md:order-1">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Alerts</h2>
          <p className="text-[var(--text-secondary)]">
            Save local alert rules and send email notifications for newly found reviews. Background checks still depend on the browser tab being open in hosted mode.
          </p>
        </div>
      </div>

      {/* Section 5: Settings */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <LightboxImage src="/screenshots/settings.png" alt="Settings page with API keys and sentiment analysis configuration" width={1280} height={800} />
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Settings</h2>
          <p className="text-[var(--text-secondary)]">
            Manage local API keys, tune sentiment scoring, reset the browser workspace, and jump to the full GitHub project when you want always-on monitoring.
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center py-8 border-t border-[var(--border)]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-contrast)] px-6 py-3 rounded-none hover:brightness-105 transition font-medium"
        >
          Open Sample Workspace
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
