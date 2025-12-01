from flask import Blueprint, render_template, request, jsonify
from datetime import datetime, timezone
import json

from reviewhound.database import get_session
from reviewhound.models import Business, Review, ScrapeLog
from reviewhound.scrapers import TrustPilotScraper, BBBScraper, YelpScraper
from reviewhound.analysis import analyze_review

bp = Blueprint('main', __name__)


@bp.route('/')
def dashboard():
    with get_session() as session:
        businesses = session.query(Business).all()

        business_stats = []
        for b in businesses:
            reviews = session.query(Review).filter(Review.business_id == b.id).all()
            total = len(reviews)
            avg_rating = sum(r.rating for r in reviews if r.rating) / len([r for r in reviews if r.rating]) if any(r.rating for r in reviews) else 0
            positive = len([r for r in reviews if r.sentiment_label == "positive"])
            negative = len([r for r in reviews if r.sentiment_label == "negative"])

            business_stats.append({
                'business': b,
                'total_reviews': total,
                'avg_rating': avg_rating,
                'positive_pct': (positive / total * 100) if total else 0,
                'negative_pct': (negative / total * 100) if total else 0,
            })

        return render_template('dashboard.html', businesses=business_stats)


@bp.route('/business/<int:business_id>')
def business_detail(business_id):
    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            return "Business not found", 404

        reviews = session.query(Review).filter(
            Review.business_id == business_id
        ).order_by(Review.scraped_at.desc()).all()

        scrape_logs = session.query(ScrapeLog).filter(
            ScrapeLog.business_id == business_id
        ).order_by(ScrapeLog.started_at.desc()).all()

        # Calculate stats
        total = len(reviews)
        avg_rating = sum(r.rating for r in reviews if r.rating) / len([r for r in reviews if r.rating]) if any(r.rating for r in reviews) else 0
        positive = len([r for r in reviews if r.sentiment_label == "positive"])
        negative = len([r for r in reviews if r.sentiment_label == "negative"])

        stats = {
            'total_reviews': total,
            'avg_rating': avg_rating,
            'positive_pct': (positive / total * 100) if total else 0,
            'negative_pct': (negative / total * 100) if total else 0,
        }

        # Chart data - group by month
        from collections import defaultdict
        monthly_ratings = defaultdict(list)
        for r in reviews:
            if r.rating and r.review_date:
                key = r.review_date.strftime('%Y-%m')
                monthly_ratings[key].append(r.rating)

        sorted_months = sorted(monthly_ratings.keys())[-12:]  # Last 12 months
        chart_labels = sorted_months
        chart_data = [sum(monthly_ratings[m])/len(monthly_ratings[m]) for m in sorted_months]

        return render_template('business.html',
            business=business,
            reviews=reviews,
            scrape_logs=scrape_logs,
            stats=stats,
            chart_labels=json.dumps(chart_labels),
            chart_data=json.dumps(chart_data)
        )


@bp.route('/business/<int:business_id>/reviews')
def business_reviews(business_id):
    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            return "Business not found", 404

        page = request.args.get('page', 1, type=int)
        per_page = 20
        source = request.args.get('source', '')
        sentiment = request.args.get('sentiment', '')

        query = session.query(Review).filter(Review.business_id == business_id)

        if source:
            query = query.filter(Review.source == source)
        if sentiment:
            query = query.filter(Review.sentiment_label == sentiment)

        total = query.count()
        total_pages = (total + per_page - 1) // per_page

        reviews = query.order_by(Review.scraped_at.desc()).offset((page-1)*per_page).limit(per_page).all()

        return render_template('reviews.html',
            business=business,
            reviews=reviews,
            page=page,
            total_pages=total_pages
        )


@bp.route('/business/<int:business_id>/scrape', methods=['POST'])
def trigger_scrape(business_id):
    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            return jsonify({'success': False, 'error': 'Business not found'}), 404

        scrapers = []
        if business.trustpilot_url:
            scrapers.append((TrustPilotScraper(), business.trustpilot_url))
        if business.bbb_url:
            scrapers.append((BBBScraper(), business.bbb_url))
        if business.yelp_url:
            scrapers.append((YelpScraper(), business.yelp_url))

        total_new = 0
        for scraper, url in scrapers:
            log = ScrapeLog(
                business_id=business.id,
                source=scraper.source,
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
                        Review.source == scraper.source,
                        Review.external_id == review_data["external_id"],
                    ).first()

                    if existing:
                        continue

                    score, label = analyze_review(review_data.get("text", ""))

                    review = Review(
                        business_id=business.id,
                        source=scraper.source,
                        external_id=review_data["external_id"],
                        author_name=review_data.get("author_name"),
                        rating=review_data.get("rating"),
                        text=review_data.get("text"),
                        review_date=review_data.get("review_date"),
                        sentiment_score=score,
                        sentiment_label=label,
                    )
                    session.add(review)
                    new_count += 1

                log.status = "success"
                log.reviews_found = new_count
                log.completed_at = datetime.now(timezone.utc)
                total_new += new_count

            except Exception as e:
                log.status = "failed"
                log.error_message = str(e)
                log.completed_at = datetime.now(timezone.utc)

        return jsonify({'success': True, 'new_reviews': total_new})


@bp.route('/api/business/<int:business_id>/stats')
def api_business_stats(business_id):
    with get_session() as session:
        reviews = session.query(Review).filter(Review.business_id == business_id).all()

        from collections import defaultdict
        monthly_ratings = defaultdict(list)
        for r in reviews:
            if r.rating and r.review_date:
                key = r.review_date.strftime('%Y-%m')
                monthly_ratings[key].append(r.rating)

        sorted_months = sorted(monthly_ratings.keys())[-12:]

        return jsonify({
            'labels': sorted_months,
            'data': [sum(monthly_ratings[m])/len(monthly_ratings[m]) for m in sorted_months]
        })
