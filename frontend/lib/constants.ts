// Mirrors reviewhound/config.py defaults

export const REVIEWS_PER_PAGE = 20;
export const REVIEW_TEXT_PREVIEW_LENGTH = 200;
export const CHART_MONTHS = 12;
export const SCRAPE_INTERVAL_HOURS = 6;
export const COMPLAINT_DEFAULT_RATING = 1.0;

// Sentiment defaults
export const SENTIMENT_RATING_WEIGHT = 0.7;
export const SENTIMENT_TEXT_WEIGHT = 0.3;
export const SENTIMENT_THRESHOLD = 0.1;

// Rating scale
export const RATING_SCALE_CENTER = 3;
export const RATING_SCALE_DIVISOR = 2;

// Trend analysis
export const TREND_STABILITY_THRESHOLD = 0.1;

// Sources
export const SOURCES = ['trustpilot', 'bbb', 'yelp', 'google_places', 'yelp_api'] as const;
export type Source = typeof SOURCES[number];

// Sentiments
export const SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
export type Sentiment = typeof SENTIMENTS[number];
