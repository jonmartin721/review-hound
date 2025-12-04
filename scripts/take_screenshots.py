#!/usr/bin/env python3
"""
Take screenshots of Review Hound web app for documentation.

Usage:
    pip install playwright
    playwright install chromium
    python scripts/take_screenshots.py
"""

import os
import sys
import time
import random
import subprocess
import signal
from datetime import datetime, date, timedelta
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Use a separate database for screenshots
SCREENSHOT_DB = PROJECT_ROOT / "data" / "screenshots_demo.db"
os.environ["DATABASE_PATH"] = str(SCREENSHOT_DB)

from playwright.sync_api import sync_playwright
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from reviewhound.models import Base, Business, Review, ScrapeLog


def seed_demo_data():
    """Create realistic demo data for screenshots."""
    engine = create_engine(f"sqlite:///{SCREENSHOT_DB}")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)
    session = Session()

    # Demo businesses
    businesses = [
        Business(
            name="Acme Coffee Roasters",
            address="123 Main St, Portland, OR 97201",
            trustpilot_url="https://www.trustpilot.com/review/acmecoffee.com",
            yelp_url="https://www.yelp.com/biz/acme-coffee-portland",
        ),
        Business(
            name="TechStart Solutions",
            address="456 Innovation Blvd, Austin, TX 78701",
            trustpilot_url="https://www.trustpilot.com/review/techstart.io",
            bbb_url="https://www.bbb.org/us/tx/austin/profile/software/techstart-solutions",
        ),
        Business(
            name="Green Garden Landscaping",
            address="789 Oak Ave, Denver, CO 80202",
            yelp_url="https://www.yelp.com/biz/green-garden-landscaping-denver",
            bbb_url="https://www.bbb.org/us/co/denver/profile/landscaping/green-garden",
        ),
    ]

    session.add_all(businesses)
    session.flush()

    # Sample review texts
    positive_reviews = [
        "Absolutely fantastic experience! The team went above and beyond.",
        "Best service I've ever received. Highly recommend to everyone!",
        "Amazing quality and incredible attention to detail. Will be back!",
        "Five stars all the way. Professional, friendly, and efficient.",
        "Exceeded all my expectations. Truly world-class service.",
        "Outstanding work! They really know what they're doing.",
    ]

    neutral_reviews = [
        "Decent service overall. Nothing special but got the job done.",
        "Average experience. Some things were good, others could improve.",
        "It was okay. Met expectations but didn't exceed them.",
    ]

    negative_reviews = [
        "Very disappointed with the service. Expected much better.",
        "Had some issues that weren't resolved to my satisfaction.",
        "Not what I was hoping for. Room for improvement.",
    ]

    authors = [
        "Sarah M.", "John D.", "Emily R.", "Michael T.", "Jessica L.",
        "David K.", "Amanda S.", "Chris B.", "Rachel H.", "Kevin W.",
        "Lisa P.", "Mark J.", "Nicole F.", "Brian C.", "Ashley G.",
    ]

    sources = ["trustpilot", "yelp", "bbb"]

    # Generate reviews for each business
    for business in businesses:
        num_reviews = random.randint(25, 45)

        for i in range(num_reviews):
            # Weighted distribution: more positive reviews
            rand = random.random()
            if rand < 0.65:
                text = random.choice(positive_reviews)
                rating = random.choice([4.0, 5.0])
                sentiment_score = random.uniform(0.3, 0.8)
                sentiment_label = "positive"
            elif rand < 0.85:
                text = random.choice(neutral_reviews)
                rating = 3.0
                sentiment_score = random.uniform(-0.1, 0.1)
                sentiment_label = "neutral"
            else:
                text = random.choice(negative_reviews)
                rating = random.choice([1.0, 2.0])
                sentiment_score = random.uniform(-0.6, -0.2)
                sentiment_label = "negative"

            # Spread reviews over last 6 months
            days_ago = random.randint(1, 180)
            review_date = date.today() - timedelta(days=days_ago)
            scraped_at = datetime.now() - timedelta(days=days_ago - 1)

            review = Review(
                business_id=business.id,
                source=random.choice(sources),
                external_id=f"demo-{business.id}-{i}",
                author_name=random.choice(authors),
                rating=rating,
                text=text,
                review_date=review_date,
                sentiment_score=sentiment_score,
                sentiment_label=sentiment_label,
                scraped_at=scraped_at,
            )
            session.add(review)

        # Add scrape logs
        for source in sources:
            log = ScrapeLog(
                business_id=business.id,
                source=source,
                status="success",
                reviews_found=random.randint(8, 15),
                started_at=datetime.now() - timedelta(hours=2),
                completed_at=datetime.now() - timedelta(hours=2, minutes=-1),
            )
            session.add(log)

    session.commit()
    session.close()
    print(f"Seeded demo data to {SCREENSHOT_DB}")


def start_server():
    """Start the Flask development server."""
    env = os.environ.copy()
    env["DATABASE_PATH"] = str(SCREENSHOT_DB)
    env["FLASK_DEBUG"] = "0"

    process = subprocess.Popen(
        [sys.executable, "-m", "reviewhound", "web", "--port", "5050"],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    # Wait for server to start
    time.sleep(3)
    return process


def take_screenshots():
    """Capture screenshots of all main pages in dark mode."""
    output_dir = PROJECT_ROOT / "docs" / "screenshots"
    output_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            device_scale_factor=2,  # Retina quality
        )
        page = context.new_page()

        base_url = "http://localhost:5050"

        # Enable dark mode before loading pages
        def enable_dark_mode():
            page.evaluate("localStorage.setItem('theme', 'dark')")

        screenshots = [
            ("dashboard", "/", "Dashboard - Business overview with ratings and trends"),
            ("business_detail", "/business/1", "Business detail with rating chart"),
            ("reviews", "/business/1/reviews", "Reviews list with filtering"),
            ("settings", "/settings", "Settings page with API configuration"),
        ]

        for name, path, description in screenshots:
            url = f"{base_url}{path}"
            print(f"Capturing {name}: {url}")

            # Navigate and enable dark mode
            page.goto(url)
            enable_dark_mode()
            page.reload()

            # Wait for page to fully render
            page.wait_for_load_state("networkidle")
            time.sleep(0.5)

            # Take screenshot
            filepath = output_dir / f"{name}.png"
            page.screenshot(path=str(filepath))
            print(f"  Saved: {filepath}")

        browser.close()

    print(f"\nScreenshots saved to {output_dir}")


def cleanup(server_process):
    """Stop the server and clean up."""
    if server_process:
        server_process.terminate()
        server_process.wait()

    # Remove demo database
    if SCREENSHOT_DB.exists():
        SCREENSHOT_DB.unlink()
        print(f"Cleaned up {SCREENSHOT_DB}")


def main():
    server_process = None

    try:
        print("Seeding demo data...")
        seed_demo_data()

        print("\nStarting web server...")
        server_process = start_server()

        print("\nTaking screenshots...")
        take_screenshots()

    except KeyboardInterrupt:
        print("\nInterrupted")
    except Exception as e:
        print(f"\nError: {e}")
        raise
    finally:
        print("\nCleaning up...")
        cleanup(server_process)


if __name__ == "__main__":
    main()
