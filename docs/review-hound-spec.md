# Review Hound - Implementation Prompt for Claude Code

Build a Python review aggregator called "review-hound" that scrapes business reviews from multiple platforms, stores them in SQLite, performs basic sentiment analysis, and provides both CLI and web interfaces.

## Tech Stack
- Python 3.11+
- BeautifulSoup4 + requests (scraping)
- SQLite with SQLAlchemy ORM
- TextBlob (sentiment analysis)
- Flask (web dashboard)
- APScheduler (scheduled checks)
- Rich (CLI formatting)
- Click (CLI framework)
- python-dotenv (config)

## Project Structure
```
review-hound/
├── reviewhound/
│   ├── __init__.py
│   ├── __main__.py         # Entry point for python -m reviewhound
│   ├── cli.py              # CLI commands
│   ├── config.py           # Settings and env loading
│   ├── models.py           # SQLAlchemy models
│   ├── database.py         # DB connection and session
│   ├── scrapers/
│   │   ├── __init__.py
│   │   ├── base.py         # Abstract base scraper
│   │   ├── trustpilot.py   # TrustPilot scraper
│   │   ├── bbb.py          # Better Business Bureau scraper
│   │   └── yelp.py         # Yelp scraper (with ToS warning)
│   ├── analysis/
│   │   ├── __init__.py
│   │   ├── sentiment.py    # TextBlob sentiment scoring
│   │   └── reports.py      # Generate summary reports
│   ├── alerts/
│   │   ├── __init__.py
│   │   └── email.py        # SMTP email alerts
│   ├── scheduler.py        # APScheduler setup
│   └── web/
│       ├── __init__.py
│       ├── app.py          # Flask app factory
│       ├── routes.py       # Web routes
│       ├── templates/
│       │   ├── base.html
│       │   ├── dashboard.html
│       │   ├── business.html
│       │   └── reviews.html
│       └── static/
│           └── style.css
├── data/                   # SQLite database (gitignored)
├── exports/                # CSV exports (gitignored)
├── tests/
│   ├── __init__.py
│   ├── test_scrapers.py
│   ├── test_sentiment.py
│   └── test_models.py
├── Dockerfile
├── .dockerignore
├── .env.example
├── .gitignore
├── requirements.txt
├── setup.py
└── README.md
```

## Database Models

### Business
- id (primary key)
- name (string, required)
- address (string, nullable)
- trustpilot_url (string, nullable)
- bbb_url (string, nullable)
- yelp_url (string, nullable)
- created_at (datetime)
- updated_at (datetime)

### Review
- id (primary key)
- business_id (foreign key)
- source (enum: 'trustpilot', 'bbb', 'yelp')
- external_id (string, unique per source - prevents duplicates)
- author_name (string)
- rating (float, 1-5 scale, normalized)
- text (text)
- review_date (date)
- sentiment_score (float, -1 to 1)
- sentiment_label (enum: 'positive', 'neutral', 'negative')
- scraped_at (datetime)

### ScrapeLog
- id (primary key)
- business_id (foreign key)
- source (string)
- status (enum: 'success', 'failed', 'partial')
- reviews_found (integer)
- error_message (text, nullable)
- started_at (datetime)
- completed_at (datetime)

### AlertConfig
- id (primary key)
- business_id (foreign key)
- email (string)
- alert_on_negative (boolean, default True)
- negative_threshold (float, default 3.0)
- enabled (boolean, default True)

## Scraper Implementation

### Base Scraper (Abstract)
```python
class BaseScraper(ABC):
    def __init__(self):
        self.session = requests.Session()
        self.user_agents = [...]  # List of 10+ user agents
        
    @abstractmethod
    def scrape(self, url: str) -> list[dict]:
        """Return list of review dicts with keys:
        external_id, author_name, rating, text, review_date
        """
        pass
    
    def get_headers(self) -> dict:
        return {"User-Agent": random.choice(self.user_agents)}
    
    def rate_limit(self):
        time.sleep(random.uniform(2.0, 4.0))
    
    def fetch(self, url: str) -> BeautifulSoup:
        self.rate_limit()
        response = self.session.get(url, headers=self.get_headers())
        response.raise_for_status()
        return BeautifulSoup(response.text, 'html.parser')
```

### TrustPilot Scraper
- Accept TrustPilot company URL (e.g., trustpilot.com/review/example.com)
- Scrape first 3 pages of reviews
- Extract: author, star rating (1-5), review text, date
- Handle pagination via URL params (?page=2)

