import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length)) if content_length else {}

        text = body.get('text', '')
        rating = body.get('rating')
        rating_weight = body.get('rating_weight')
        text_weight = body.get('text_weight')
        threshold = body.get('threshold')

        try:
            from reviewhound.analysis import analyze_review
            score, label = analyze_review(
                text, rating,
                rating_weight=rating_weight,
                text_weight=text_weight,
                threshold=threshold,
            )
            self._respond(200, {'success': True, 'score': score, 'label': label})
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
