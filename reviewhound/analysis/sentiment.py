from textblob import TextBlob


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

    if score > 0.1:
        label = "positive"
    elif score < -0.1:
        label = "negative"
    else:
        label = "neutral"

    return score, label
