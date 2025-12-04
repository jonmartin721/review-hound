import os
from datetime import date, datetime, timezone

import pytest
from click.testing import CliRunner
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_PATH", ":memory:")


@pytest.fixture
def db_engine():
    from reviewhound.models import Base
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(db_engine):
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def sample_business(db_session):
    """Create a sample business with all URL fields populated."""
    from reviewhound.models import Business
    business = Business(
        name="Test Business",
        address="123 Main St, Test City, TC 12345",
        trustpilot_url="https://www.trustpilot.com/review/testbusiness.com",
        bbb_url="https://www.bbb.org/us/tc/test-city/profile/test-business",
        yelp_url="https://www.yelp.com/biz/test-business-test-city",
        google_place_id="ChIJtest123",
        yelp_business_id="test-business-test-city",
    )
    db_session.add(business)
    db_session.flush()
    return business


@pytest.fixture
def sample_reviews(db_session, sample_business):
    """Create sample reviews with various sentiments and sources."""
    from reviewhound.models import Review
    reviews = [
        Review(
            business_id=sample_business.id,
            source="trustpilot",
            external_id="tp_001",
            author_name="Happy Customer",
            rating=5.0,
            text="Excellent service! Highly recommend.",
            review_date=date.today(),
            sentiment_score=0.9,
            sentiment_label="positive",
        ),
        Review(
            business_id=sample_business.id,
            source="bbb",
            external_id="bbb_001",
            author_name="Unhappy Customer",
            rating=1.0,
            text="Terrible experience. Would not recommend.",
            review_date=date.today(),
            sentiment_score=-0.8,
            sentiment_label="negative",
        ),
        Review(
            business_id=sample_business.id,
            source="yelp",
            external_id="yelp_001",
            author_name="Neutral Customer",
            rating=3.0,
            text="It was okay. Nothing special.",
            review_date=date.today(),
            sentiment_score=0.05,
            sentiment_label="neutral",
        ),
    ]
    db_session.add_all(reviews)
    db_session.flush()
    return reviews


@pytest.fixture
def sample_alert_config(db_session, sample_business):
    """Create a sample alert configuration."""
    from reviewhound.models import AlertConfig
    alert = AlertConfig(
        business_id=sample_business.id,
        email="test@example.com",
        alert_on_negative=True,
        negative_threshold=3.0,
        enabled=True,
    )
    db_session.add(alert)
    db_session.flush()
    return alert


@pytest.fixture
def sample_api_configs(db_session):
    """Create sample API configurations for Google Places and Yelp."""
    from reviewhound.models import APIConfig
    configs = [
        APIConfig(provider="google_places", api_key="test-google-api-key-12345", enabled=True),
        APIConfig(provider="yelp_fusion", api_key="test-yelp-api-key-67890", enabled=True),
    ]
    db_session.add_all(configs)
    db_session.flush()
    return configs


@pytest.fixture
def sample_sentiment_config(db_session):
    """Create a custom sentiment configuration."""
    from reviewhound.models import SentimentConfig
    config = SentimentConfig(
        rating_weight=0.6,
        text_weight=0.4,
        threshold=0.15,
    )
    db_session.add(config)
    db_session.flush()
    return config


@pytest.fixture
def cli_runner():
    """Click CLI test runner."""
    return CliRunner()


@pytest.fixture
def mock_scraper():
    """Create a mock scraper for testing."""
    from unittest.mock import MagicMock
    scraper = MagicMock()
    scraper.source = "test_source"
    scraper.scrape.return_value = [
        {
            "external_id": "test_001",
            "author_name": "Test Author",
            "rating": 4.0,
            "text": "Test review content",
            "review_date": date.today(),
        }
    ]
    return scraper
