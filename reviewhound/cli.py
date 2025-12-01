import csv
from datetime import datetime, timezone
from pathlib import Path

import click
from rich.console import Console
from rich.table import Table

from reviewhound.config import Config
from reviewhound.database import init_db, get_session
from reviewhound.models import Business, Review, ScrapeLog, AlertConfig
from reviewhound.scrapers import TrustPilotScraper, BBBScraper, YelpScraper
from reviewhound.analysis import analyze_review
from reviewhound.alerts import check_and_send_alerts

console = Console()


@click.group()
@click.version_option()
def cli():
    """Review Hound - Business review aggregator"""
    init_db()


@cli.command()
@click.argument("name")
@click.option("--address", help="Business address")
@click.option("--trustpilot", help="TrustPilot URL")
@click.option("--bbb", help="BBB URL")
@click.option("--yelp", help="Yelp URL")
def add(name, address, trustpilot, bbb, yelp):
    """Add a business to track."""
    with get_session() as session:
        business = Business(
            name=name,
            address=address,
            trustpilot_url=trustpilot,
            bbb_url=bbb,
            yelp_url=yelp,
        )
        session.add(business)
        session.flush()
        console.print(f"[green]Added business:[/green] {name} (ID: {business.id})")


@cli.command("list")
def list_businesses():
    """List all tracked businesses."""
    with get_session() as session:
        businesses = session.query(Business).all()

        if not businesses:
            console.print("[yellow]No businesses tracked yet.[/yellow]")
            return

        table = Table(title="Tracked Businesses")
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="green")
        table.add_column("TrustPilot", style="blue")
        table.add_column("BBB", style="blue")
        table.add_column("Yelp", style="blue")

        for b in businesses:
            table.add_row(
                str(b.id),
                b.name,
                "✓" if b.trustpilot_url else "-",
                "✓" if b.bbb_url else "-",
                "✓" if b.yelp_url else "-",
            )

        console.print(table)


@cli.command()
@click.argument("identifier", required=False)
@click.option("--all", "scrape_all", is_flag=True, help="Scrape all businesses")
def scrape(identifier, scrape_all):
    """Scrape reviews for a business (by ID or name) or --all."""
    with get_session() as session:
        if scrape_all:
            businesses = session.query(Business).all()
        elif identifier:
            try:
                business = session.query(Business).get(int(identifier))
            except ValueError:
                business = session.query(Business).filter(
                    Business.name.ilike(f"%{identifier}%")
                ).first()

            if not business:
                console.print(f"[red]Business not found:[/red] {identifier}")
                return
            businesses = [business]
        else:
            console.print("[red]Provide a business ID/name or use --all[/red]")
            return

        for business in businesses:
            _scrape_business(session, business)


def _scrape_business(session, business: Business):
    """Scrape all configured sources for a business."""
    console.print(f"\n[bold]Scraping:[/bold] {business.name}")

    scrapers = []
    if business.trustpilot_url:
        scrapers.append((TrustPilotScraper(), business.trustpilot_url))
    if business.bbb_url:
        scrapers.append((BBBScraper(), business.bbb_url))
    if business.yelp_url:
        scrapers.append((YelpScraper(), business.yelp_url))

    if not scrapers:
        console.print("[yellow]  No URLs configured[/yellow]")
        return

    for scraper, url in scrapers:
        _run_scraper(session, business, scraper, url)


def _run_scraper(session, business: Business, scraper, url: str):
    """Run a single scraper and save results."""
    source = scraper.source
    console.print(f"  [blue]{source}:[/blue] ", end="")

    log = ScrapeLog(
        business_id=business.id,
        source=source,
        status="running",
        started_at=datetime.now(timezone.utc),
    )
    session.add(log)
    session.flush()

    try:
        reviews = scraper.scrape(url)
        new_count = 0

        for review_data in reviews:
            existing = session.query(Review).filter(
                Review.source == source,
                Review.external_id == review_data["external_id"],
            ).first()

            if existing:
                continue

            score, label = analyze_review(review_data.get("text", ""))

            review = Review(
                business_id=business.id,
                source=source,
                external_id=review_data["external_id"],
                author_name=review_data.get("author_name"),
                rating=review_data.get("rating"),
                text=review_data.get("text"),
                review_date=review_data.get("review_date"),
                sentiment_score=score,
                sentiment_label=label,
            )
            session.add(review)
            new_count += 1

            # Check and send alerts for this review
            session.flush()  # Ensure review has an ID
            check_and_send_alerts(session, business, review)

        log.status = "success"
        log.reviews_found = new_count
        log.completed_at = datetime.now(timezone.utc)
        console.print(f"[green]{new_count} new reviews[/green]")

    except Exception as e:
        log.status = "failed"
        log.error_message = str(e)
        log.completed_at = datetime.now(timezone.utc)
        console.print(f"[red]Failed: {e}[/red]")


