from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.schedulers.blocking import BlockingScheduler

from reviewhound.config import Config
from reviewhound.database import get_session
from reviewhound.models import Business
from reviewhound.scrapers import TrustPilotScraper, BBBScraper, YelpScraper
from reviewhound.analysis import analyze_review
from reviewhound.alerts import check_and_send_alerts
from reviewhound.models import Review, ScrapeLog
from datetime import datetime, timezone


def scrape_all_businesses():
    """Job function to scrape all businesses."""
    print(f"[Scheduler] Starting scrape job at {datetime.now()}")

    with get_session() as session:
        businesses = session.query(Business).all()

        for business in businesses:
            _scrape_business_job(session, business)

    print(f"[Scheduler] Scrape job completed at {datetime.now()}")


def _scrape_business_job(session, business):
    """Scrape a single business (called by scheduler)."""
    print(f"[Scheduler] Scraping: {business.name}")

    scrapers = []
    if business.trustpilot_url:
        scrapers.append((TrustPilotScraper(), business.trustpilot_url))
    if business.bbb_url:
        scrapers.append((BBBScraper(), business.bbb_url))
    if business.yelp_url:
        scrapers.append((YelpScraper(), business.yelp_url))

    if not scrapers:
        print(f"[Scheduler]   No URLs configured for {business.name}")
        return

    for scraper, url in scrapers:
        _run_scraper_job(session, business, scraper, url)


def _run_scraper_job(session, business, scraper, url: str):
    """Run a single scraper (called by scheduler)."""
    source = scraper.source

    log = ScrapeLog(
        business_id=business.id,
        source=source,
        status="running",
        started_at=datetime.now(timezone.utc),
    )
    session.add(log)
    session.flush()

    try:
        reviews = scraper.scrape(url)
        new_count = 0

        for review_data in reviews:
            existing = session.query(Review).filter(
                Review.source == source,
                Review.external_id == review_data["external_id"],
            ).first()

            if existing:
                continue

            score, label = analyze_review(review_data.get("text", ""))

            review = Review(
                business_id=business.id,
                source=source,
                external_id=review_data["external_id"],
                author_name=review_data.get("author_name"),
                rating=review_data.get("rating"),
                text=review_data.get("text"),
                review_date=review_data.get("review_date"),
                sentiment_score=score,
                sentiment_label=label,
            )
            session.add(review)
            session.flush()  # Flush to ensure review has an ID before checking alerts
            check_and_send_alerts(session, business, review)
            new_count += 1

        log.status = "success"
        log.reviews_found = new_count
        log.completed_at = datetime.now(timezone.utc)
        print(f"[Scheduler]   {source}: {new_count} new reviews")

    except Exception as e:
        log.status = "failed"
        log.error_message = str(e)
        log.completed_at = datetime.now(timezone.utc)
        print(f"[Scheduler]   {source}: Failed - {e}")


def create_scheduler(blocking: bool = True) -> BackgroundScheduler | BlockingScheduler:
    """Create and configure the scheduler.

    Args:
        blocking: If True, returns BlockingScheduler (for standalone watch command).
                  If False, returns BackgroundScheduler (for web server integration).
    """
    if blocking:
        scheduler = BlockingScheduler()
    else:
        scheduler = BackgroundScheduler()

    # Add the scrape job
    scheduler.add_job(
        scrape_all_businesses,
        'interval',
        hours=Config.SCRAPE_INTERVAL_HOURS,
        id='scrape_all',
        name='Scrape all businesses',
        next_run_time=datetime.now()  # Run immediately on start
    )

    return scheduler


def run_scheduler():
    """Run the blocking scheduler (for CLI watch command)."""
    print(f"Starting scheduler (interval: {Config.SCRAPE_INTERVAL_HOURS} hours)")
    print("Press Ctrl+C to stop")

    scheduler = create_scheduler(blocking=True)

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\nScheduler stopped")
