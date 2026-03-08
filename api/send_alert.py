import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.request import Request, urlopen


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(content_length)) if content_length else {}

        email = body.get("email")
        business_name = body.get("business_name", "Unknown Business")
        reviews = body.get("reviews", [])
        resend_key = body.get("api_key") or os.environ.get("RESEND_API_KEY")
        from_email = body.get("from_email") or os.environ.get("RESEND_FROM_EMAIL")

        if not email:
            self._respond(400, {"success": False, "error": "Email is required"})
            return

        if not resend_key:
            self._respond(500, {"success": False, "error": "Email service not configured"})
            return
        if not from_email:
            self._respond(400, {"success": False, "error": "Sender email is required"})
            return

        try:
            review_html = "".join(
                f'<div style="margin-bottom:16px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;">'
                f"<strong>{r.get('author_name', 'Anonymous')}</strong> — "
                f"{'★' * int(r.get('rating', 0))} ({r.get('rating', 'N/A')})<br>"
                f"<p>{r.get('text', 'No review text')[:300]}</p>"
                f'<small style="color:#6b7280;">{r.get("source", "")} · {r.get("review_date", "")}</small>'
                f"</div>"
                for r in reviews
            )

            payload = json.dumps(
                {
                    "from": f"Review Hound <{from_email}>",
                    "to": [email],
                    "subject": f"Alert: New negative reviews for {business_name}",
                    "html": (
                        f"<h2>Negative Review Alert</h2>"
                        f"<p>{len(reviews)} new negative review(s) detected "
                        f"for <strong>{business_name}</strong>.</p>"
                        f"{review_html}"
                        f'<p style="color:#6b7280;font-size:12px;">Sent by Review Hound</p>'
                    ),
                }
            ).encode()

            req = Request(
                "https://api.resend.com/emails",
                data=payload,
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json",
                },
            )
            urlopen(req)
            self._respond(200, {"success": True})
        except Exception as e:
            self._respond(500, {"success": False, "error": str(e)})

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