@cli.command()
@click.argument("business_id", type=int)
@click.option("--limit", default=20, help="Max reviews to show")
@click.option("--source", help="Filter by source (trustpilot, bbb, yelp)")
@click.option("--sentiment", help="Filter by sentiment (positive, negative, neutral)")
def reviews(business_id, limit, source, sentiment):
    """Show reviews for a business."""
    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            console.print(f"[red]Business not found:[/red] {business_id}")
            return

        query = session.query(Review).filter(Review.business_id == business_id)

        if source:
            query = query.filter(Review.source == source)
        if sentiment:
            query = query.filter(Review.sentiment_label == sentiment)

        query = query.order_by(Review.scraped_at.desc()).limit(limit)
        reviews = query.all()

        if not reviews:
            console.print("[yellow]No reviews found.[/yellow]")
            return

        console.print(f"\n[bold]{business.name}[/bold] - Reviews\n")

        for r in reviews:
            sentiment_color = {"positive": "green", "negative": "red", "neutral": "yellow"}.get(r.sentiment_label, "white")
            console.print(f"[cyan]{r.source}[/cyan] | [bold]{r.author_name or 'Anonymous'}[/bold] | ★{r.rating or '-'}")
            console.print(f"[{sentiment_color}]{r.sentiment_label}[/{sentiment_color}] ({r.sentiment_score:.2f})" if r.sentiment_score else "")
            console.print(f"{r.text[:200]}..." if r.text and len(r.text) > 200 else r.text or "")
            console.print(f"[dim]{r.review_date or r.scraped_at.date()}[/dim]")
            console.print("─" * 60)


@cli.command()
@click.argument("business_id", type=int)
def stats(business_id):
    """Show summary statistics for a business."""
    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            console.print(f"[red]Business not found:[/red] {business_id}")
            return

        reviews = session.query(Review).filter(Review.business_id == business_id).all()

        if not reviews:
            console.print(f"[yellow]No reviews for {business.name}[/yellow]")
            return

        total = len(reviews)
        avg_rating = sum(r.rating for r in reviews if r.rating) / len([r for r in reviews if r.rating]) if any(r.rating for r in reviews) else 0

        positive = len([r for r in reviews if r.sentiment_label == "positive"])
        negative = len([r for r in reviews if r.sentiment_label == "negative"])
        neutral = len([r for r in reviews if r.sentiment_label == "neutral"])

        by_source = {}
        for r in reviews:
            by_source[r.source] = by_source.get(r.source, 0) + 1

        console.print(f"\n[bold]{business.name}[/bold] - Statistics\n")

        table = Table()
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")

        table.add_row("Total Reviews", str(total))
        table.add_row("Average Rating", f"{avg_rating:.1f} ★")
        table.add_row("Positive", f"{positive} ({positive/total*100:.0f}%)")
        table.add_row("Neutral", f"{neutral} ({neutral/total*100:.0f}%)")
        table.add_row("Negative", f"{negative} ({negative/total*100:.0f}%)")

        for source, count in by_source.items():
            table.add_row(f"From {source}", str(count))

        console.print(table)


