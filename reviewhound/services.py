"""Shared business logic for Review Hound."""

import logging
from datetime import datetime, timezone

from reviewhound.config import Config
from reviewhound.models import Review, ScrapeLog, Business, SentimentConfig
from reviewhound.analysis import analyze_review
from reviewhound.alerts import check_and_send_alerts

logger = logging.getLogger(__name__)


def get_sentiment_weights(session) -> tuple[float, float, float]:
    """Get sentiment weights from database or defaults.

    Returns:
        Tuple of (rating_weight, text_weight, threshold)
    """
    config = session.query(SentimentConfig).first()
    if config:
        return config.rating_weight, config.text_weight, config.threshold
    return Config.SENTIMENT_RATING_WEIGHT, Config.SENTIMENT_TEXT_WEIGHT, Config.SENTIMENT_THRESHOLD


def save_scraped_reviews(
    session,
    business: Business,
    source: str,
    reviews_data: list[dict],
    send_alerts: bool = True,
) -> tuple[ScrapeLog, int]:
    """Save scraped reviews to the database.

    Args:
        session: Database session
        business: Business the reviews belong to
        source: Source name (e.g., 'trustpilot', 'bbb', 'yelp')
        reviews_data: List of review dicts from scraper
        send_alerts: Whether to check and send alerts for new reviews

    Returns:
        Tuple of (ScrapeLog, new_review_count)
    """
    log = ScrapeLog(
        business_id=business.id,
        source=source,
        status="running",
        started_at=datetime.now(timezone.utc),
    )
    session.add(log)
    session.flush()

    new_count = 0
    rating_weight, text_weight, threshold = get_sentiment_weights(session)

    for review_data in reviews_data:
        existing = session.query(Review).filter(
            Review.source == source,
            Review.external_id == review_data["external_id"],
        ).first()

        if existing:
            continue

        rating = review_data.get("rating")
        score, label = analyze_review(
            review_data.get("text", ""),
            rating,
            rating_weight=rating_weight,
            text_weight=text_weight,
            threshold=threshold,
        )

        review = Review(
            business_id=business.id,
            source=source,
            external_id=review_data["external_id"],
            author_name=review_data.get("author_name"),
            rating=rating,
            text=review_data.get("text"),
            review_date=review_data.get("review_date"),
            sentiment_score=score,
            sentiment_label=label,
        )
        session.add(review)
        new_count += 1

        if send_alerts:
            session.flush()
            check_and_send_alerts(session, business, review)

    log.status = "success"
    log.reviews_found = new_count
    log.completed_at = datetime.now(timezone.utc)

    return log, new_count


def run_scraper_for_business(
    session,
    business: Business,
    scraper,
    url: str,
    send_alerts: bool = True,
) -> tuple[ScrapeLog, int]:
    """Run a scraper and save results.

    Args:
        session: Database session
        business: Business to scrape
        scraper: Scraper instance with .source and .scrape() method
        url: URL to scrape
        send_alerts: Whether to send alerts for new reviews

    Returns:
        Tuple of (ScrapeLog, new_review_count)
    """
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
        reviews_data = scraper.scrape(url)
        new_count = 0
        rating_weight, text_weight, threshold = get_sentiment_weights(session)

        for review_data in reviews_data:
            existing = session.query(Review).filter(
                Review.source == source,
                Review.external_id == review_data["external_id"],
            ).first()

            if existing:
                continue

            rating = review_data.get("rating")
            score, label = analyze_review(
                review_data.get("text", ""),
                rating,
                rating_weight=rating_weight,
                text_weight=text_weight,
                threshold=threshold,
            )

            review = Review(
                business_id=business.id,
                source=source,
                external_id=review_data["external_id"],
                author_name=review_data.get("author_name"),
                rating=rating,
                text=review_data.get("text"),
                review_date=review_data.get("review_date"),
                sentiment_score=score,
                sentiment_label=label,
            )
            session.add(review)
            new_count += 1

            if send_alerts:
                session.flush()
                check_and_send_alerts(session, business, review)

        log.status = "success"
        log.reviews_found = new_count
        log.completed_at = datetime.now(timezone.utc)

        return log, new_count

    except Exception as e:
        logger.exception(f"Scrape failed for {business.name} from {source}: {e}")
        log.status = "failed"
        log.error_message = str(e)
        log.completed_at = datetime.now(timezone.utc)
        raise


def calculate_review_stats(reviews: list[Review]) -> dict:
    """Calculate statistics for a list of reviews.

    Args:
        reviews: List of Review objects

    Returns:
        Dict with keys: total, avg_rating, positive, negative, neutral,
        positive_pct, negative_pct, neutral_pct, by_source
    """
    total = len(reviews)

    if total == 0:
        return {
            "total": 0,
            "avg_rating": 0.0,
            "positive": 0,
            "negative": 0,
            "neutral": 0,
            "positive_pct": 0.0,
            "negative_pct": 0.0,
            "neutral_pct": 0.0,
            "by_source": {},
        }

    rated_reviews = [r for r in reviews if r.rating is not None]
    avg_rating = sum(r.rating for r in rated_reviews) / len(rated_reviews) if rated_reviews else 0.0

    positive = len([r for r in reviews if r.sentiment_label == "positive"])
    negative = len([r for r in reviews if r.sentiment_label == "negative"])
    neutral = len([r for r in reviews if r.sentiment_label == "neutral"])

    by_source = {}
    for r in reviews:
        by_source[r.source] = by_source.get(r.source, 0) + 1

    return {
        "total": total,
        "avg_rating": avg_rating,
        "positive": positive,
        "negative": negative,
        "neutral": neutral,
        "positive_pct": (positive / total * 100) if total else 0.0,
        "negative_pct": (negative / total * 100) if total else 0.0,
        "neutral_pct": (neutral / total * 100) if total else 0.0,
        "by_source": by_source,
    }
