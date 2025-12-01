import logging
import re
from datetime import datetime, date
from urllib.parse import quote_plus

import requests

from reviewhound.scrapers.base import BaseScraper
from reviewhound.config import Config

logger = logging.getLogger(__name__)


class BBBScraper(BaseScraper):
    source = "bbb"

    def scrape(self, url: str, include_complaints: bool = False) -> list[dict]:
        reviews = []

        try:
            soup = self.fetch(url)
            reviews.extend(self._parse_reviews(soup))

            if include_complaints:
                reviews.extend(self._parse_complaints(soup))

        except requests.RequestException as e:
            logger.warning(f"BBB scrape failed for {url}: {e}")

        return reviews

    def _parse_reviews(self, soup) -> list[dict]:
        reviews = []
        review_items = soup.find_all("div", class_="review-item")

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

        # Author name
        author_elem = item.find("span", class_="reviewer-name")
        author_name = author_elem.get_text(strip=True) if author_elem else "Anonymous"

        # Rating from data attribute
        rating_elem = item.find("div", class_="star-rating")
        rating = None
        if rating_elem and rating_elem.get("data-rating"):
            rating = float(rating_elem.get("data-rating"))

        # Review text
        text_elem = item.find("div", class_="review-text")
        text = ""
        if text_elem:
            p = text_elem.find("p")
            text = p.get_text(strip=True) if p else text_elem.get_text(strip=True)

        # Date
        date_elem = item.find("span", class_="review-date")
        review_date = None
        if date_elem:
            review_date = self._parse_date(date_elem.get_text(strip=True))

        return {
            "external_id": review_id,
            "author_name": author_name,
            "rating": rating,
            "text": text,
            "review_date": review_date,
        }

    def _parse_complaints(self, soup) -> list[dict]:
        complaints = []
        complaint_items = soup.find_all("div", class_="complaint-item")

        for item in complaint_items:
            try:
                complaint = self._parse_complaint(item)
                if complaint:
                    complaints.append(complaint)
            except (AttributeError, ValueError):
                continue

        return complaints

    def _parse_complaint(self, item) -> dict | None:
        complaint_id = item.get("data-complaint-id")
        if not complaint_id:
            return None

        # Complaint type as "author"
        type_elem = item.find("span", class_="complaint-type")
        complaint_type = type_elem.get_text(strip=True) if type_elem else "Complaint"

        # Complaint text
        text_elem = item.find("div", class_="complaint-text")
        text = ""
        if text_elem:
            p = text_elem.find("p")
            text = p.get_text(strip=True) if p else text_elem.get_text(strip=True)

        # Date
        date_elem = item.find("span", class_="complaint-date")
        complaint_date = None
        if date_elem:
            complaint_date = self._parse_date(date_elem.get_text(strip=True))

        return {
            "external_id": complaint_id,
            "author_name": complaint_type,
            "rating": Config.COMPLAINT_DEFAULT_RATING,
            "text": text,
            "review_date": complaint_date,
        }

    def _parse_date(self, text: str) -> date | None:
        # BBB uses MM/DD/YYYY format
        try:
            return datetime.strptime(text.strip(), "%m/%d/%Y").date()
        except ValueError:
            pass
        return None

    def search(self, query: str, location: str | None = None) -> list[dict]:
        """Search BBB for businesses matching the query."""
        search_url = f"https://www.bbb.org/search?find_text={quote_plus(query)}"
        if location:
            search_url += f"&find_loc={quote_plus(location)}"

        try:
            soup = self.fetch(search_url)
        except requests.RequestException:
            return []

        results = []
        cards = soup.select("div.result-card")[:5]

        for card in cards:
            try:
                result = self._parse_search_result(card)
                if result:
                    results.append(result)
            except (AttributeError, ValueError):
                continue

        return results

    def _parse_search_result(self, card) -> dict | None:
        # Get URL from the business name link
        name_heading = card.select_one("h3.result-business-name")
        if not name_heading:
            return None

        link = name_heading.find("a")
        if not link:
            return None

        url = link.get("href", "")
        if not url:
            return None

        if url.startswith("/"):
            url = f"https://www.bbb.org{url}"

        name = link.get_text(strip=True)

        # Address is in p.text-size-5 (contains street address)
        address = ""
        address_elem = card.select_one("p.text-size-5")
        if address_elem:
            address = address_elem.get_text(strip=True)

        # BBB rating is in summary.result-rating
        rating = None
        rating_elem = card.select_one("summary.result-rating")
        if rating_elem:
            rating_text = rating_elem.get_text(strip=True)
            match = re.search(r"BBB Rating:\s*([A-F][+-]?)", rating_text, re.IGNORECASE)
            if match:
                grade = match.group(1).upper()
                grade_map = {"A+": 5.0, "A": 4.7, "A-": 4.3, "B+": 4.0, "B": 3.7, "B-": 3.3,
                             "C+": 3.0, "C": 2.7, "C-": 2.3, "D+": 2.0, "D": 1.7, "D-": 1.3, "F": 1.0}
                rating = grade_map.get(grade)

        # BBB doesn't show review count in search results
        review_count = 0

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
