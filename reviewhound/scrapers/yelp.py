# This scraper is for educational purposes only.
# Please review Yelp's Terms of Service before scraping their website.
# Consider using Yelp's official API for production applications.

import re
from datetime import datetime, date

import requests

from reviewhound.scrapers.base import BaseScraper
from reviewhound.config import Config


class YelpScraper(BaseScraper):
    source = "yelp"

    def scrape(self, url: str) -> list[dict]:
        """Scrape reviews from a Yelp business page with pagination.

        Args:
            url: Yelp business URL

        Returns:
            List of review dictionaries with keys: external_id, author_name,
            rating, text, review_date
        """
        reviews = []
        base_url = url.split("?")[0]

        for page in range(Config.MAX_PAGES_PER_SOURCE):
            # Yelp uses ?start=0, ?start=10, ?start=20 for pagination
            # Start increments by 10 for each page
            page_url = base_url if page == 0 else f"{base_url}?start={page * 10}"

            try:
                soup = self.fetch(page_url)
                page_reviews = self._parse_reviews(soup)
                reviews.extend(page_reviews)
            except requests.RequestException:
                break

        return reviews

    def _parse_reviews(self, soup) -> list[dict]:
        """Parse all reviews from a Yelp page.

        Args:
            soup: BeautifulSoup object of the page

        Returns:
            List of review dictionaries
        """
        reviews = []
        review_items = soup.find_all("li", attrs={"data-review-id": True})

        for item in review_items:
            try:
                review = self._parse_review(item)
                if review:
                    reviews.append(review)
            except (AttributeError, ValueError):
                continue

        return reviews

    def _parse_review(self, item) -> dict | None:
        """Parse a single review element.

        Args:
            item: BeautifulSoup element representing a review

        Returns:
            Dictionary with review data or None if parsing fails
        """
        review_id = item.get("data-review-id")
        if not review_id:
            return None

        # Author name - look for user passport info
        author_elem = item.select_one(".user-passport-info span.fs-block")
        author_name = author_elem.get_text(strip=True) if author_elem else "Anonymous"

        # Rating - extract from aria-label attribute
        rating_elem = item.find(attrs={"aria-label": re.compile(r"\d+ star rating")})
        rating = None
        if rating_elem:
            aria_label = rating_elem.get("aria-label", "")
            match = re.search(r"(\d+) star rating", aria_label)
            if match:
                rating = float(match.group(1))

        # Review text - look for the raw text span
        text_elem = item.select_one("span.raw__09f24__T4Ezm")
        text = text_elem.get_text(strip=True) if text_elem else ""

        # Date - Yelp uses format like "Nov 15, 2024"
        date_elem = item.select_one("span.css-chan6m")
        review_date = None
        if date_elem:
            date_text = date_elem.get_text(strip=True)
            review_date = self._parse_date(date_text)

        return {
            "external_id": review_id,
            "author_name": author_name,
            "rating": rating,
            "text": text,
            "review_date": review_date,
        }

    def _parse_date(self, text: str) -> date | None:
        """Parse Yelp date format.

        Args:
            text: Date string in format "Nov 15, 2024"

        Returns:
            date object or None if parsing fails
        """
        try:
            # Yelp uses format: "Nov 15, 2024"
            return datetime.strptime(text, "%b %d, %Y").date()
        except ValueError:
            return None
