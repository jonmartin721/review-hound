from textblob import TextBlob

SENTIMENT_THRESHOLD = 0.1


def analyze_review(text: str) -> tuple[float, str]:
    """Analyze sentiment of review text.

    Returns:
        tuple of (score, label) where:
        - score: float from -1.0 (negative) to 1.0 (positive)
        - label: 'positive', 'negative', or 'neutral'
    """
    if not text or not text.strip():
        return 0.0, "neutral"

    blob = TextBlob(text)
    score = blob.sentiment.polarity

    if score > SENTIMENT_THRESHOLD:
        label = "positive"
    elif score < -SENTIMENT_THRESHOLD:
        label = "negative"
    else:
        label = "neutral"

    return score, label
