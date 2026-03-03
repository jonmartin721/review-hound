import json
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(content_length)) if content_length else {}

        source = body.get("source")
        url = body.get("url")
        api_key = body.get("api_key")

        if not source:
            self._respond(400, {"error": "source is required"})
            return

        try:
            reviews = self._scrape(source, url, api_key)
            self._respond(200, {"success": True, "reviews": reviews})
        except Exception as e:
            self._respond(500, {"success": False, "error": str(e)})

    def _scrape(self, source, url, api_key):
        from reviewhound.scrapers import (
            BBBScraper,
            GooglePlacesScraper,
            TrustPilotScraper,
            YelpAPIScraper,
            YelpScraper,
        )

        scrapers = {
            "trustpilot": lambda: TrustPilotScraper().scrape(url),
            "bbb": lambda: BBBScraper().scrape(url),
            "yelp": lambda: YelpScraper().scrape(url),
            "google_places": lambda: GooglePlacesScraper(api_key).scrape(url),
            "yelp_api": lambda: YelpAPIScraper(api_key).scrape(url),
        }

        scraper_fn = scrapers.get(source)
        if not scraper_fn:
            raise ValueError(f"Unknown source: {source}")

        results = scraper_fn()
        # Convert dates to ISO strings for JSON serialization
        for r in results:
            if r.get("review_date"):
                r["review_date"] = str(r["review_date"])
        return results

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
