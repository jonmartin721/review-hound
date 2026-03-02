import logging
import random
import time
from abc import ABC, abstractmethod

import requests
from bs4 import BeautifulSoup

from reviewhound.config import Config

logger = logging.getLogger(__name__)

# HTTP status codes that are safe to retry
_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",  # noqa: E501
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",  # noqa: E501
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",  # noqa: E501
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",  # noqa: E501
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",  # noqa: E501
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
]


def _backoff_delay(attempt: int, base: float, maximum: float) -> float:
    """Calculate exponential backoff delay with full jitter.

    Uses the "full jitter" strategy: uniform random between 0 and the
    exponential cap. This decorrelates retries across concurrent scrapers.
    """
    exp_delay = min(base * (2**attempt), maximum)
    return random.uniform(0, exp_delay)


class BaseScraper(ABC):
    source: str = ""

    def __init__(self):
        self.session = requests.Session()

    def get_headers(self) -> dict:
        return {"User-Agent": random.choice(USER_AGENTS)}

    def rate_limit(self):
        delay = random.uniform(Config.REQUEST_DELAY_MIN, Config.REQUEST_DELAY_MAX)
        time.sleep(delay)

    def fetch(self, url: str) -> BeautifulSoup:
        """Fetch a URL with retry on transient failures.

        Retries on connection errors, timeouts, and 429/5xx status codes.
        Uses exponential backoff with full jitter between retries.
        Non-retryable errors (4xx except 429) raise immediately.
        """
        max_retries = Config.SCRAPE_MAX_RETRIES
        last_exception: Exception | None = None

        for attempt in range(max_retries):
            self.rate_limit()
            try:
                response = self.session.get(url, headers=self.get_headers(), timeout=30)

                if response.status_code in _RETRYABLE_STATUS_CODES:
                    logger.warning(
                        "Retryable HTTP %d from %s (source=%s, attempt=%d/%d)",
                        response.status_code,
                        url,
                        self.source,
                        attempt + 1,
                        max_retries,
                    )
                    if attempt < max_retries - 1:
                        delay = _backoff_delay(
                            attempt, Config.SCRAPE_RETRY_BASE_DELAY, Config.SCRAPE_RETRY_MAX_DELAY
                        )
                        time.sleep(delay)
                        continue

                response.raise_for_status()
                return BeautifulSoup(response.text, "html.parser")

            except requests.ConnectionError as e:
                last_exception = e
                logger.warning(
                    "Connection error fetching %s (source=%s, attempt=%d/%d): %s",
                    url,
                    self.source,
                    attempt + 1,
                    max_retries,
                    e,
                )
            except requests.Timeout as e:
                last_exception = e
                logger.warning(
                    "Timeout fetching %s (source=%s, attempt=%d/%d): %s",
                    url,
                    self.source,
                    attempt + 1,
                    max_retries,
                    e,
                )

            # Backoff before next retry
            if attempt < max_retries - 1:
                delay = _backoff_delay(attempt, Config.SCRAPE_RETRY_BASE_DELAY, Config.SCRAPE_RETRY_MAX_DELAY)
                time.sleep(delay)

        # All retries exhausted
        logger.error(
            "All %d attempts failed for %s (source=%s)",
            max_retries,
            url,
            self.source,
        )
        if last_exception is None:
            raise RuntimeError(f"fetch failed for {url} with no recorded exception")
        raise last_exception

    @abstractmethod
    def scrape(self, url: str) -> list[dict]:
        """Return list of review dicts with keys:
        external_id, author_name, rating, text, review_date
        """
        pass

    def search(self, query: str, location: str | None = None) -> list[dict]:
        """Search for businesses on this platform.

        Args:
            query: Business name to search for
            location: Optional location to narrow results

        Returns:
            List of dicts with keys:
            name, address, rating, review_count, url, thumbnail_url
        """
        raise NotImplementedError(f"{self.__class__.__name__} does not support search")
