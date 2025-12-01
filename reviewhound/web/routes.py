from collections import defaultdict
import json

from flask import Blueprint, render_template, request, jsonify

from reviewhound.config import Config
from reviewhound.database import get_session
from reviewhound.models import Business, Review, ScrapeLog
from reviewhound.scrapers import TrustPilotScraper, BBBScraper, YelpScraper
from reviewhound.services import run_scraper_for_business, calculate_review_stats

bp = Blueprint('main', __name__)


@bp.route('/')
def dashboard():
    with get_session() as session:
        businesses = session.query(Business).all()

        business_stats = []
        for b in businesses:
            reviews = session.query(Review).filter(Review.business_id == b.id).all()
            stats = calculate_review_stats(reviews)

            business_stats.append({
                'business': b,
                'total_reviews': stats["total"],
                'avg_rating': stats["avg_rating"],
                'positive_pct': stats["positive_pct"],
                'negative_pct': stats["negative_pct"],
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

        review_stats = calculate_review_stats(reviews)
        stats = {
            'total_reviews': review_stats["total"],
            'avg_rating': review_stats["avg_rating"],
            'positive_pct': review_stats["positive_pct"],
            'negative_pct': review_stats["negative_pct"],
        }

        # Chart data - group by month
        monthly_ratings = defaultdict(list)
        for r in reviews:
            if r.rating and r.review_date:
                key = r.review_date.strftime('%Y-%m')
                monthly_ratings[key].append(r.rating)

        sorted_months = sorted(monthly_ratings.keys())[-Config.CHART_MONTHS:]
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
        per_page = Config.REVIEWS_PER_PAGE
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
            try:
                log, new_count = run_scraper_for_business(
                    session, business, scraper, url, send_alerts=False
                )
                total_new += new_count
            except Exception:
                pass  # Error already logged by run_scraper_for_business

        return jsonify({'success': True, 'new_reviews': total_new})


@bp.route('/api/business/<int:business_id>/stats')
def api_business_stats(business_id):
    with get_session() as session:
        reviews = session.query(Review).filter(Review.business_id == business_id).all()

        monthly_ratings = defaultdict(list)
        for r in reviews:
            if r.rating and r.review_date:
                key = r.review_date.strftime('%Y-%m')
                monthly_ratings[key].append(r.rating)

        sorted_months = sorted(monthly_ratings.keys())[-Config.CHART_MONTHS:]

        return jsonify({
            'labels': sorted_months,
            'data': [sum(monthly_ratings[m])/len(monthly_ratings[m]) for m in sorted_months]
        })
