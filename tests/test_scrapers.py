from datetime import date
from pathlib import Path
from unittest.mock import MagicMock, patch

import requests
import responses

from reviewhound.scrapers.bbb import BBBScraper
from reviewhound.scrapers.google_places import GooglePlacesScraper
from reviewhound.scrapers.trustpilot import TrustPilotScraper
from reviewhound.scrapers.yelp import YelpScraper
from reviewhound.scrapers.yelp_api import YelpAPIScraper

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def load_fixture(name: str) -> str:
    return (FIXTURES_DIR / name).read_text()


class TestTrustPilotScraper:
    @responses.activate
    def test_scrape_extracts_reviews(self):
        html = load_fixture("trustpilot_page1.html")
        responses.add(
            responses.GET,
            "https://www.trustpilot.com/review/example.com",
            body=html,
            status=200,
        )
        responses.add(
            responses.GET,
            "https://www.trustpilot.com/review/example.com?page=2",
            body="<html><body></body></html>",
            status=200,
        )
        responses.add(
            responses.GET,
            "https://www.trustpilot.com/review/example.com?page=3",
            body="<html><body></body></html>",
            status=200,
        )

        with patch.object(TrustPilotScraper, "rate_limit"):
            scraper = TrustPilotScraper()
            reviews = scraper.scrape("https://www.trustpilot.com/review/example.com")

        assert len(reviews) == 2

        assert reviews[0]["external_id"] == "review_abc123"
        assert reviews[0]["author_name"] == "John Smith"
        assert reviews[0]["rating"] == 5.0
        assert reviews[0]["text"] == "Excellent service! Would highly recommend."
        assert reviews[0]["review_date"] == date(2024, 12, 15)

        assert reviews[1]["external_id"] == "review_def456"
        assert reviews[1]["author_name"] == "Jane Doe"
        assert reviews[1]["rating"] == 3.0

    @responses.activate
    def test_scrape_handles_http_error(self):
        responses.add(
            responses.GET,
            "https://www.trustpilot.com/review/example.com",
            status=404,
        )

        with patch.object(TrustPilotScraper, "rate_limit"):
            scraper = TrustPilotScraper()
            reviews = scraper.scrape("https://www.trustpilot.com/review/example.com")

        assert reviews == []

    @responses.activate
    def test_scrape_paginates(self):
        html = load_fixture("trustpilot_page1.html")
        responses.add(
            responses.GET,
            "https://www.trustpilot.com/review/example.com",
            body=html,
            status=200,
        )
        responses.add(
            responses.GET,
            "https://www.trustpilot.com/review/example.com?page=2",
            body=html,
            status=200,
        )
        responses.add(
            responses.GET,
            "https://www.trustpilot.com/review/example.com?page=3",
            body=html,
            status=200,
        )

        with patch.object(TrustPilotScraper, "rate_limit"):
            scraper = TrustPilotScraper()
            reviews = scraper.scrape("https://www.trustpilot.com/review/example.com")

        # 2 reviews per page * 3 pages = 6 reviews
        assert len(reviews) == 6
        # Verify all 3 pages were fetched
        assert len(responses.calls) == 3

    def test_source_is_trustpilot(self):
        scraper = TrustPilotScraper()
        assert scraper.source == "trustpilot"

    @responses.activate
    def test_scrape_json_ld_format(self):
        """Test parsing reviews from JSON-LD structured data."""
        html = load_fixture("trustpilot_jsonld.html")
        responses.add(
            responses.GET,
            "https://www.trustpilot.com/review/example.com",
            body=html,
            status=200,
        )
        responses.add(
            responses.GET,
            "https://www.trustpilot.com/review/example.com?page=2",
            body="<html><body></body></html>",
            status=200,
        )
        responses.add(
            responses.GET,
            "https://www.trustpilot.com/review/example.com?page=3",
            body="<html><body></body></html>",
            status=200,
        )

        with patch.object(TrustPilotScraper, "rate_limit"):
            scraper = TrustPilotScraper()
            reviews = scraper.scrape("https://www.trustpilot.com/review/example.com")

        assert len(reviews) == 2

        # First review uses standard schema.org format
        assert reviews[0]["external_id"] == "abc123def456"
        assert reviews[0]["author_name"] == "John Reviewer"
        assert reviews[0]["rating"] == 5.0
        assert reviews[0]["text"] == "Excellent product and service!"
        assert reviews[0]["review_date"] == date(2024, 12, 15)

        # Second review uses TrustPilot-specific fields
        assert reviews[1]["external_id"] == "xyz789uvw012"
        assert reviews[1]["author_name"] == "Jane Customer"
        assert reviews[1]["rating"] == 3.0
        assert "Okay experience" in reviews[1]["text"]
        assert reviews[1]["review_date"] == date(2024, 11, 20)


