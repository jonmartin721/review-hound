import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { LightboxImage } from '@/components/welcome/Lightbox';
import { HeroVideo } from '@/components/welcome/HeroVideo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WorkspaceSelector } from '@/components/layout/WorkspaceSelector';
import { GITHUB_REPO_URL } from '@/lib/portfolio';

export default function WelcomePage() {
  return (
    <div className="max-w-4xl mx-auto fade-in">
      {/* Workspace selector */}
      <div className="mb-10">
        <WorkspaceSelector />
      </div>

      {/* Hero video */}
      <div className="mb-16">
        <HeroVideo />
      </div>

      {/* Section 1: Add a Business */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <LightboxImage src="/screenshots/add-business.png" alt="Add business modal with source search results" width={1280} height={800} />
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">Add a Business</h2>
          <p className="text-muted-foreground">
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
          <h2 className="text-xl font-semibold text-foreground mb-3">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            See all your businesses at a glance with average ratings, review counts, and sentiment analysis. Color-coded bars show the balance of positive and negative feedback.
          </p>
        </div>
      </div>

      {/* Section 3: Review Details */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <LightboxImage src="/screenshots/business-detail.png" alt="Business detail page with rating trend chart and reviews" width={1280} height={800} />
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">Review Details</h2>
          <p className="text-muted-foreground">
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
          <h2 className="text-xl font-semibold text-foreground mb-3">Alerts</h2>
          <p className="text-muted-foreground">
            Save local alert rules and send email notifications for newly found reviews. Background checks still depend on the browser tab being open in hosted mode.
          </p>
        </div>
      </div>

      {/* Section 5: Settings */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <LightboxImage src="/screenshots/settings.png" alt="Settings page with API keys and sentiment analysis configuration" width={1280} height={800} />
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">Settings</h2>
          <p className="text-muted-foreground">
            Manage local API keys, tune sentiment scoring, reset the browser workspace, and jump to the full GitHub project when you want always-on monitoring.
          </p>
        </div>
      </div>

      {/* Open Source Footer */}
      <Card className="mb-10">
        <CardContent>
          <h2 className="text-xl font-semibold text-foreground mb-3">Open Source</h2>
          <p className="text-muted-foreground mb-5 leading-relaxed">
            Review Hound is fully open source under the MIT license. Clone the repo to self-host with always-on monitoring, a real database, and background scraping. Contributions, issues, and feature requests are welcome.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
                View on GitHub
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`${GITHUB_REPO_URL}/issues`} target="_blank" rel="noreferrer">
                Report an Issue
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`${GITHUB_REPO_URL}/pulls`} target="_blank" rel="noreferrer">
                Contribute
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
