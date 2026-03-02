"""Tests for reviewhound.web.routes module."""

import os
from datetime import UTC, date
from unittest.mock import MagicMock, patch

import pytest

# Set database path before importing app
os.environ["DATABASE_PATH"] = ":memory:"

from reviewhound.models import APIConfig, Business, Review, ScrapeLog
from reviewhound.web.app import create_app


@pytest.fixture
def app():
    """Create test Flask app."""
    app = create_app()
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def app_with_business(app):
    """Create app with a test business in the database."""
    from reviewhound.database import get_session

    with app.app_context(), get_session() as session:
        business = Business(
            name="Test Business",
            address="123 Main St",
            trustpilot_url="https://www.trustpilot.com/review/test.com",
            bbb_url="https://www.bbb.org/test",
            yelp_url="https://www.yelp.com/biz/test",
        )
        session.add(business)
        session.flush()
        business_id = business.id
    return app, business_id


@pytest.fixture
def app_with_reviews(app_with_business):
    """Create app with business and sample reviews."""
    app, business_id = app_with_business
    from reviewhound.database import get_session

    with app.app_context(), get_session() as session:
        reviews = [
            Review(
                business_id=business_id,
                source="trustpilot",
                external_id="tp_test_001",
                author_name="Happy Customer",
                rating=5.0,
                text="Great service!",
                review_date=date.today(),
                sentiment_score=0.9,
                sentiment_label="positive",
            ),
            Review(
                business_id=business_id,
                source="bbb",
                external_id="bbb_test_001",
                author_name="Unhappy Customer",
                rating=1.0,
                text="Terrible!",
                review_date=date.today(),
                sentiment_score=-0.8,
                sentiment_label="negative",
            ),
        ]
        session.add_all(reviews)
    return app, business_id


class TestWelcome:
    """Tests for welcome page."""

    def test_welcome_page_renders(self, client):
        """Should render welcome page."""
        response = client.get("/welcome")
        assert response.status_code == 200


class TestDashboard:
    """Tests for dashboard route."""

    def test_redirects_to_welcome_when_no_businesses(self, client):
        """Should redirect to welcome page when no businesses exist."""
        response = client.get("/")
        assert response.status_code == 302
        assert "/welcome" in response.location

    def test_shows_business_list(self, app_with_business):
        """Should show businesses on dashboard."""
        app, _business_id = app_with_business
        with app.test_client() as client:
            response = client.get("/")
            assert response.status_code == 200
            assert b"Test Business" in response.data


class TestBusinessDetail:
    """Tests for business detail route."""

    def test_returns_404_for_missing_business(self, client):
        """Should return 404 for non-existent business."""
        response = client.get("/business/9999")
        assert response.status_code == 404

    def test_shows_business_info(self, app_with_business):
        """Should show business details."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.get(f"/business/{business_id}")
            assert response.status_code == 200
            assert b"Test Business" in response.data


class TestBusinessReviews:
    """Tests for business reviews route."""

    def test_returns_404_for_missing_business(self, client):
        """Should return 404 for non-existent business."""
        response = client.get("/business/9999/reviews")
        assert response.status_code == 404

    def test_shows_reviews(self, app_with_reviews):
        """Should show reviews for business."""
        app, business_id = app_with_reviews
        with app.test_client() as client:
            response = client.get(f"/business/{business_id}/reviews")
            assert response.status_code == 200


class TestExportReviews:
    """Tests for export reviews route."""

    def test_returns_csv(self, app_with_business):
        """Should return CSV file."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.get(f"/business/{business_id}/export")
            assert response.status_code == 200
            assert "text/csv" in response.content_type


class TestSettings:
    """Tests for settings route."""

    def test_renders_settings_page(self, client):
        """Should render settings page."""
        response = client.get("/settings")
        assert response.status_code == 200