class TestBBBScraper:
    @responses.activate
    def test_scrape_extracts_reviews(self):
        html = load_fixture("bbb_page1.html")
        # BBB scraper normalizes URLs to /customer-reviews
        responses.add(
            responses.GET,
            "https://www.bbb.org/us/ca/los-angeles/profile/pizza/test-company-1234/customer-reviews",
            body=html,
            status=200,
        )

        with patch.object(BBBScraper, "rate_limit"):
            scraper = BBBScraper()
            reviews = scraper.scrape("https://www.bbb.org/us/ca/los-angeles/profile/pizza/test-company-1234")

        assert len(reviews) == 3

        assert reviews[0]["external_id"] == "bbb_rev_001"
        assert reviews[0]["author_name"] == "Michael Johnson"
        assert reviews[0]["rating"] == 5.0
        assert "Outstanding customer service" in reviews[0]["text"]
        assert reviews[0]["review_date"] == date(2024, 11, 20)

        assert reviews[1]["external_id"] == "bbb_rev_002"
        assert reviews[1]["author_name"] == "Sarah Williams"
        assert reviews[1]["rating"] == 2.0

        assert reviews[2]["external_id"] == "bbb_rev_003"
        assert reviews[2]["author_name"] == "Anonymous"
        assert reviews[2]["rating"] == 4.0

    @responses.activate
    def test_scrape_handles_http_error(self):
        responses.add(
            responses.GET,
            "https://www.bbb.org/us/ca/test/profile/test-1234",
            status=404,
        )

        with patch.object(BBBScraper, "rate_limit"):
            scraper = BBBScraper()
            reviews = scraper.scrape("https://www.bbb.org/us/ca/test/profile/test-1234")

        assert reviews == []

    @responses.activate
    def test_scrape_includes_complaints(self):
        html = load_fixture("bbb_page1.html")
        # BBB scraper normalizes URLs to /customer-reviews
        responses.add(
            responses.GET,
            "https://www.bbb.org/us/ca/test/profile/test-1234/customer-reviews",
            body=html,
            status=200,
        )

        with patch.object(BBBScraper, "rate_limit"):
            scraper = BBBScraper()
            reviews = scraper.scrape(
                "https://www.bbb.org/us/ca/test/profile/test-1234", include_complaints=True
            )

        # 3 reviews + 1 complaint = 4 total
        assert len(reviews) == 4
        complaint = next(r for r in reviews if "complaint" in r["external_id"])
        assert complaint["external_id"] == "bbb_complaint_001"
        assert complaint["rating"] == 1.0  # Complaints default to 1-star

    def test_source_is_bbb(self):
        scraper = BBBScraper()
        assert scraper.source == "bbb"


