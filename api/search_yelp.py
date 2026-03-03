import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length)) if content_length else {}

        query = body.get('query')
        api_key = body.get('api_key')

        if not query:
            self._respond(400, {'success': False, 'error': 'Query is required'})
            return
        if not api_key:
            self._respond(400, {'success': False, 'error': 'API key is required'})
            return

        try:
            from reviewhound.scrapers import YelpAPIScraper
            scraper = YelpAPIScraper(api_key)
            results = scraper.search(query, body.get('location'))
            self._respond(200, {'success': True, 'results': results})
        except Exception as e:
            self._respond(500, {'success': False, 'error': str(e)})

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