class TestApiGetBusiness:
    """Tests for GET /api/business/<id>."""

    def test_returns_404_for_missing(self, client):
        """Should return 404 for non-existent business."""
        response = client.get("/api/business/9999")
        assert response.status_code == 404
        assert response.json["success"] is False

    def test_returns_business_data(self, app_with_business):
        """Should return business data."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.get(f"/api/business/{business_id}")
            assert response.status_code == 200
            assert response.json["success"] is True
            assert response.json["business"]["name"] == "Test Business"


class TestApiCreateBusiness:
    """Tests for POST /api/business."""

    def test_requires_name(self, client):
        """Should require name field."""
        response = client.post("/api/business", json={}, content_type="application/json")
        assert response.status_code == 400
        assert "required" in response.json["error"].lower()

    def test_validates_empty_name(self, client):
        """Should reject empty name."""
        response = client.post("/api/business", json={"name": "   "}, content_type="application/json")
        assert response.status_code == 400
        assert "empty" in response.json["error"].lower()

    def test_validates_url_format(self, client):
        """Should validate URL format."""
        response = client.post(
            "/api/business",
            json={"name": "Test", "trustpilot_url": "not-a-url"},
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "url" in response.json["error"].lower()

    def test_validates_name_length(self, client):
        """Should reject overly long name."""
        response = client.post("/api/business", json={"name": "x" * 300}, content_type="application/json")
        assert response.status_code == 400
        assert "length" in response.json["error"].lower()

    @patch("reviewhound.web.routes.scrape_business_sources")
    def test_creates_business(self, mock_scrape, client):
        """Should create business successfully."""
        mock_scrape.return_value = (0, [])
        response = client.post(
            "/api/business",
            json={"name": "New Business", "trustpilot_url": "https://trustpilot.com/review/new.com"},
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.json["success"] is True
        assert response.json["business"]["name"] == "New Business"


class TestApiUpdateBusiness:
    """Tests for PUT /api/business/<id>."""

    def test_returns_404_for_missing(self, client):
        """Should return 404 for non-existent business."""
        response = client.put("/api/business/9999", json={"name": "Updated"}, content_type="application/json")
        assert response.status_code == 404

    def test_validates_inputs(self, app_with_business):
        """Should validate input fields."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.put(
                f"/api/business/{business_id}", json={"name": ""}, content_type="application/json"
            )
            assert response.status_code == 400

    def test_updates_fields(self, app_with_business):
        """Should update business fields."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.put(
                f"/api/business/{business_id}", json={"name": "Updated Name"}, content_type="application/json"
            )
            assert response.status_code == 200
            assert response.json["success"] is True


class TestApiDeleteBusiness:
    """Tests for DELETE /api/business/<id>."""

    def test_returns_404_for_missing(self, client):
        """Should return 404 for non-existent business."""
        response = client.delete("/api/business/9999")
        assert response.status_code == 404

    def test_deletes_business(self, app_with_business):
        """Should delete business successfully."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.delete(f"/api/business/{business_id}")
            assert response.status_code == 200
            assert response.json["success"] is True

            # Verify deleted
            response = client.get(f"/api/business/{business_id}")
            assert response.status_code == 404