class TestYelpScraper:
    @responses.activate
    def test_scrape_extracts_reviews(self):
        html = load_fixture("yelp_page1.html")
        responses.add(
            responses.GET,
            "https://www.yelp.com/biz/test-restaurant",
            body=html,
            status=200,
        )
        responses.add(
            responses.GET,
            "https://www.yelp.com/biz/test-restaurant?start=10",
            body="<html><body></body></html>",
            status=200,
        )
        responses.add(
            responses.GET,
            "https://www.yelp.com/biz/test-restaurant?start=20",
            body="<html><body></body></html>",
            status=200,
        )

        with patch.object(YelpScraper, "rate_limit"):
            scraper = YelpScraper()
            reviews = scraper.scrape("https://www.yelp.com/biz/test-restaurant")

        assert len(reviews) == 3

        assert reviews[0]["external_id"] == "yelp_12345abc"
        assert reviews[0]["author_name"] == "Alex Thompson"
        assert reviews[0]["rating"] == 5.0
        assert "Amazing food and excellent service" in reviews[0]["text"]
        assert reviews[0]["review_date"] == date(2024, 11, 15)

        assert reviews[1]["external_id"] == "yelp_67890def"
        assert reviews[1]["author_name"] == "Maria Garcia"
        assert reviews[1]["rating"] == 3.0
        assert "Food was decent" in reviews[1]["text"]
        assert reviews[1]["review_date"] == date(2024, 10, 22)

        assert reviews[2]["external_id"] == "yelp_11223ghi"
        assert reviews[2]["author_name"] == "Robert Chen"
        assert reviews[2]["rating"] == 1.0

    @responses.activate
    def test_scrape_handles_http_error(self):
        responses.add(
            responses.GET,
            "https://www.yelp.com/biz/test-restaurant",
            status=404,
        )

        with patch.object(YelpScraper, "rate_limit"):
            scraper = YelpScraper()
            reviews = scraper.scrape("https://www.yelp.com/biz/test-restaurant")

        assert reviews == []

    @responses.activate
    def test_scrape_paginates(self):
        html = load_fixture("yelp_page1.html")
        responses.add(
            responses.GET,
            "https://www.yelp.com/biz/test-restaurant",
            body=html,
            status=200,
        )
        responses.add(
            responses.GET,
            "https://www.yelp.com/biz/test-restaurant?start=10",
            body=html,
            status=200,
        )
        responses.add(
            responses.GET,
            "https://www.yelp.com/biz/test-restaurant?start=20",
            body=html,
            status=200,
        )

        with patch.object(YelpScraper, "rate_limit"):
            scraper = YelpScraper()
            reviews = scraper.scrape("https://www.yelp.com/biz/test-restaurant")

        # 3 reviews per page * 3 pages = 9 reviews
        assert len(reviews) == 9
        # Verify all 3 pages were fetched
        assert len(responses.calls) == 3

    def test_source_is_yelp(self):
        scraper = YelpScraper()
        assert scraper.source == "yelp"


