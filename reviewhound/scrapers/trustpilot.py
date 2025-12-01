import re
from datetime import datetime, date
from urllib.parse import quote_plus

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

    def search(self, query: str, location: str | None = None) -> list[dict]:
        """Search TrustPilot for businesses matching the query."""
        search_url = f"https://www.trustpilot.com/search?query={quote_plus(query)}"

        try:
            soup = self.fetch(search_url)
        except requests.RequestException:
            return []

        results = []
        cards = soup.select("a[name='business-unit-card']")[:5]

        for card in cards:
            try:
                result = self._parse_search_result(card)
                if result:
                    results.append(result)
            except (AttributeError, ValueError):
                continue

        return results

    def _parse_search_result(self, card) -> dict | None:
        href = card.get("href", "")
        if not href:
            return None

        url = f"https://www.trustpilot.com{href}" if href.startswith("/") else href

        # Find name - look for p tag with heading class
        name = ""
        for p in card.find_all("p"):
            classes = p.get("class", [])
            if any("heading" in c.lower() for c in classes):
                name = p.get_text(strip=True)
                break

        # Find location - in businessLocation div
        address = ""
        location_div = card.select_one("div[class*='businessLocation']")
        if location_div:
            p = location_div.find("p")
            address = p.get_text(strip=True) if p else ""

        # Find rating - look for trustScore span
        rating = None
        rating_span = card.select_one("span[class*='trustScore']")
        if rating_span:
            inner_span = rating_span.find("span")
            if inner_span:
                try:
                    rating = float(inner_span.get_text(strip=True))
                except ValueError:
                    pass

        # Find review count - has data attribute
        review_count = 0
        count_elem = card.select_one("span[data-business-unit-review-count]")
        if count_elem:
            count_text = count_elem.get_text(strip=True)
            match = re.search(r"([\d,]+)\s*reviews?", count_text)
            if match:
                review_count = int(match.group(1).replace(",", ""))

        img_elem = card.select_one("img")
        thumbnail_url = img_elem.get("src") if img_elem else None

        return {
            "name": name,
            "address": address,
            "rating": rating,
            "review_count": review_count,
            "url": url,
            "thumbnail_url": thumbnail_url,
        }
