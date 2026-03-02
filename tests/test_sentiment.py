from reviewhound.analysis.sentiment import analyze_review


class TestSentimentAnalysis:
    def test_positive_review(self):
        text = "Absolutely amazing! Best experience ever. Highly recommend!"
        score, label = analyze_review(text)
        assert label == "positive"
        assert score > 0.1

    def test_negative_review(self):
        text = "Terrible service. Worst experience of my life. Avoid at all costs."
        score, label = analyze_review(text)
        assert label == "negative"
        assert score < -0.1

    def test_neutral_review(self):
        text = "The product arrived. It works as described."
        score, label = analyze_review(text)
        assert label == "neutral"
        assert -0.1 <= score <= 0.1

    def test_empty_text(self):
        score, label = analyze_review("")
        assert label == "neutral"
        assert score == 0.0

    def test_very_short_text(self):
        score, label = analyze_review("OK")
        assert label in ("positive", "negative", "neutral")
        assert -1.0 <= score <= 1.0

    def test_only_rating_no_text(self):
        """Should use rating score when text is empty."""
        score, label = analyze_review("", rating=5.0)
        assert score > 0
        assert label == "positive"

    def test_only_text_no_rating(self):
        """Should use text score when rating is None."""
        score, _label = analyze_review("This is absolutely wonderful!", rating=None)
        assert score > 0

    def test_zero_weights_fallback(self):
        """Should fall back to rating when both weights are zero."""
        score, label = analyze_review("Some text", rating=5.0, rating_weight=0.0, text_weight=0.0)
        assert score == 1.0  # (5-3)/2 = 1.0
        assert label == "positive"


class TestSentimentUtilities:
    """Tests for standalone sentiment utility functions."""

    def test_rating_to_score_none(self):
        from reviewhound.analysis.sentiment import rating_to_score

        assert rating_to_score(None) == 0.0

    def test_rating_to_score_one_star(self):
        from reviewhound.analysis.sentiment import rating_to_score

        assert rating_to_score(1.0) == -1.0

    def test_rating_to_score_three_stars(self):
        from reviewhound.analysis.sentiment import rating_to_score

        assert rating_to_score(3.0) == 0.0

    def test_rating_to_score_five_stars(self):
        from reviewhound.analysis.sentiment import rating_to_score

        assert rating_to_score(5.0) == 1.0

    def test_text_to_score_none(self):
        from reviewhound.analysis.sentiment import text_to_score

        assert text_to_score(None) == 0.0

    def test_text_to_score_empty(self):
        from reviewhound.analysis.sentiment import text_to_score

        assert text_to_score("") == 0.0

    def test_text_to_score_whitespace_only(self):
        from reviewhound.analysis.sentiment import text_to_score

        assert text_to_score("   ") == 0.0

    def test_text_to_score_positive(self):
        from reviewhound.analysis.sentiment import text_to_score

        score = text_to_score("This is absolutely amazing and wonderful!")
        assert score > 0

    def test_text_to_score_negative(self):
        from reviewhound.analysis.sentiment import text_to_score

        score = text_to_score("This is terrible and awful!")
        assert score < 0