class TestGooglePlacesScraper:
    def _make_mock_response(self, json_data):
        mock_resp = MagicMock()
        mock_resp.json.return_value = json_data
        mock_resp.raise_for_status.return_value = None
        return mock_resp

    def test_scrape_returns_reviews(self):
        api_response = {
            "status": "OK",
            "result": {
                "reviews": [
                    {
                        "author_name": "Alice Brown",
                        "rating": 5,
                        "text": "Fantastic place!",
                        "time": 1700000000,
                    },
                    {
                        "author_name": "Bob Smith",
                        "rating": 3,
                        "text": "Decent but not great.",
                        "time": 1695000000,
                    },
                ]
            },
        }

        with patch("requests.get", return_value=self._make_mock_response(api_response)):
            scraper = GooglePlacesScraper(api_key="test-key")
            reviews = scraper.scrape("ChIJtest123")

        assert len(reviews) == 2

        assert reviews[0]["author_name"] == "Alice Brown"
        assert reviews[0]["rating"] == 5.0
        assert reviews[0]["text"] == "Fantastic place!"
        assert reviews[0]["review_date"] == date.fromtimestamp(1700000000)
        assert reviews[0]["review_url"] == "https://search.google.com/local/reviews?placeid=ChIJtest123"
        assert "google_" in reviews[0]["external_id"]

        assert reviews[1]["author_name"] == "Bob Smith"
        assert reviews[1]["rating"] == 3.0

    def test_scrape_handles_api_error_status(self):
        api_response = {
            "status": "REQUEST_DENIED",
            "error_message": "API key missing or invalid.",
        }

        with patch("requests.get", return_value=self._make_mock_response(api_response)):
            scraper = GooglePlacesScraper(api_key="bad-key")
            reviews = scraper.scrape("ChIJtest123")

        assert reviews == []

    def test_scrape_handles_request_exception(self):
        with patch("requests.get", side_effect=requests.RequestException("timeout")):
            scraper = GooglePlacesScraper(api_key="test-key")
            reviews = scraper.scrape("ChIJtest123")

        assert reviews == []

    def test_parse_review_handles_missing_fields(self):
        # Review with no time, no rating, no author_name
        api_response = {
            "status": "OK",
            "result": {
                "reviews": [
                    {"text": "No metadata review."},
                ]
            },
        }

        with patch("requests.get", return_value=self._make_mock_response(api_response)):
            scraper = GooglePlacesScraper(api_key="test-key")
            reviews = scraper.scrape("ChIJtest123")

        assert len(reviews) == 1
        assert reviews[0]["review_date"] is None
        assert reviews[0]["rating"] is None
        assert reviews[0]["author_name"] == "Anonymous"
        assert reviews[0]["text"] == "No metadata review."

    def test_search_returns_results(self):
        api_response = {
            "status": "OK",
            "results": [
                {
                    "name": "The Coffee House",
                    "formatted_address": "123 Main St, Springfield, IL",
                    "rating": 4.5,
                    "user_ratings_total": 312,
                    "place_id": "ChIJabc456",
                },
                {
                    "name": "Coffee Corner",
                    "formatted_address": "456 Oak Ave, Springfield, IL",
                    "rating": 3.8,
                    "user_ratings_total": 89,
                    "place_id": "ChIJdef789",
                },
            ],
        }

        with patch("requests.get", return_value=self._make_mock_response(api_response)):
            scraper = GooglePlacesScraper(api_key="test-key")
            results = scraper.search("coffee shop", location="Springfield IL")

        assert len(results) == 2
        assert results[0]["name"] == "The Coffee House"
        assert results[0]["address"] == "123 Main St, Springfield, IL"
        assert results[0]["rating"] == 4.5
        assert results[0]["review_count"] == 312
        assert results[0]["place_id"] == "ChIJabc456"
        assert results[0]["url"] is None

    def test_search_handles_api_error(self):
        api_response = {"status": "OVER_QUERY_LIMIT"}

        with patch("requests.get", return_value=self._make_mock_response(api_response)):
            scraper = GooglePlacesScraper(api_key="test-key")
            results = scraper.search("coffee shop")

        assert results == []