### BBB Scraper
- Accept BBB business URL
- Scrape complaints and reviews sections
- Normalize their letter grades to 1-5 scale if needed
- Extract complaint text as "reviews"

### Yelp Scraper
- Accept Yelp business URL
- Scrape first 2-3 pages
- Note in code comments: "Yelp ToS prohibits scraping - for educational use only"

### Error Handling
- Each scraper catches its own exceptions
- Log errors to ScrapeLog table
- Return partial results if some pages fail
- Never crash the whole scrape job

## Sentiment Analysis

```python
from textblob import TextBlob

def analyze_review(text: str) -> tuple[float, str]:
    """Returns (score, label)"""
    blob = TextBlob(text)
    score = blob.sentiment.polarity  # -1 to 1
    
    if score > 0.1:
        label = 'positive'
    elif score < -0.1:
        label = 'negative'
    else:
        label = 'neutral'
    
    return score, label
```

- Run on each review after scraping
- Store both score and label in Review model
- Batch processing for efficiency

## CLI Commands

```bash
# Add a business to track
reviewhound add "Joe's Pizza" \
  --trustpilot "https://trustpilot.com/review/joespizza.com" \
  --bbb "https://bbb.org/..." \
  --yelp "https://yelp.com/biz/joes-pizza"

# List tracked businesses
reviewhound list

# Scrape reviews for a business
reviewhound scrape 1              # by ID
reviewhound scrape "Joe's Pizza"  # by name
reviewhound scrape --all          # all businesses

# Show reviews
reviewhound reviews 1 --limit 20 --source trustpilot --sentiment negative

# Show summary stats
reviewhound stats 1

# Export to CSV
reviewhound export 1 --output exports/joes_reviews.csv

# Set up email alerts
reviewhound alert 1 --email "owner@joespizza.com" --threshold 3.0

# Run scheduler in foreground (for testing)
reviewhound watch --interval 6  # hours

# Start web dashboard
reviewhound web --port 5000

# Start web dashboard WITH scheduler (for production/Docker)
reviewhound web --port 5000 --with-scheduler --interval 6
```

## Scheduler Implementation

```python
# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler

def create_scheduler(interval_hours: int = 6):
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        scrape_all_businesses,
        'interval',
        hours=interval_hours,
        id='scrape_job',
        replace_existing=True
    )
    return scheduler

def scrape_all_businesses():
    """Called by scheduler - scrapes all businesses, sends alerts"""
    # Get all businesses
    # For each: run scrapers, analyze sentiment, check alerts
    pass
```

When `--with-scheduler` flag is passed to web command:
1. Create scheduler
2. Start scheduler before Flask app
3. Scheduler runs in background thread
4. Flask serves web UI
5. Single process, simple

## Web Dashboard

### Routes
- GET / - Dashboard with all businesses
- GET /business/<id> - Business detail page
- GET /business/<id>/reviews - Paginated reviews with filters
- POST /business/<id>/scrape - Trigger manual scrape (AJAX)
- GET /api/business/<id>/stats - JSON stats for charts

### Dashboard Page (/)
Cards for each business showing:
- Name and source links (icons)
- Average rating with stars
- Total review count
- Sentiment breakdown (colored bar: green/gray/red)
- Last scraped timestamp
- Status badge (success/failed/stale)
- "Scrape Now" button

### Business Detail Page (/business/<id>)
- Header: name, all source links
- Stats row: avg rating, review count, sentiment split
- Rating trend chart (Chart.js line chart)
- Scrape history/status
- Recent reviews list with:
  - Source icon
  - Author
  - Star rating
  - Sentiment badge
  - Review text (truncated, expandable)
  - Date
- Filters: source, sentiment, date range

### Styling
- Tailwind CSS via CDN
- Clean, professional
- Mobile responsive
- Light/dark mode toggle (optional)

## Email Alerts

When new negative review detected (rating < threshold):

```
Subject: [Review Hound] New negative review for Joe's Pizza

A new negative review was detected:

Business: Joe's Pizza
Source: TrustPilot
Rating: 2/5 stars
Sentiment: Negative (-0.65)

Review:
"The pizza was cold and arrived 45 minutes late..."

View all reviews: http://localhost:5000/business/1

---
Review Hound Alert System
```

SMTP config via environment variables.

## Configuration