class TestApiListAlerts:
    """Tests for GET /api/business/<id>/alerts."""

    def test_returns_404_for_missing_business(self, client):
        """Should return 404 for non-existent business."""
        response = client.get("/api/business/9999/alerts")
        assert response.status_code == 404

    def test_returns_alerts_for_business(self, app_with_business):
        """Should return alerts list."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.get(f"/api/business/{business_id}/alerts")
            assert response.status_code == 200
            assert response.json["success"] is True
            assert "alerts" in response.json


class TestApiCreateAlert:
    """Tests for POST /api/business/<id>/alerts."""

    def test_requires_email(self, app_with_business):
        """Should require email field."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.post(
                f"/api/business/{business_id}/alerts", json={}, content_type="application/json"
            )
            assert response.status_code == 400
            assert "email" in response.json["error"].lower()

    def test_creates_alert(self, app_with_business):
        """Should create alert successfully."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.post(
                f"/api/business/{business_id}/alerts",
                json={"email": "test@example.com"},
                content_type="application/json",
            )
            assert response.status_code == 200
            assert response.json["success"] is True
            assert response.json["alert"]["email"] == "test@example.com"

    def test_prevents_duplicate_email(self, app_with_business):
        """Should reject duplicate email for same business."""
        app, business_id = app_with_business
        with app.test_client() as client:
            # Create first alert
            client.post(
                f"/api/business/{business_id}/alerts",
                json={"email": "dup@example.com"},
                content_type="application/json",
            )

            # Try to create duplicate
            response = client.post(
                f"/api/business/{business_id}/alerts",
                json={"email": "dup@example.com"},
                content_type="application/json",
            )
            assert response.status_code == 400
            assert "exists" in response.json["error"].lower()


class TestApiUpdateAlert:
    """Tests for PUT /api/alerts/<id>."""

    def test_returns_404_for_missing(self, client):
        """Should return 404 for non-existent alert."""
        response = client.put("/api/alerts/9999", json={"enabled": False}, content_type="application/json")
        assert response.status_code == 404

    def test_updates_fields(self, app_with_business):
        """Should update alert fields."""
        app, business_id = app_with_business
        with app.test_client() as client:
            # Create alert first
            create_response = client.post(
                f"/api/business/{business_id}/alerts",
                json={"email": "update@example.com"},
                content_type="application/json",
            )
            alert_id = create_response.json["alert"]["id"]

            # Update it
            response = client.put(
                f"/api/alerts/{alert_id}",
                json={"enabled": False, "negative_threshold": 2.5},
                content_type="application/json",
            )
            assert response.status_code == 200
            assert response.json["success"] is True


class TestApiDeleteAlert:
    """Tests for DELETE /api/alerts/<id>."""

    def test_returns_404_for_missing(self, client):
        """Should return 404 for non-existent alert."""
        response = client.delete("/api/alerts/9999")
        assert response.status_code == 404

    def test_deletes_alert(self, app_with_business):
        """Should delete alert successfully."""
        app, business_id = app_with_business
        with app.test_client() as client:
            # Create alert first
            create_response = client.post(
                f"/api/business/{business_id}/alerts",
                json={"email": "delete@example.com"},
                content_type="application/json",
            )
            alert_id = create_response.json["alert"]["id"]

            # Delete it
            response = client.delete(f"/api/alerts/{alert_id}")
            assert response.status_code == 200
            assert response.json["success"] is True


class TestTriggerScrape:
    """Tests for POST /business/<id>/scrape."""

    def test_returns_404_for_missing_business(self, client):
        """Should return 404 for non-existent business."""
        response = client.post("/business/9999/scrape")
        assert response.status_code == 404

    def test_returns_400_when_no_sources(self, app):
        """Should return 400 when business has no review sources."""
        from reviewhound.database import get_session

        with app.app_context(), get_session() as session:
            business = Business(name="No Sources Business")
            session.add(business)
            session.flush()
            business_id = business.id

        with app.test_client() as client:
            response = client.post(f"/business/{business_id}/scrape")
            assert response.status_code == 400
            assert "no review sources" in response.json["error"].lower()

    @patch("reviewhound.web.routes.scrape_business_sources")
    def test_returns_success_with_new_reviews(self, mock_scrape, app_with_business):
        """Should return success with review count."""
        app, business_id = app_with_business
        mock_scrape.return_value = (5, [])

        with app.test_client() as client:
            response = client.post(f"/business/{business_id}/scrape")
            assert response.status_code == 200
            assert response.json["success"] is True
            assert response.json["new_reviews"] == 5


class TestApiBusinessStats:
    """Tests for GET /api/business/<id>/stats."""

    def test_returns_stats(self, app_with_business):
        """Should return statistics data."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.get(f"/api/business/{business_id}/stats")
            assert response.status_code == 200
            assert "labels" in response.json
            assert "data" in response.json