class TestYelpAPIScraper:
    def _make_mock_response(self, json_data):
        mock_resp = MagicMock()
        mock_resp.json.return_value = json_data
        mock_resp.raise_for_status.return_value = None
        return mock_resp

    def test_scrape_returns_reviews(self):
        api_response = {
            "reviews": [
                {
                    "id": "xAG284MjKg560ahFUiV-Jw",
                    "url": "https://www.yelp.com/biz/gary-danko-san-francisco?hrid=xAG284MjKg560ahFUiV-Jw",
                    "text": "The best meal I've had in years.",
                    "rating": 5,
                    "time_created": "2024-03-15 18:45:00",
                    "user": {"name": "Carol White"},
                },
                {
                    "id": "zBH395NkLh671biGVjW-Kx",
                    "url": "https://www.yelp.com/biz/gary-danko-san-francisco?hrid=zBH395NkLh671biGVjW-Kx",
                    "text": "Good but overpriced.",
                    "rating": 3,
                    "time_created": "2024-02-10 12:00:00",
                    "user": {"name": "Dan Torres"},
                },
            ]
        }

        with patch("requests.get", return_value=self._make_mock_response(api_response)):
            scraper = YelpAPIScraper(api_key="test-key")
            reviews = scraper.scrape("gary-danko-san-francisco")

        assert len(reviews) == 2

        assert reviews[0]["external_id"] == "xAG284MjKg560ahFUiV-Jw"
        assert reviews[0]["author_name"] == "Carol White"
        assert reviews[0]["rating"] == 5.0
        assert reviews[0]["text"] == "The best meal I've had in years."
        assert reviews[0]["review_date"] == date(2024, 3, 15)
        assert (
            reviews[0]["review_url"]
            == "https://www.yelp.com/biz/gary-danko-san-francisco?hrid=xAG284MjKg560ahFUiV-Jw"
        )

        assert reviews[1]["author_name"] == "Dan Torres"
        assert reviews[1]["rating"] == 3.0

    def test_scrape_handles_request_exception(self):
        with patch("requests.get", side_effect=requests.RequestException("connection error")):
            scraper = YelpAPIScraper(api_key="test-key")
            reviews = scraper.scrape("gary-danko-san-francisco")

        assert reviews == []

    def test_parse_review_constructs_url_when_missing(self):
        api_response = {
            "reviews": [
                {
                    "id": "review-abc-123",
                    "text": "Great tacos.",
                    "rating": 4,
                    "time_created": "2024-05-01 09:30:00",
                    "user": {"name": "Eva Green"},
                    # no "url" key
                },
            ]
        }

        with patch("requests.get", return_value=self._make_mock_response(api_response)):
            scraper = YelpAPIScraper(api_key="test-key")
            reviews = scraper.scrape("best-tacos-austin")

        assert reviews[0]["review_url"] == "https://www.yelp.com/biz/best-tacos-austin?hrid=review-abc-123"

    def test_parse_review_uses_provided_url(self):
        provided_url = "https://www.yelp.com/biz/some-place?hrid=already-set"
        api_response = {
            "reviews": [
                {
                    "id": "already-set",
                    "url": provided_url,
                    "text": "Nice spot.",
                    "rating": 4,
                    "time_created": "2024-06-20 14:00:00",
                    "user": {"name": "Frank Hill"},
                },
            ]
        }

        with patch("requests.get", return_value=self._make_mock_response(api_response)):
            scraper = YelpAPIScraper(api_key="test-key")
            reviews = scraper.scrape("some-place")

        assert reviews[0]["review_url"] == provided_url

    def test_search_returns_results(self):
        api_response = {
            "businesses": [
                {
                    "id": "gary-danko-san-francisco",
                    "name": "Gary Danko",
                    "rating": 4.5,
                    "review_count": 4280,
                    "url": "https://www.yelp.com/biz/gary-danko-san-francisco",
                    "image_url": "https://s3-media.yelp.com/photo.jpg",
                    "location": {
                        "address1": "800 N Point St",
                        "city": "San Francisco",
                        "state": "CA",
                    },
                },
            ]
        }

        with patch("requests.get", return_value=self._make_mock_response(api_response)):
            scraper = YelpAPIScraper(api_key="test-key")
            results = scraper.search("Gary Danko", location="San Francisco CA")

        assert len(results) == 1
        assert results[0]["name"] == "Gary Danko"
        assert results[0]["address"] == "800 N Point St, San Francisco, CA"
        assert results[0]["rating"] == 4.5
        assert results[0]["review_count"] == 4280
        assert results[0]["business_id"] == "gary-danko-san-francisco"
        assert results[0]["url"] == "https://www.yelp.com/biz/gary-danko-san-francisco"
        assert results[0]["thumbnail_url"] == "https://s3-media.yelp.com/photo.jpg"

    def test_search_handles_request_exception(self):
        with patch("requests.get", side_effect=requests.RequestException("timeout")):
            scraper = YelpAPIScraper(api_key="test-key")
            results = scraper.search("tacos")

        assert results == []

    def test_search_handles_partial_location(self):
        # Business with only city set, no address1 or state
        api_response = {
            "businesses": [
                {
                    "id": "some-cafe-portland",
                    "name": "Some Cafe",
                    "rating": 4.0,
                    "review_count": 55,
                    "url": "https://www.yelp.com/biz/some-cafe-portland",
                    "image_url": None,
                    "location": {
                        "address1": "",
                        "city": "Portland",
                        "state": "",
                    },
                },
            ]
        }

        with patch("requests.get", return_value=self._make_mock_response(api_response)):
            scraper = YelpAPIScraper(api_key="test-key")
            results = scraper.search("cafe", location="Portland")

        assert len(results) == 1
        assert results[0]["address"] == "Portland"


