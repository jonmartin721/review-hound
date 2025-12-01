import re
from datetime import datetime, date

import requests

from reviewhound.scrapers.base import BaseScraper
from reviewhound.config import Config


class YelpScraper(BaseScraper):
    source = "yelp"

    def scrape(self, url: str) -> list[dict]:
        reviews = []
        base_url = url.split("?")[0]

        for page in range(Config.MAX_PAGES_PER_SOURCE):
            page_url = base_url if page == 0 else f"{base_url}?start={page * 10}"

            try:
                soup = self.fetch(page_url)
                page_reviews = self._parse_reviews(soup)
                reviews.extend(page_reviews)
            except requests.RequestException:
                break

        return reviews

    def _parse_reviews(self, soup) -> list[dict]:
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
        review_id = item.get("data-review-id")
        if not review_id:
            return None

        author_elem = item.select_one(".user-passport-info span.fs-block")
        author_name = author_elem.get_text(strip=True) if author_elem else "Anonymous"

        rating_elem = item.find(attrs={"aria-label": re.compile(r"\d+ star rating")})
        rating = None
        if rating_elem:
            aria_label = rating_elem.get("aria-label", "")
            match = re.search(r"(\d+) star rating", aria_label)
            if match:
                rating = float(match.group(1))

        text_elem = item.select_one("span.raw__09f24__T4Ezm")
        text = text_elem.get_text(strip=True) if text_elem else ""

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
        try:
            return datetime.strptime(text, "%b %d, %Y").date()
        except ValueError:
            return None