### .env.example
```
# Database
DATABASE_PATH=data/reviews.db

# Scraping
REQUEST_DELAY_MIN=2.0
REQUEST_DELAY_MAX=4.0
MAX_PAGES_PER_SOURCE=3

# Email Alerts (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=alerts@example.com

# Web
FLASK_SECRET_KEY=change-this-in-production
FLASK_DEBUG=false

# Scheduler
SCRAPE_INTERVAL_HOURS=6
```

### config.py
Load from .env with sensible defaults. Validate on startup.

## Docker Setup

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create data directory
RUN mkdir -p /app/data /app/exports

# Persistent storage for database and exports
VOLUME ["/app/data", "/app/exports"]

EXPOSE 5000

# Default: run web server with scheduler
CMD ["python", "-m", "reviewhound", "web", "--host", "0.0.0.0", "--port", "5000", "--with-scheduler"]
```

### .dockerignore
```
__pycache__
*.pyc
.env
data/
exports/
.git
.gitignore
*.md
tests/
.pytest_cache
```

### Usage
```bash
# Build
docker build -t review-hound .

# Run (detached, auto-restart, persistent data)
docker run -d \
  --name review-hound \
  --restart unless-stopped \
  -p 5000:5000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/exports:/app/exports \
  --env-file .env \
  review-hound

# View logs
docker logs -f review-hound

# Stop
docker stop review-hound
```

## Deployment Options

### Local Development
```bash
# Install
pip install -e .

# Run CLI commands directly
reviewhound add "Test Business" --trustpilot "..."
reviewhound scrape --all

# Run web UI (no scheduler)
reviewhound web

# Run scheduler in foreground (separate terminal)
reviewhound watch
```

### Docker (Recommended)
- Single container runs Flask + APScheduler
- Mount volumes for persistent data
- Use `--restart unless-stopped` for auto-recovery
- Works on any machine with Docker

### Cloud Hosting (Free Tiers)
If you want it running 24/7 without your PC:

**Railway.app**
- Connect GitHub repo
- Add environment variables in dashboard
- Deploys automatically on push
- Free tier: 500 hours/month

**Render.com**
- Similar to Railway
- Free tier has some sleep behavior
- Good enough for demos

**PythonAnywhere**
- Free tier includes scheduled tasks
- More manual setup
- Reliable for small projects

## Testing

### test_scrapers.py
- Mock HTTP responses with responses library
- Test parsing logic with sample HTML
- Test rate limiting
- Test error handling

### test_sentiment.py
- Test known positive/negative phrases
- Test edge cases (empty, very short)
- Test batch processing

### test_models.py
- Test CRUD operations
- Test unique constraints (external_id)
- Test relationships

```bash
# Run tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=reviewhound --cov-report=html
```

## README Structure

```markdown
# Review Hound 🐕

A review aggregator that monitors business reviews across multiple platforms, analyzes sentiment, and alerts you to negative feedback.

## Features
- Scrapes reviews from TrustPilot, BBB, and Yelp
- Sentiment analysis on all reviews
- Web dashboard with charts and filtering
- Email alerts for negative reviews
- Scheduled automatic checking
- CSV export
- Docker support

## Quick Start

### Using Docker (Recommended)
[docker commands]

### Manual Installation
[pip install steps]

## CLI Reference
[command examples]

## Configuration
[env vars table]

## Screenshots
[dashboard screenshot placeholder]

## Deployment
[deployment options]

## ⚠️ Disclaimer
This tool is for educational purposes. Web scraping may violate terms of service of some platforms. Use responsibly and respect rate limits.

## License
MIT
```

## Implementation Order

1. Project setup: structure, requirements, config loading
2. Database models and migrations
3. Base scraper class
4. TrustPilot scraper (easiest, start here)
5. CLI: add, list, scrape commands
6. Sentiment analysis integration
7. CLI: reviews, stats, export commands
8. BBB scraper
9. Yelp scraper
10. Web dashboard: basic routes and templates
11. Web dashboard: charts and filtering
12. Email alerts
13. Scheduler integration
14. Docker setup
15. Tests
16. README and documentation

## Notes

- Keep scrapers modular - easy to add/remove sources
- Log everything to ScrapeLog for debugging
- Fail gracefully - one broken scraper shouldn't kill the app
- The --with-scheduler flag is key for Docker deployment
- Don't over-engineer: SQLite is fine, no need for Postgres
- Include sample data or a --demo flag for easy testing