class TestBBBScraperJsonLd:
    REVIEWS_URL = "https://www.bbb.org/us/ca/test/profile/test-1234/customer-reviews"

    @responses.activate
    def test_scrape_json_ld_individual_reviews(self):
        """JSON-LD with individual @type: Review items, author as dict and as string."""
        html = """
        <html><body>
        <script type="application/ld+json">
        {"@type": "Review", "id": "bbb_json_001", "author": {"name": "Alice Smith"},
         "reviewRating": {"ratingValue": 5}, "reviewBody": "Great service!",
         "datePublished": "2024-03-10"}
        </script>
        <script type="application/ld+json">
        {"@type": "Review", "id": "bbb_json_002", "author": "Bob Jones",
         "reviewRating": {"ratingValue": 2}, "reviewBody": "Not great.",
         "datePublished": "2024-04-20"}
        </script>
        </body></html>
        """
        responses.add(responses.GET, self.REVIEWS_URL, body=html, status=200)

        with patch.object(BBBScraper, "rate_limit"):
            scraper = BBBScraper()
            reviews = scraper.scrape("https://www.bbb.org/us/ca/test/profile/test-1234")

        assert len(reviews) == 2

        first = next(r for r in reviews if r["external_id"] == "bbb_json_001")
        assert first["author_name"] == "Alice Smith"
        assert first["rating"] == 5.0
        assert first["text"] == "Great service!"
        assert first["review_date"] == date(2024, 3, 10)

        second = next(r for r in reviews if r["external_id"] == "bbb_json_002")
        assert second["author_name"] == "Bob Jones"
        assert second["rating"] == 2.0

    @responses.activate
    def test_scrape_json_ld_parent_with_review_array(self):
        """JSON-LD with a parent object containing a 'review' array."""
        html = """
        <html><body>
        <script type="application/ld+json">
        {
          "@type": "LocalBusiness",
          "name": "Test Co",
          "review": [
            {"@type": "Review", "id": "parent_rev_001", "author": {"name": "Carol"},
             "reviewRating": {"ratingValue": 4}, "reviewBody": "Pretty good.",
             "datePublished": "2024-05-01"},
            {"@type": "Review", "id": "parent_rev_002", "author": {"name": "Dan"},
             "reviewRating": {"ratingValue": 1}, "reviewBody": "Terrible.",
             "datePublished": "2024-06-15"}
          ]
        }
        </script>
        </body></html>
        """
        responses.add(responses.GET, self.REVIEWS_URL, body=html, status=200)

        with patch.object(BBBScraper, "rate_limit"):
            scraper = BBBScraper()
            reviews = scraper.scrape("https://www.bbb.org/us/ca/test/profile/test-1234")

        assert len(reviews) == 2
        ids = {r["external_id"] for r in reviews}
        assert "parent_rev_001" in ids
        assert "parent_rev_002" in ids

        carol = next(r for r in reviews if r["external_id"] == "parent_rev_001")
        assert carol["author_name"] == "Carol"
        assert carol["rating"] == 4.0
        assert carol["review_date"] == date(2024, 5, 1)

    def test_json_ld_generates_id_from_hash(self):
        """A review without id/@id but with reviewBody generates a hash-based ID."""
        scraper = BBBScraper()
        data = {
            "@type": "Review",
            "author": {"name": "Eve"},
            "reviewRating": {"ratingValue": 3},
            "reviewBody": "Decent experience overall.",
        }
        review = scraper._parse_json_ld_review(data)

        assert review is not None
        assert review["external_id"].startswith("bbb_")
        assert len(review["external_id"]) == len("bbb_") + 8

    def test_json_ld_skips_review_without_id_or_text(self):
        """A review with no id, @id, reviewBody, or text is skipped (returns None)."""
        scraper = BBBScraper()
        data = {
            "@type": "Review",
            "author": {"name": "Ghost"},
            "reviewRating": {"ratingValue": 5},
            # no id, no @id, no reviewBody, no text
        }
        result = scraper._parse_json_ld_review(data)
        assert result is None

    def test_json_ld_rating_as_scalar(self):
        """reviewRating as a scalar float is parsed correctly."""
        scraper = BBBScraper()
        data = {
            "id": "scalar_rating_001",
            "author": "Frank",
            "reviewRating": 4.5,
            "reviewBody": "Solid service.",
        }
        review = scraper._parse_json_ld_review(data)

        assert review is not None
        assert review["rating"] == 4.5


