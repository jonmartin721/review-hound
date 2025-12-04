# PyPI Packaging Design

**Date:** 2025-12-04
**Status:** Approved

## Goal

Make reviewhound installable via `pip install reviewhound` with automatic releases when tags are pushed to GitHub.

## Deliverables

1. `pyproject.toml` - Modern package configuration (replaces setup.py)
2. `MANIFEST.in` - Include web templates/static files in source distribution
3. `.github/workflows/publish.yml` - Auto-publish to PyPI on version tags
4. Delete `setup.py` - No longer needed

## pyproject.toml Structure

```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "reviewhound"
version = "1.0.0"
description = "Business review aggregator with sentiment analysis"
readme = "README.md"
license = {text = "MIT"}
requires-python = ">=3.11"
keywords = ["reviews", "scraping", "sentiment-analysis", "business", "monitoring"]
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
dependencies = [
    "beautifulsoup4>=4.12.0",
    "requests>=2.31.0",
    "sqlalchemy>=2.0.0",
    "textblob>=0.18.0",
    "flask>=3.0.0",
    "apscheduler>=3.10.0",
    "click>=8.1.0",
    "rich>=13.0.0",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-cov>=4.0.0",
    "responses>=0.25.0",
]

[project.scripts]
reviewhound = "reviewhound.cli:cli"

[project.urls]
Homepage = "https://github.com/USERNAME/review-hound"
Repository = "https://github.com/USERNAME/review-hound"
"Bug Tracker" = "https://github.com/USERNAME/review-hound/issues"

[tool.setuptools.packages.find]
where = ["."]

[tool.setuptools.package-data]
"reviewhound.web" = ["templates/*.html", "static/*.css", "static/*.js"]
```

## MANIFEST.in

```
include README.md
include LICENSE
recursive-include reviewhound/web/templates *.html
recursive-include reviewhound/web/static *.css *.js
```

## GitHub Actions Workflow

Triggers on tags matching `v*` pattern (e.g., v1.0.0).

Steps:
1. Checkout code
2. Set up Python 3.11
3. Install dependencies and build tools
4. Run tests
5. Build package (wheel + sdist)
6. Publish to PyPI using API token

Requires secret: `PYPI_API_TOKEN`

## User Experience

After implementation:

```bash
# Install
pip install reviewhound

# Use CLI
reviewhound --help
reviewhound add "Business Name" --source trustpilot --url https://...
reviewhound scrape
reviewhound web  # Start dashboard at localhost:5000
```

## Release Process

1. Update version in `pyproject.toml`
2. Commit changes
3. Create and push tag: `git tag v1.0.0 && git push --tags`
4. GitHub Actions builds and publishes to PyPI automatically
