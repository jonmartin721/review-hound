import Image from 'next/image';
import Link from 'next/link';
import { LightboxImage } from '@/components/ui/Lightbox';

export default function WelcomePage() {
  return (
    <div className="max-w-4xl mx-auto fade-in">
      {/* Header */}
      <div className="text-center mb-16">
        <Image src="/logo.png" alt="Review Hound" width={160} height={160} className="mx-auto mb-6" priority />
        <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-3">Welcome to Review Hound</h1>
        <p className="text-lg text-[var(--text-muted)] mb-6">Monitor and analyze your business reviews across platforms</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-contrast)] px-6 py-3 rounded-none hover:brightness-110 transition font-medium"
        >
          Get Started
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Section 1: Add a Business */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <LightboxImage src="/screenshots/add-business.png" alt="Add business modal with source search results" width={1280} height={800} />
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Add a Business</h2>
          <p className="text-[var(--text-secondary)]">
            Enter your business name and Review Hound will search TrustPilot, BBB, and other platforms to find your listings. Select the correct matches or enter URLs manually.
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
            Get notified when new negative reviews come in. Configure email alerts with customizable thresholds so you can respond quickly to customer concerns.
          </p>
        </div>
      </div>

      {/* Section 5: Settings */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <LightboxImage src="/screenshots/settings.png" alt="Settings page with API keys and sentiment analysis configuration" width={1280} height={800} />
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Settings</h2>
          <p className="text-[var(--text-secondary)]">
            Add API keys for Google Places and Yelp Fusion to access official review data. Fine-tune sentiment analysis weights to match your business needs.
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center py-8 border-t border-[var(--border)]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-contrast)] px-6 py-3 rounded-none hover:brightness-110 transition font-medium"
        >
          Get Started
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
