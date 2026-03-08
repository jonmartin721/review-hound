import json
import logging
from http.server import BaseHTTPRequestHandler

logger = logging.getLogger(__name__)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(content_length)) if content_length else {}

        query = body.get("query")
        location = body.get("location")

        if not query:
            self._respond(400, {"success": False, "error": "Query is required"})
            return

        from reviewhound.scrapers import BBBScraper, TrustPilotScraper

        results = {"trustpilot": [], "bbb": []}

        for source, scraper in [("trustpilot", TrustPilotScraper()), ("bbb", BBBScraper())]:
            try:
                results[source] = scraper.search(query, location)
            except Exception as e:
                logger.error(f"Search failed for {source}: {e}")
                results[source] = []

        self._respond(200, {"success": True, "results": results})

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
