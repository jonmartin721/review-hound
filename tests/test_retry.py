"""Tests for scraper retry and backoff behavior."""

from unittest.mock import patch

import pytest
import requests
import responses

from reviewhound.scrapers.base import BaseScraper, _backoff_delay


class DummyScraper(BaseScraper):
    """Concrete scraper for testing base class behavior."""

    source = "test"

    def scrape(self, url: str) -> list[dict]:
        return []


class TestBackoffDelay:
    """Tests for the backoff delay calculation."""

    def test_first_attempt_bounded(self):
        """First attempt delay should be between 0 and base."""
        for _ in range(50):
            delay = _backoff_delay(attempt=0, base=1.0, maximum=30.0)
            assert 0 <= delay <= 1.0

    def test_delay_grows_exponentially(self):
        """Later attempts should allow larger delays."""
        # attempt=0: max 1.0, attempt=1: max 2.0, attempt=2: max 4.0
        maxes = []
        for attempt in range(4):
            samples = [_backoff_delay(attempt, base=1.0, maximum=30.0) for _ in range(200)]
            maxes.append(max(samples))
        # Each level's observed max should generally be larger than the previous
        assert maxes[2] > maxes[0]

    def test_respects_maximum(self):
        """Delay should never exceed the maximum."""
        for _ in range(100):
            delay = _backoff_delay(attempt=10, base=1.0, maximum=5.0)
            assert delay <= 5.0

    def test_jitter_produces_variation(self):
        """Same attempt should produce different delays (jitter)."""
        delays = {_backoff_delay(attempt=2, base=1.0, maximum=30.0) for _ in range(20)}
        assert len(delays) > 1


class TestFetchRetry:
    """Tests for BaseScraper.fetch() retry behavior."""

    @responses.activate
    def test_succeeds_on_first_try(self):
        """Should return soup on 200 without retrying."""
        responses.add(responses.GET, "http://example.com", body="<html>ok</html>", status=200)

        with patch.object(DummyScraper, "rate_limit"):
            scraper = DummyScraper()
            soup = scraper.fetch("http://example.com")

        assert soup is not None
        assert len(responses.calls) == 1

    @responses.activate
    def test_retries_on_500(self):
        """Should retry on 500 and succeed on subsequent attempt."""
        responses.add(responses.GET, "http://example.com", status=500)
        responses.add(responses.GET, "http://example.com", body="<html>ok</html>", status=200)

        with patch.object(DummyScraper, "rate_limit"), patch("reviewhound.scrapers.base.time.sleep"):
            scraper = DummyScraper()
            soup = scraper.fetch("http://example.com")

        assert soup is not None
        assert len(responses.calls) == 2

    @responses.activate
    def test_retries_on_503(self):
        """Should retry on 503."""
        responses.add(responses.GET, "http://example.com", status=503)
        responses.add(responses.GET, "http://example.com", body="<html>ok</html>", status=200)

        with patch.object(DummyScraper, "rate_limit"), patch("reviewhound.scrapers.base.time.sleep"):
            scraper = DummyScraper()
            soup = scraper.fetch("http://example.com")

        assert soup is not None
        assert len(responses.calls) == 2

    @responses.activate
    def test_retries_on_429(self):
        """Should retry on 429 Too Many Requests."""
        responses.add(responses.GET, "http://example.com", status=429)
        responses.add(responses.GET, "http://example.com", body="<html>ok</html>", status=200)

        with patch.object(DummyScraper, "rate_limit"), patch("reviewhound.scrapers.base.time.sleep"):
            scraper = DummyScraper()
            soup = scraper.fetch("http://example.com")

        assert soup is not None
        assert len(responses.calls) == 2

    @responses.activate
    def test_does_not_retry_on_404(self):
        """Should NOT retry on 404 — it's a client error."""
        responses.add(responses.GET, "http://example.com", status=404)

        with patch.object(DummyScraper, "rate_limit"), pytest.raises(requests.HTTPError) as exc_info:
            scraper = DummyScraper()
            scraper.fetch("http://example.com")

        assert exc_info.value.response.status_code == 404
        assert len(responses.calls) == 1

    @responses.activate
    def test_does_not_retry_on_403(self):
        """Should NOT retry on 403."""
        responses.add(responses.GET, "http://example.com", status=403)

        with patch.object(DummyScraper, "rate_limit"), pytest.raises(requests.HTTPError) as exc_info:
            scraper = DummyScraper()
            scraper.fetch("http://example.com")

        assert exc_info.value.response.status_code == 403
        assert len(responses.calls) == 1

    @responses.activate
    def test_exhausts_retries_on_persistent_500(self):
        """Should give up after max retries on persistent 500."""
        for _ in range(3):
            responses.add(responses.GET, "http://example.com", status=500)

        with (
            patch.object(DummyScraper, "rate_limit"),
            patch("reviewhound.scrapers.base.time.sleep"),
            pytest.raises(requests.HTTPError) as exc_info,
        ):
            scraper = DummyScraper()
            scraper.fetch("http://example.com")

        assert exc_info.value.response.status_code == 500
        assert len(responses.calls) == 3

    @responses.activate
    def test_retries_on_connection_error(self):
        """Should retry on connection errors."""
        responses.add(responses.GET, "http://example.com", body=requests.ConnectionError("refused"))
        responses.add(responses.GET, "http://example.com", body="<html>ok</html>", status=200)

        with patch.object(DummyScraper, "rate_limit"), patch("reviewhound.scrapers.base.time.sleep"):
            scraper = DummyScraper()
            soup = scraper.fetch("http://example.com")

        assert soup is not None
        assert len(responses.calls) == 2

    @responses.activate
    def test_backoff_sleep_is_called(self):
        """Should sleep between retries with backoff delays."""
        responses.add(responses.GET, "http://example.com", status=503)
        responses.add(responses.GET, "http://example.com", body="<html>ok</html>", status=200)

        with (
            patch.object(DummyScraper, "rate_limit"),
            patch("reviewhound.scrapers.base.time.sleep") as mock_sleep,
        ):
            scraper = DummyScraper()
            scraper.fetch("http://example.com")

        # Should have slept once for backoff (between attempt 1 and 2)
        assert mock_sleep.call_count == 1
        # Backoff delay should be non-negative
        assert mock_sleep.call_args[0][0] >= 0
