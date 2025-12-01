import re
from datetime import datetime, date

import requests

from reviewhound.scrapers.base import BaseScraper
from reviewhound.config import Config


class TrustPilotScraper(BaseScraper):
    source = "trustpilot"

    def scrape(self, url: str) -> list[dict]:
        reviews = []
        base_url = url.split("?")[0]

        for page in range(1, Config.MAX_PAGES_PER_SOURCE + 1):
            page_url = base_url if page == 1 else f"{base_url}?page={page}"
            try:
                soup = self.fetch(page_url)
                page_reviews = self._parse_reviews(soup)
                reviews.extend(page_reviews)
            except requests.RequestException:
                break

        return reviews

    def _parse_reviews(self, soup) -> list[dict]:
        reviews = []
        articles = soup.find_all("article", attrs={"data-review-id": True})

        for article in articles:
            try:
                review = self._parse_review(article)
                if review:
                    reviews.append(review)
            except (AttributeError, ValueError):
                continue

        return reviews

    def _parse_review(self, article) -> dict | None:
        review_id = article.get("data-review-id")
        if not review_id:
            return None

        # Author name
        author_elem = article.select_one("aside a span")
        author_name = author_elem.get_text(strip=True) if author_elem else "Anonymous"

        # Rating
        rating_elem = article.find(attrs={"data-service-review-rating": True})
        rating = float(rating_elem.get("data-service-review-rating", 0)) if rating_elem else None

        # Review text
        text_elem = article.find(attrs={"data-service-review-text-typography": True})
        text = ""
        if text_elem:
            p = text_elem.find("p")
            text = p.get_text(strip=True) if p else text_elem.get_text(strip=True)

        # Date
        date_elem = article.find(attrs={"data-service-review-date-of-experience-typography": True})
        review_date = None
        if date_elem:
            p = date_elem.find("p")
            date_text = p.get_text(strip=True) if p else date_elem.get_text(strip=True)
            review_date = self._parse_date(date_text)

        return {
            "external_id": review_id,
            "author_name": author_name,
            "rating": rating,
            "text": text,
            "review_date": review_date,
        }

    def _parse_date(self, text: str) -> date | None:
        match = re.search(r"(\w+ \d{1,2}, \d{4})", text)
        if match:
            try:
                return datetime.strptime(match.group(1), "%B %d, %Y").date()
            except ValueError:
                pass
        return None