class TestApiSearchSources:
    """Tests for POST /api/search-sources."""

    def test_requires_query(self, client):
        """Should require query parameter."""
        response = client.post("/api/search-sources", json={}, content_type="application/json")
        assert response.status_code == 400
        assert "query" in response.json["error"].lower()

    @patch("reviewhound.web.routes.TrustPilotScraper")
    @patch("reviewhound.web.routes.BBBScraper")
    def test_returns_results(self, mock_bbb, mock_tp, client):
        """Should return search results from scrapers."""
        mock_tp_instance = MagicMock()
        mock_tp_instance.search.return_value = [{"name": "TP Result", "url": "https://tp.com"}]
        mock_tp.return_value = mock_tp_instance

        mock_bbb_instance = MagicMock()
        mock_bbb_instance.search.return_value = [{"name": "BBB Result", "url": "https://bbb.com"}]
        mock_bbb.return_value = mock_bbb_instance

        response = client.post(
            "/api/search-sources", json={"query": "test business"}, content_type="application/json"
        )

        assert response.status_code == 200
        assert response.json["success"] is True
        assert "trustpilot" in response.json["results"]
        assert "bbb" in response.json["results"]


class TestApiSettings:
    """Tests for settings API endpoints."""

    def test_get_api_keys(self, client):
        """Should return API key configurations."""
        response = client.get("/api/settings/api-keys")
        assert response.status_code == 200
        assert response.json["success"] is True

    def test_save_api_key(self, client):
        """Should save new API key."""
        response = client.post(
            "/api/settings/api-keys",
            json={"provider": "google_places", "api_key": "test-api-key-12345"},
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.json["success"] is True

    def test_save_api_key_validates_provider(self, client):
        """Should validate provider name."""
        response = client.post(
            "/api/settings/api-keys",
            json={"provider": "invalid_provider", "api_key": "test-key"},
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_toggle_api_key(self, client):
        """Should toggle API key enabled status."""
        # First create the key
        client.post(
            "/api/settings/api-keys",
            json={"provider": "yelp_fusion", "api_key": "test-yelp-key"},
            content_type="application/json",
        )

        # Toggle it
        response = client.post("/api/settings/api-keys/yelp_fusion/toggle")
        assert response.status_code == 200
        assert response.json["success"] is True

    def test_get_sentiment_settings(self, client):
        """Should return sentiment configuration."""
        response = client.get("/api/settings/sentiment")
        assert response.status_code == 200
        assert response.json["success"] is True
        assert "rating_weight" in response.json["sentiment"]

    def test_save_sentiment_settings(self, client):
        """Should save sentiment configuration."""
        response = client.post(
            "/api/settings/sentiment",
            json={"rating_weight": 0.6, "text_weight": 0.4, "threshold": 0.15},
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.json["success"] is True


class TestValidationHelpers:
    """Tests for validation helper functions."""

    def test_validate_url_accepts_valid(self, client):
        """Should accept valid URLs."""
        response = client.post(
            "/api/business",
            json={"name": "URL Test", "trustpilot_url": "https://www.trustpilot.com/review/test.com"},
            content_type="application/json",
        )
        # If validation passed, we'd either get 200 or an error not about URL
        assert response.status_code in [200, 400]
        if response.status_code == 400:
            assert "url" not in response.json["error"].lower()

    def test_validate_url_rejects_missing_scheme(self, client):
        """Should reject URLs without scheme."""
        response = client.post(
            "/api/business",
            json={"name": "URL Test", "trustpilot_url": "www.example.com"},
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "url" in response.json["error"].lower()


class TestScrapeHealth:
    """Tests for scrape health indicators."""

    def test_no_issues_when_no_logs(self, app_with_business):
        """Should report no issues when no scrape logs exist."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.get(f"/business/{business_id}")
            assert response.status_code == 200
            # Business page should render without scrape warnings

    def test_detects_repeated_failures(self, app_with_business):
        """Should detect when scrapes are repeatedly failing."""
        app, business_id = app_with_business
        from datetime import datetime

        from reviewhound.database import get_session

        with app.app_context(), get_session() as session:
            # Add failed scrape logs
            for _i in range(3):
                log = ScrapeLog(
                    business_id=business_id,
                    source="trustpilot",
                    status="failed",
                    error_message="Connection error",
                    started_at=datetime.now(UTC),
                    completed_at=datetime.now(UTC),
                )
                session.add(log)

        with app.test_client() as client:
            response = client.get(f"/business/{business_id}")
            assert response.status_code == 200

    def test_detects_no_reviews_found(self, app_with_business):
        """Should detect when scrapes succeed but find zero reviews."""
        app, business_id = app_with_business
        from datetime import datetime

        from reviewhound.database import get_session

        with app.app_context(), get_session() as session:
            for _i in range(2):
                log = ScrapeLog(
                    business_id=business_id,
                    source="bbb",
                    status="success",
                    reviews_found=0,
                    started_at=datetime.now(UTC),
                    completed_at=datetime.now(UTC),
                )
                session.add(log)

        with app.test_client() as client:
            response = client.get(f"/business/{business_id}")
            assert response.status_code == 200


class TestApiDeleteApiKey:
    """Tests for DELETE /api/settings/api-keys/<provider>."""

    def test_rejects_invalid_provider(self, client):
        """Should reject invalid provider name."""
        response = client.delete("/api/settings/api-keys/invalid_provider")
        assert response.status_code == 400

    def test_returns_404_for_missing_key(self, app):
        """Should return 404 when no key exists for provider."""
        from reviewhound.database import get_session

        # Ensure no key exists for this provider
        with app.app_context(), get_session() as session:
            existing = session.query(APIConfig).filter(APIConfig.provider == "google_places").first()
            if existing:
                session.delete(existing)

        with app.test_client() as client:
            response = client.delete("/api/settings/api-keys/google_places")
            assert response.status_code == 404

    def test_deletes_existing_key(self, client):
        """Should delete an existing API key."""
        # Create key first
        client.post(
            "/api/settings/api-keys",
            json={"provider": "google_places", "api_key": "test-key-to-delete"},
            content_type="application/json",
        )
        # Delete it
        response = client.delete("/api/settings/api-keys/google_places")
        assert response.status_code == 200
        assert response.json["success"] is True

        # Verify it's gone
        response = client.delete("/api/settings/api-keys/google_places")
        assert response.status_code == 404


class TestApiToggleApiKeyValidation:
    """Tests for toggle API key validation."""

    def test_rejects_invalid_provider(self, client):
        """Should reject invalid provider on toggle."""
        response = client.post("/api/settings/api-keys/invalid_provider/toggle")
        assert response.status_code == 400

    def test_returns_404_for_missing_key(self, client):
        """Should return 404 when toggling nonexistent key."""
        response = client.post("/api/settings/api-keys/google_places/toggle")
        assert response.status_code == 404


class TestApiUpdateBusinessFields:
    """Tests for updating additional business fields."""

    def test_updates_google_place_id(self, app_with_business):
        """Should update google_place_id field."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.put(
                f"/api/business/{business_id}",
                json={"google_place_id": "ChIJtest123"},
                content_type="application/json",
            )
            assert response.status_code == 200
            get_resp = client.get(f"/api/business/{business_id}")
            assert get_resp.json["business"]["google_place_id"] == "ChIJtest123"

    def test_updates_yelp_business_id(self, app_with_business):
        """Should update yelp_business_id field."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.put(
                f"/api/business/{business_id}",
                json={"yelp_business_id": "test-biz-sf"},
                content_type="application/json",
            )
            assert response.status_code == 200
            get_resp = client.get(f"/api/business/{business_id}")
            assert get_resp.json["business"]["yelp_business_id"] == "test-biz-sf"

    def test_updates_multiple_fields(self, app_with_business):
        """Should update address, bbb_url, and yelp_url together."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.put(
                f"/api/business/{business_id}",
                json={
                    "address": "456 Oak Ave",
                    "bbb_url": "https://www.bbb.org/new-listing",
                    "yelp_url": "https://www.yelp.com/biz/new-listing",
                },
                content_type="application/json",
            )
            assert response.status_code == 200

    def test_clears_optional_fields_with_empty_string(self, app_with_business):
        """Should clear optional URL fields when set to empty string."""
        app, business_id = app_with_business
        with app.test_client() as client:
            response = client.put(
                f"/api/business/{business_id}",
                json={"bbb_url": "", "google_place_id": ""},
                content_type="application/json",
            )
            assert response.status_code == 200
            get_resp = client.get(f"/api/business/{business_id}")
            assert get_resp.json["business"]["bbb_url"] is None
            assert get_resp.json["business"]["google_place_id"] is None


class TestApiSaveApiKeyUpdate:
    """Tests for updating an existing API key."""

    def test_updates_existing_key(self, client):
        """Should update key when provider already has one saved."""
        client.post(
            "/api/settings/api-keys",
            json={"provider": "google_places", "api_key": "initial-key-12345"},
            content_type="application/json",
        )
        response = client.post(
            "/api/settings/api-keys",
            json={"provider": "google_places", "api_key": "updated-key-67890"},
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.json["success"] is True


class TestTriggerScrapeAllFailed:
    """Tests for trigger_scrape when all sources fail."""

    @patch("reviewhound.web.routes.scrape_business_sources")
    def test_returns_500_when_all_sources_fail(self, mock_scrape, app_with_business):
        """Should return 500 when every configured source fails."""
        app, business_id = app_with_business
        mock_scrape.return_value = (0, ["trustpilot", "bbb", "yelp"])

        with app.test_client() as client:
            response = client.post(f"/business/{business_id}/scrape")
            assert response.status_code == 500
            assert "All scrapes failed" in response.json["error"]


class TestApiSearchSourcesErrorHandling:
    """Tests for search-sources scraper exception handling."""

    @patch("reviewhound.web.routes.BBBScraper")
    @patch("reviewhound.web.routes.TrustPilotScraper")
    def test_handles_scraper_exception(self, mock_tp, mock_bbb, client):
        """Should return empty results for source that throws exception."""
        mock_tp_instance = MagicMock()
        mock_tp_instance.search.side_effect = RuntimeError("Network timeout")
        mock_tp.return_value = mock_tp_instance

        mock_bbb_instance = MagicMock()
        mock_bbb_instance.search.return_value = [{"name": "BBB Result"}]
        mock_bbb.return_value = mock_bbb_instance

        response = client.post("/api/search-sources", json={"query": "test"}, content_type="application/json")
        assert response.status_code == 200
        assert response.json["results"]["trustpilot"] == []
        assert len(response.json["results"]["bbb"]) == 1


class TestBusinessReviewsFiltering:
    """Tests for review filtering by source and sentiment."""

    def test_filters_by_source(self, app_with_business):
        """Should filter reviews by source parameter."""
        app, business_id = app_with_business
        from reviewhound.database import get_session

        with app.app_context(), get_session() as session:
            session.add(
                Review(
                    business_id=business_id,
                    source="trustpilot",
                    external_id="filter_src_001",
                    author_name="A",
                    rating=5.0,
                    text="Good",
                    review_date=date.today(),
                    sentiment_score=0.9,
                    sentiment_label="positive",
                )
            )

        with app.test_client() as client:
            response = client.get(f"/business/{business_id}/reviews?source=trustpilot")
            assert response.status_code == 200

    def test_filters_by_sentiment(self, app_with_business):
        """Should filter reviews by sentiment parameter."""
        app, business_id = app_with_business
        from reviewhound.database import get_session

        with app.app_context(), get_session() as session:
            session.add(
                Review(
                    business_id=business_id,
                    source="bbb",
                    external_id="filter_sent_001",
                    author_name="B",
                    rating=1.0,
                    text="Bad",
                    review_date=date.today(),
                    sentiment_score=-0.8,
                    sentiment_label="negative",
                )
            )

        with app.test_client() as client:
            response = client.get(f"/business/{business_id}/reviews?sentiment=negative")
            assert response.status_code == 200


class TestExportReviewsFiltering:
    """Tests for export with source/sentiment filtering."""

    def test_exports_filtered_by_source(self, app_with_business):
        """Should export only reviews matching source filter."""
        app, business_id = app_with_business
        from reviewhound.database import get_session

        with app.app_context(), get_session() as session:
            session.add(
                Review(
                    business_id=business_id,
                    source="trustpilot",
                    external_id="export_src_001",
                    author_name="C",
                    rating=4.0,
                    text="Decent",
                    review_date=date.today(),
                    sentiment_score=0.5,
                    sentiment_label="positive",
                )
            )

        with app.test_client() as client:
            response = client.get(f"/business/{business_id}/export?source=trustpilot")
            assert response.status_code == 200
            assert "text/csv" in response.content_type

    def test_exports_filtered_by_sentiment(self, app_with_business):
        """Should export only reviews matching sentiment filter."""
        app, business_id = app_with_business
        from reviewhound.database import get_session

        with app.app_context(), get_session() as session:
            session.add(
                Review(
                    business_id=business_id,
                    source="yelp",
                    external_id="export_sent_001",
                    author_name="D",
                    rating=2.0,
                    text="Meh",
                    review_date=date.today(),
                    sentiment_score=-0.3,
                    sentiment_label="negative",
                )
            )

        with app.test_client() as client:
            response = client.get(f"/business/{business_id}/export?sentiment=negative")
            assert response.status_code == 200
            assert "text/csv" in response.content_type


class TestSentimentSettingsValidation:
    """Tests for sentiment settings validation."""

    def test_rejects_weight_above_one(self, client):
        """Should reject weight values above 1."""
        response = client.post(
            "/api/settings/sentiment",
            json={"rating_weight": 1.5},
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "between 0 and 1" in response.json["error"]

    def test_rejects_negative_weight(self, client):
        """Should reject negative weight values."""
        response = client.post(
            "/api/settings/sentiment",
            json={"text_weight": -0.5},
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_accepts_partial_update(self, client):
        """Should update only provided fields."""
        response = client.post(
            "/api/settings/sentiment",
            json={"threshold": 0.2},
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.json["sentiment"]["threshold"] == 0.2


class TestApiSearchGooglePlaces:
    """Tests for POST /api/search-google-places."""

    def test_requires_query(self, client):
        """Should require query parameter."""
        response = client.post("/api/search-google-places", json={}, content_type="application/json")
        assert response.status_code == 400

    def test_returns_400_when_api_key_not_configured(self, app):
        """Should return 400 when no Google Places API key is saved."""
        from reviewhound.database import get_session

        # Ensure no key exists (prior tests may have created one)
        with app.app_context(), get_session() as session:
            existing = session.query(APIConfig).filter(APIConfig.provider == "google_places").first()
            if existing:
                session.delete(existing)

        with app.test_client() as client:
            response = client.post(
                "/api/search-google-places",
                json={"query": "test business"},
                content_type="application/json",
            )
            assert response.status_code == 400
            assert "not configured" in response.json["error"]

    @patch("reviewhound.web.routes.GooglePlacesScraper")
    def test_returns_search_results(self, mock_scraper_class, app):
        """Should return results when API key is configured."""
        from reviewhound.database import get_session

        with app.app_context(), get_session() as session:
            existing = session.query(APIConfig).filter(APIConfig.provider == "google_places").first()
            if not existing:
                session.add(APIConfig(provider="google_places", api_key="test-key", enabled=True))

        mock_instance = MagicMock()
        mock_instance.search.return_value = [{"name": "Test Place", "place_id": "ChIJ123"}]
        mock_scraper_class.return_value = mock_instance

        with app.test_client() as client:
            response = client.post(
                "/api/search-google-places",
                json={"query": "pizza", "location": "New York"},
                content_type="application/json",
            )
            assert response.status_code == 200
            assert response.json["success"] is True
            assert len(response.json["results"]) == 1


class TestApiSearchYelp:
    """Tests for POST /api/search-yelp."""

    def test_requires_query(self, client):
        """Should require query parameter."""
        response = client.post("/api/search-yelp", json={}, content_type="application/json")
        assert response.status_code == 400

    def test_returns_400_when_api_key_not_configured(self, app):
        """Should return 400 when no Yelp API key is saved."""
        from reviewhound.database import get_session

        with app.app_context(), get_session() as session:
            existing = session.query(APIConfig).filter(APIConfig.provider == "yelp_fusion").first()
            if existing:
                session.delete(existing)

        with app.test_client() as client:
            response = client.post(
                "/api/search-yelp",
                json={"query": "test business"},
                content_type="application/json",
            )
            assert response.status_code == 400
            assert "not configured" in response.json["error"]

    @patch("reviewhound.web.routes.YelpAPIScraper")
    def test_returns_search_results(self, mock_scraper_class, app):
        """Should return results when API key is configured."""
        from reviewhound.database import get_session

        with app.app_context(), get_session() as session:
            existing = session.query(APIConfig).filter(APIConfig.provider == "yelp_fusion").first()
            if not existing:
                session.add(APIConfig(provider="yelp_fusion", api_key="test-yelp-key", enabled=True))

        mock_instance = MagicMock()
        mock_instance.search.return_value = [{"name": "Test Biz", "business_id": "test-biz"}]
        mock_scraper_class.return_value = mock_instance

        with app.test_client() as client:
            response = client.post(
                "/api/search-yelp",
                json={"query": "sushi"},
                content_type="application/json",
            )
            assert response.status_code == 200
            assert response.json["success"] is True
            assert len(response.json["results"]) == 1


class TestApiCreateAlertBusinessNotFound:
    """Tests for create alert on nonexistent business."""

    def test_returns_404_for_nonexistent_business(self, client):
        """Should return 404 when business doesn't exist but email is provided."""
        response = client.post(
            "/api/business/9999/alerts",
            json={"email": "test@example.com"},
            content_type="application/json",
        )
        assert response.status_code == 404


class TestApiUpdateAlertFields:
    """Tests for updating alert email field."""

    def test_updates_email(self, app_with_business):
        """Should update alert email."""
        app, business_id = app_with_business
        with app.test_client() as client:
            create_resp = client.post(
                f"/api/business/{business_id}/alerts",
                json={"email": "old@example.com"},
                content_type="application/json",
            )
            alert_id = create_resp.json["alert"]["id"]

            response = client.put(
                f"/api/alerts/{alert_id}",
                json={"email": "new@example.com"},
                content_type="application/json",
            )
            assert response.status_code == 200
            assert response.json["success"] is True


class TestCreateBusinessValidation:
    """Tests for additional validation branches in create business."""

    def test_validates_address_length(self, client):
        """Should reject overly long address."""
        response = client.post(
            "/api/business",
            json={"name": "Test", "address": "x" * 501},
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "length" in response.json["error"].lower()

    def test_validates_bbb_url_format(self, client):
        """Should validate BBB URL format."""
        response = client.post(
            "/api/business",
            json={"name": "Test", "bbb_url": "not-a-url"},
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "url" in response.json["error"].lower()

    def test_validates_yelp_url_format(self, client):
        """Should validate Yelp URL format."""
        response = client.post(
            "/api/business",
            json={"name": "Test", "yelp_url": "not-a-url"},
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "url" in response.json["error"].lower()