class TestBBBScraperBPR:
    REVIEWS_URL = "https://www.bbb.org/us/ca/test/profile/test-bpr/customer-reviews"

    @responses.activate
    def test_parse_bpr_reviews(self):
        """BPR-format reviews are parsed when no review-item divs or JSON-LD exist."""
        html = """
        <html><body>
        <ul>
          <li class="card bpr-review" id="1296_7039385_834877">
            <h3 class="bpr-review-title">
              <span class="visually-hidden">Review from</span>
              <span>John Doe</span>
            </h3>
            <p>Date: 01/15/2024</p>
            <div class="star-rating">
              <svg data-filled="true"></svg>
              <svg data-filled="true"></svg>
              <svg data-filled="true"></svg>
              <svg></svg>
              <svg></svg>
            </div>
            <div>This is a review text that is longer than 10 characters</div>
          </li>
        </ul>
        </body></html>
        """
        responses.add(responses.GET, self.REVIEWS_URL, body=html, status=200)

        with patch.object(BBBScraper, "rate_limit"):
            scraper = BBBScraper()
            reviews = scraper.scrape("https://www.bbb.org/us/ca/test/profile/test-bpr")

        assert len(reviews) == 1
        r = reviews[0]
        assert r["external_id"] == "1296_7039385_834877"
        assert r["author_name"] == "John Doe"
        assert r["review_date"] == date(2024, 1, 15)
        assert r["rating"] == 3.0
        assert "This is a review text" in r["text"]
        assert r["review_url"] == self.REVIEWS_URL + "#1296_7039385_834877"


class TestBBBScraperNormalizeUrl:
    def test_strips_query_params(self):
        scraper = BBBScraper()
        result = scraper._normalize_url("https://bbb.org/test?foo=bar")
        assert result == "https://bbb.org/test/customer-reviews"

    def test_strips_address_id(self):
        scraper = BBBScraper()
        result = scraper._normalize_url("https://bbb.org/test/addressId/12345")
        assert result == "https://bbb.org/test/customer-reviews"

    def test_strips_existing_customer_reviews(self):
        scraper = BBBScraper()
        result = scraper._normalize_url("https://bbb.org/test/customer-reviews")
        assert result == "https://bbb.org/test/customer-reviews"

    def test_adds_customer_reviews(self):
        scraper = BBBScraper()
        result = scraper._normalize_url("https://bbb.org/test")
        assert result == "https://bbb.org/test/customer-reviews"


class TestBBBScraperSearch:
    SEARCH_URL = "https://www.bbb.org/search?find_text=pizza"

    @responses.activate
    def test_search_returns_results(self):
        """search() parses name, address, rating, URL, and thumbnail from result cards."""
        html = """
        <html><body>
        <div class="result-card">
          <h3 class="result-business-name">
            <a href="/us/ca/la/profile/pizza/best-pizza-1234">Best Pizza Place</a>
          </h3>
          <p class="text-size-5">123 Main St, Los Angeles, CA 90001</p>
          <summary class="result-rating">BBB Rating: A+</summary>
          <img src="https://example.com/logo.png" alt="logo"/>
        </div>
        </body></html>
        """
        responses.add(responses.GET, self.SEARCH_URL, body=html, status=200)

        with patch.object(BBBScraper, "rate_limit"):
            scraper = BBBScraper()
            results = scraper.search("pizza")

        assert len(results) == 1
        r = results[0]
        assert r["name"] == "Best Pizza Place"
        assert r["address"] == "123 Main St, Los Angeles, CA 90001"
        assert r["rating"] == 5.0
        assert r["url"] == "https://www.bbb.org/us/ca/la/profile/pizza/best-pizza-1234"
        assert r["thumbnail_url"] == "https://example.com/logo.png"

    @responses.activate
    def test_search_handles_request_error(self):
        """search() returns an empty list when the request fails."""
        responses.add(responses.GET, self.SEARCH_URL, status=500)

        with patch.object(BBBScraper, "rate_limit"):
            scraper = BBBScraper()
            results = scraper.search("pizza")

        assert results == []

    @responses.activate
    def test_search_grade_mapping(self):
        """BBB letter grades are correctly mapped to numeric ratings."""
        html = """
        <html><body>
        <div class="result-card">
          <h3 class="result-business-name">
            <a href="/us/profile/b-minus-co">B-Minus Co</a>
          </h3>
          <summary class="result-rating">BBB Rating: B-</summary>
        </div>
        <div class="result-card">
          <h3 class="result-business-name">
            <a href="/us/profile/f-co">F Co</a>
          </h3>
          <summary class="result-rating">BBB Rating: F</summary>
        </div>
        </body></html>
        """
        responses.add(responses.GET, self.SEARCH_URL, body=html, status=200)

        with patch.object(BBBScraper, "rate_limit"):
            scraper = BBBScraper()
            results = scraper.search("pizza")

        assert len(results) == 2
        b_minus = next(r for r in results if "b-minus" in r["url"])
        assert b_minus["rating"] == 3.3

        f_co = next(r for r in results if "f-co" in r["url"])
        assert f_co["rating"] == 1.0


