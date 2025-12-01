from datetime import datetime, date

import requests

from reviewhound.scrapers.base import BaseScraper


class BBBScraper(BaseScraper):
    source = "bbb"

    def scrape(self, url: str, include_complaints: bool = False) -> list[dict]:
        reviews = []

        try:
            soup = self.fetch(url)
            reviews.extend(self._parse_reviews(soup))

            if include_complaints:
                reviews.extend(self._parse_complaints(soup))

        except requests.RequestException:
            pass

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
            "rating": 1.0,  # Complaints default to 1-star
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
