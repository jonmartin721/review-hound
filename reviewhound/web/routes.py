from collections import defaultdict
import csv
import io
import json

from flask import Blueprint, render_template, request, jsonify, Response

from reviewhound.config import Config
from reviewhound.database import get_session
from reviewhound.models import Business, Review, ScrapeLog, AlertConfig
from reviewhound.scrapers import TrustPilotScraper, BBBScraper
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

        if not scrapers:
            return jsonify({
                'success': False,
                'error': 'No review sources configured. Edit business to add TrustPilot or BBB URLs.'
            }), 400

        total_new = 0
        failed_sources = []
        for scraper, url in scrapers:
            try:
                log, new_count = run_scraper_for_business(
                    session, business, scraper, url, send_alerts=False
                )
                total_new += new_count
            except Exception:
                failed_sources.append(scraper.source)

        if failed_sources and len(failed_sources) == len(scrapers):
            return jsonify({
                'success': False,
                'error': f'All scrapes failed: {", ".join(failed_sources)}'
            }), 500

        return jsonify({
            'success': True,
            'new_reviews': total_new,
            'failed_sources': failed_sources if failed_sources else None
        })


@bp.route('/api/search-sources', methods=['POST'])
def api_search_sources():
    data = request.get_json()
    if not data or not data.get('query'):
        return jsonify({'success': False, 'error': 'Query is required'}), 400

    query = data['query']
    location = data.get('location')

    results = {
        'trustpilot': [],
        'bbb': [],
    }

    # Search each platform
    scrapers = [
        ('trustpilot', TrustPilotScraper()),
        ('bbb', BBBScraper()),
    ]

    for source, scraper in scrapers:
        try:
            results[source] = scraper.search(query, location)
        except Exception:
            results[source] = []

    return jsonify({'success': True, 'results': results})


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


@bp.route('/api/business', methods=['POST'])
def api_create_business():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'success': False, 'error': 'Name is required'}), 400

    with get_session() as session:
        business = Business(
            name=data['name'],
            address=data.get('address'),
            trustpilot_url=data.get('trustpilot_url'),
            bbb_url=data.get('bbb_url'),
            yelp_url=data.get('yelp_url'),
        )
        session.add(business)
        session.flush()
        return jsonify({
            'success': True,
            'business': {
                'id': business.id,
                'name': business.name
            }
        })


@bp.route('/api/business/<int:business_id>', methods=['GET'])
def api_get_business(business_id):
    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            return jsonify({'success': False, 'error': 'Business not found'}), 404

        return jsonify({
            'success': True,
            'business': {
                'id': business.id,
                'name': business.name,
                'address': business.address,
                'trustpilot_url': business.trustpilot_url,
                'bbb_url': business.bbb_url,
                'yelp_url': business.yelp_url,
            }
        })


@bp.route('/api/business/<int:business_id>', methods=['PUT'])
def api_update_business(business_id):
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            return jsonify({'success': False, 'error': 'Business not found'}), 404

        if 'name' in data:
            business.name = data['name']
        if 'address' in data:
            business.address = data['address']
        if 'trustpilot_url' in data:
            business.trustpilot_url = data['trustpilot_url']
        if 'bbb_url' in data:
            business.bbb_url = data['bbb_url']
        if 'yelp_url' in data:
            business.yelp_url = data['yelp_url']

        return jsonify({'success': True})


@bp.route('/api/business/<int:business_id>', methods=['DELETE'])
def api_delete_business(business_id):
    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            return jsonify({'success': False, 'error': 'Business not found'}), 404

        session.delete(business)
        return jsonify({'success': True})


@bp.route('/api/business/<int:business_id>/alerts', methods=['GET'])
def api_list_alerts(business_id):
    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            return jsonify({'success': False, 'error': 'Business not found'}), 404

        alerts = session.query(AlertConfig).filter(
            AlertConfig.business_id == business_id
        ).all()

        return jsonify({
            'success': True,
            'alerts': [{
                'id': a.id,
                'email': a.email,
                'negative_threshold': a.negative_threshold,
                'enabled': a.enabled,
            } for a in alerts]
        })


@bp.route('/api/business/<int:business_id>/alerts', methods=['POST'])
def api_create_alert(business_id):
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({'success': False, 'error': 'Email is required'}), 400

    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            return jsonify({'success': False, 'error': 'Business not found'}), 404

        existing = session.query(AlertConfig).filter(
            AlertConfig.business_id == business_id,
            AlertConfig.email == data['email']
        ).first()

        if existing:
            return jsonify({'success': False, 'error': 'Alert for this email already exists'}), 400

        alert = AlertConfig(
            business_id=business_id,
            email=data['email'],
            alert_on_negative=True,
            negative_threshold=float(data.get('negative_threshold', 3.0)),
            enabled=data.get('enabled', True),
        )
        session.add(alert)
        session.flush()

        return jsonify({
            'success': True,
            'alert': {
                'id': alert.id,
                'email': alert.email,
                'negative_threshold': alert.negative_threshold,
                'enabled': alert.enabled,
            }
        })


@bp.route('/api/alerts/<int:alert_id>', methods=['PUT'])
def api_update_alert(alert_id):
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    with get_session() as session:
        alert = session.query(AlertConfig).get(alert_id)
        if not alert:
            return jsonify({'success': False, 'error': 'Alert not found'}), 404

        if 'email' in data:
            alert.email = data['email']
        if 'negative_threshold' in data:
            alert.negative_threshold = float(data['negative_threshold'])
        if 'enabled' in data:
            alert.enabled = data['enabled']

        return jsonify({'success': True})


@bp.route('/api/alerts/<int:alert_id>', methods=['DELETE'])
def api_delete_alert(alert_id):
    with get_session() as session:
        alert = session.query(AlertConfig).get(alert_id)
        if not alert:
            return jsonify({'success': False, 'error': 'Alert not found'}), 404

        session.delete(alert)
        return jsonify({'success': True})


@bp.route('/business/<int:business_id>/export')
def export_reviews(business_id):
    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            return "Business not found", 404

        source = request.args.get('source', '')
        sentiment = request.args.get('sentiment', '')

        query = session.query(Review).filter(Review.business_id == business_id)

        if source:
            query = query.filter(Review.source == source)
        if sentiment:
            query = query.filter(Review.sentiment_label == sentiment)

        reviews = query.order_by(Review.scraped_at.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['source', 'author', 'rating', 'text', 'date', 'sentiment_score', 'sentiment_label'])

        for r in reviews:
            writer.writerow([
                r.source,
                r.author_name,
                r.rating,
                r.text,
                r.review_date,
                r.sentiment_score,
                r.sentiment_label,
            ])

        output.seek(0)
        safe_name = business.name.lower().replace(' ', '_')
        filename = f"{safe_name}_reviews.csv"

        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename={filename}'}
        )