class TestBBBScraperIsoDate:
    def test_parse_iso_date_with_time(self):
        scraper = BBBScraper()
        result = scraper._parse_iso_date("2024-01-15T10:30:00")
        assert result == date(2024, 1, 15)

    def test_parse_iso_date_without_time(self):
        scraper = BBBScraper()
        result = scraper._parse_iso_date("2024-01-15")
        assert result == date(2024, 1, 15)

    def test_parse_iso_date_invalid(self):
        scraper = BBBScraper()
        result = scraper._parse_iso_date("not-a-date")
        assert result is None


class TestYelpScraperSearch:
    SEARCH_URL = "https://www.yelp.com/search?find_desc=pizza"

    @responses.activate
    def test_search_returns_results(self):
        """search() parses name, address, rating, review_count, and thumbnail."""
        html = """
        <html><body>
        <div data-testid="serp-ia-card">
          <a href="/biz/test-restaurant">Test Restaurant</a>
          <span class="raw__09f24__T4Ezm">123 Main St</span>
          <div aria-label="4.5 star rating"></div>
          <span class="css-chan6m">42 reviews</span>
          <img class="css-xlzvdl" src="https://example.com/photo.jpg"/>
        </div>
        </body></html>
        """
        responses.add(responses.GET, self.SEARCH_URL, body=html, status=200)

        with patch.object(YelpScraper, "rate_limit"):
            scraper = YelpScraper()
            results = scraper.search("pizza")

        assert len(results) == 1
        r = results[0]
        assert r["name"] == "Test Restaurant"
        assert r["url"].startswith("https://www.yelp.com/biz/test-restaurant")
        assert r["rating"] == 4.5
        assert r["review_count"] == 42
        assert r["thumbnail_url"] == "https://example.com/photo.jpg"

    @responses.activate
    def test_search_handles_request_error(self):
        """search() returns an empty list when the request fails."""
        responses.add(responses.GET, self.SEARCH_URL, status=500)

        with patch.object(YelpScraper, "rate_limit"):
            scraper = YelpScraper()
            results = scraper.search("pizza")

        assert results == []

    @responses.activate
    def test_search_relative_url_handling(self):
        """Relative /biz/ hrefs are expanded to absolute yelp.com URLs."""
        html = """
        <html><body>
        <div data-testid="serp-ia-card">
          <a href="/biz/test">My Biz</a>
        </div>
        </body></html>
        """
        responses.add(responses.GET, self.SEARCH_URL, body=html, status=200)

        with patch.object(YelpScraper, "rate_limit"):
            scraper = YelpScraper()
            results = scraper.search("pizza")

        assert len(results) == 1
        assert results[0]["url"] == "https://www.yelp.com/biz/test"

    def test_parse_date_invalid(self):
        """_parse_date returns None for strings that don't match the expected format."""
        scraper = YelpScraper()
        result = scraper._parse_date("invalid date")
        assert result is None
