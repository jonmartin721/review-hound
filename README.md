# 🐕 Review Hound

A Python-based business review aggregator that scrapes reviews from multiple sources, performs sentiment analysis, and provides real-time alerts for negative feedback.

## Features

- **Multi-Source Scraping**: Aggregates reviews from TrustPilot, BBB, and Yelp
- **Sentiment Analysis**: Automatic sentiment scoring using TextBlob
- **Web Dashboard**: Visual overview of all tracked businesses with charts
- **Email Alerts**: Get notified when negative reviews are posted
- **CLI Interface**: Full-featured command-line tool
- **Scheduled Scraping**: Automatic periodic review collection
- **CSV Export**: Export reviews for external analysis

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/jonmartin721/review-hound.git
cd review-hound

# Start with Docker Compose
docker-compose up -d

# Access the web dashboard
open http://localhost:5000
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/jonmartin721/review-hound.git
cd review-hound

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -e .

# Run the web dashboard
python -m reviewhound web
```

## CLI Usage

### Add a Business

```bash
# Add with TrustPilot URL
reviewhound add "Acme Corp" --trustpilot "https://www.trustpilot.com/review/acme.com"

# Add with multiple sources
reviewhound add "Acme Corp" \
  --trustpilot "https://www.trustpilot.com/review/acme.com" \
  --bbb "https://www.bbb.org/..." \
  --yelp "https://www.yelp.com/biz/acme-corp"
```

### Scrape Reviews

```bash
# Scrape a specific business (by ID or name)
reviewhound scrape 1
reviewhound scrape "Acme"

# Scrape all businesses
reviewhound scrape --all
```

### View Reviews

```bash
# List all businesses
reviewhound list

# View reviews for a business
reviewhound reviews 1 --limit 50

# Filter by sentiment
reviewhound reviews 1 --sentiment negative

# View statistics
reviewhound stats 1
```

### Export Data

```bash
# Export to CSV
reviewhound export 1 -o acme_reviews.csv
```

### Email Alerts

```bash
# Configure alerts for negative reviews
reviewhound alert 1 alerts@company.com --threshold 3.0

# List alert configurations
reviewhound alerts
```

### Scheduled Scraping

```bash
# Run scheduler (scrapes every 6 hours by default)
reviewhound watch

# Custom interval
reviewhound watch --interval 2

# Run web dashboard with scheduler
reviewhound web --with-scheduler
```

## Configuration

Create a `.env` file in the project root:

```env
# Database
DATABASE_PATH=data/reviews.db

# Scraping
REQUEST_DELAY_MIN=2.0
REQUEST_DELAY_MAX=4.0
MAX_PAGES_PER_SOURCE=3

# Scheduler
SCRAPE_INTERVAL_HOURS=6

# Email Alerts (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=alerts@yourdomain.com

# Web Dashboard
FLASK_SECRET_KEY=change-this-in-production
FLASK_DEBUG=false
```

## Web Dashboard

The web dashboard provides:

- **Dashboard**: Overview of all businesses with sentiment bars and ratings
- **Business Detail**: Individual business stats, rating trends, and recent reviews
- **Reviews Page**: Filterable list of all reviews with pagination
- **One-Click Scraping**: Trigger scrapes directly from the UI

Access at `http://localhost:5000` after starting with `reviewhound web`.

## Project Structure

```
review-hound/
├── reviewhound/
│   ├── __init__.py
│   ├── __main__.py
│   ├── cli.py              # CLI commands
│   ├── config.py           # Configuration
│   ├── database.py         # Database setup
│   ├── models.py           # SQLAlchemy models
│   ├── scheduler.py        # APScheduler setup
│   ├── scrapers/
│   │   ├── base.py         # Abstract scraper
│   │   ├── trustpilot.py
│   │   ├── bbb.py
│   │   └── yelp.py
│   ├── analysis/
│   │   └── sentiment.py    # TextBlob analysis
│   ├── alerts/
│   │   └── email.py        # SMTP alerts
│   └── web/
│       ├── app.py          # Flask factory
│       ├── routes.py       # Web routes
│       ├── templates/
│       └── static/
├── tests/
├── data/                   # SQLite database
├── exports/                # CSV exports
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## Development

```bash
# Run tests
pytest tests/ -v

# Run with debug mode
reviewhound web --debug
```

## Disclaimer

This tool is intended for educational and personal use. Web scraping may violate the Terms of Service of some websites. Users are responsible for ensuring their use complies with applicable laws and website policies. Always respect rate limits and robots.txt directives.

## License

MIT License - see LICENSE file for details.