@cli.command()
@click.argument("business_id", type=int)
@click.option("--output", "-o", default=None, help="Output file path")
def export(business_id, output):
    """Export reviews to CSV."""
    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            console.print(f"[red]Business not found:[/red] {business_id}")
            return

        reviews = session.query(Review).filter(Review.business_id == business_id).all()

        if not reviews:
            console.print(f"[yellow]No reviews to export[/yellow]")
            return

        if not output:
            safe_name = business.name.lower().replace(" ", "_")
            output = f"exports/{safe_name}_reviews.csv"

        Path(output).parent.mkdir(parents=True, exist_ok=True)

        with open(output, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["source", "author", "rating", "text", "date", "sentiment_score", "sentiment_label"])

            for r in reviews:
                writer.writerow([
                    r.source,
                    r.author_name,
                    r.rating,
                    r.text,
                    r.review_date,
                    r.sentiment_score,
                    r.sentiment_label,
                ])

        console.print(f"[green]Exported {len(reviews)} reviews to {output}[/green]")


@cli.command()
@click.argument("business_id", type=int)
@click.argument("email")
@click.option("--threshold", default=3.0, help="Alert on ratings at or below this (default: 3.0)")
@click.option("--disable", is_flag=True, help="Disable alerts instead of enabling")
def alert(business_id, email, threshold, disable):
    """Configure email alerts for a business."""
    with get_session() as session:
        business = session.query(Business).get(business_id)
        if not business:
            console.print(f"[red]Business not found:[/red] {business_id}")
            return

        # Check if config already exists
        existing = session.query(AlertConfig).filter(
            AlertConfig.business_id == business_id,
            AlertConfig.email == email
        ).first()

        if existing:
            existing.enabled = not disable
            existing.negative_threshold = threshold
            action = "Disabled" if disable else "Updated"
        else:
            if disable:
                console.print("[yellow]No alert config exists to disable[/yellow]")
                return
            config = AlertConfig(
                business_id=business_id,
                email=email,
                alert_on_negative=True,
                negative_threshold=threshold,
                enabled=True
            )
            session.add(config)
            action = "Created"

        console.print(f"[green]{action} alert config:[/green] {business.name} → {email} (threshold: {threshold}★)")


@cli.command("alerts")
@click.argument("business_id", type=int, required=False)
def list_alerts(business_id):
    """List alert configurations."""
    with get_session() as session:
        query = session.query(AlertConfig)
        if business_id:
            query = query.filter(AlertConfig.business_id == business_id)

        configs = query.all()

        if not configs:
            console.print("[yellow]No alert configurations found.[/yellow]")
            return

        table = Table(title="Alert Configurations")
        table.add_column("Business", style="cyan")
        table.add_column("Email", style="green")
        table.add_column("Threshold", style="yellow")
        table.add_column("Enabled", style="blue")

        for c in configs:
            business = session.query(Business).get(c.business_id)
            table.add_row(
                business.name if business else f"ID:{c.business_id}",
                c.email,
                f"≤{c.negative_threshold}★",
                "✓" if c.enabled else "✗"
            )

        console.print(table)


@cli.command()
@click.option("--interval", default=None, type=int, help="Override scrape interval (hours)")
def watch(interval):
    """Run the scheduler to periodically scrape all businesses."""
    from reviewhound.scheduler import run_scheduler

    if interval:
        Config.SCRAPE_INTERVAL_HOURS = interval
        console.print(f"[yellow]Interval overridden to {interval} hours[/yellow]")

    console.print(f"[green]Starting watch mode (every {Config.SCRAPE_INTERVAL_HOURS} hours)[/green]")
    console.print("[dim]Press Ctrl+C to stop[/dim]")
    run_scheduler()


@cli.command()
@click.option("--host", default="127.0.0.1", help="Host to bind to")
@click.option("--port", default=5000, help="Port to bind to")
@click.option("--debug", is_flag=True, help="Enable debug mode")
@click.option("--with-scheduler", is_flag=True, help="Run scheduler in background")
def web(host, port, debug, with_scheduler):
    """Run the web dashboard."""
    from reviewhound.web import create_app

    app = create_app()

    if with_scheduler:
        from reviewhound.scheduler import create_scheduler
        scheduler = create_scheduler(blocking=False)
        scheduler.start()
        console.print(f"[green]Scheduler started (every {Config.SCRAPE_INTERVAL_HOURS} hours)[/green]")

    console.print(f"[green]Starting web dashboard at http://{host}:{port}[/green]")
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    cli()
