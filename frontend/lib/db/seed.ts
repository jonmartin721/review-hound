import { db } from './schema';

export async function seedDemoData(): Promise<void> {
  const count = await db.businesses.count();
  if (count > 0) return; // Already seeded

  // Create 2 sample businesses
  const b1Id = await db.businesses.add({
    name: 'Acme Coffee Co.',
    address: 'Portland, OR',
    trustpilot_url: 'https://www.trustpilot.com/review/acmecoffee.com',
    bbb_url: null,
    yelp_url: null,
    google_place_id: null,
    yelp_business_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const b2Id = await db.businesses.add({
    name: 'Mountain View Auto',
    address: 'Denver, CO',
    trustpilot_url: null,
    bbb_url: 'https://www.bbb.org/us/co/denver/profile/auto-repair/mountain-view-auto',
    yelp_url: null,
    google_place_id: null,
    yelp_business_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Add sample reviews with varied dates, ratings, sentiments
  const now = new Date();
  const reviewData = [
    // Acme Coffee - mostly positive
    { business_id: b1Id!, source: 'trustpilot', external_id: 'demo-tp-1', author_name: 'Sarah M.', rating: 5, text: 'Amazing coffee and incredibly friendly staff. The pour-over is the best I\'ve had. Will definitely be coming back!', sentiment_score: 0.85, sentiment_label: 'positive', days_ago: 2 },
    { business_id: b1Id!, source: 'trustpilot', external_id: 'demo-tp-2', author_name: 'James K.', rating: 4, text: 'Good coffee, nice atmosphere. A bit pricey but the quality makes up for it.', sentiment_score: 0.45, sentiment_label: 'positive', days_ago: 5 },
    { business_id: b1Id!, source: 'trustpilot', external_id: 'demo-tp-3', author_name: 'Lisa R.', rating: 2, text: 'Waited 20 minutes for a simple latte. The drink was okay but the service was painfully slow.', sentiment_score: -0.35, sentiment_label: 'negative', days_ago: 8 },
    { business_id: b1Id!, source: 'trustpilot', external_id: 'demo-tp-4', author_name: 'Mike D.', rating: 5, text: 'Best espresso in Portland, hands down. The baristas really know their craft.', sentiment_score: 0.90, sentiment_label: 'positive', days_ago: 15 },
    { business_id: b1Id!, source: 'trustpilot', external_id: 'demo-tp-5', author_name: 'Anna W.', rating: 3, text: 'Decent coffee. Nothing special but not bad either. Average experience overall.', sentiment_score: 0.05, sentiment_label: 'neutral', days_ago: 22 },
    { business_id: b1Id!, source: 'trustpilot', external_id: 'demo-tp-6', author_name: 'Tom B.', rating: 4, text: 'Great pastries and the cold brew is excellent. Cozy spot to work from.', sentiment_score: 0.60, sentiment_label: 'positive', days_ago: 35 },
    { business_id: b1Id!, source: 'trustpilot', external_id: 'demo-tp-7', author_name: 'Rachel H.', rating: 5, text: 'Love this place! The seasonal drinks are always creative and delicious.', sentiment_score: 0.80, sentiment_label: 'positive', days_ago: 45 },
    { business_id: b1Id!, source: 'trustpilot', external_id: 'demo-tp-8', author_name: 'David L.', rating: 4, text: 'Consistent quality every time I visit. The loyalty program is a nice touch too.', sentiment_score: 0.55, sentiment_label: 'positive', days_ago: 55 },

    // Mountain View Auto - mixed
    { business_id: b2Id!, source: 'bbb', external_id: 'demo-bbb-1', author_name: 'Robert P.', rating: 1, text: 'Terrible experience. They quoted me $500 then charged $1200. Avoid this place at all costs.', sentiment_score: -0.90, sentiment_label: 'negative', days_ago: 3 },
    { business_id: b2Id!, source: 'bbb', external_id: 'demo-bbb-2', author_name: 'Karen S.', rating: 4, text: 'Fair pricing and they explained everything clearly. Fixed my brakes quickly.', sentiment_score: 0.50, sentiment_label: 'positive', days_ago: 10 },
    { business_id: b2Id!, source: 'bbb', external_id: 'demo-bbb-3', author_name: 'Chris M.', rating: 2, text: 'They kept my car for 3 days for what should have been a 2-hour job. Poor communication.', sentiment_score: -0.45, sentiment_label: 'negative', days_ago: 18 },
    { business_id: b2Id!, source: 'bbb', external_id: 'demo-bbb-4', author_name: 'Jennifer A.', rating: 5, text: 'Honest and reliable mechanics. They\'ve been servicing my car for years. Highly recommend!', sentiment_score: 0.85, sentiment_label: 'positive', days_ago: 25 },
    { business_id: b2Id!, source: 'bbb', external_id: 'demo-bbb-5', author_name: 'Mark T.', rating: 3, text: 'Did an okay job on the oil change. Nothing remarkable but they got it done.', sentiment_score: 0.08, sentiment_label: 'neutral', days_ago: 40 },
    { business_id: b2Id!, source: 'bbb', external_id: 'demo-bbb-6', author_name: 'Donna F.', rating: 4, text: 'Good service and reasonable prices. The waiting area could use some updating though.', sentiment_score: 0.40, sentiment_label: 'positive', days_ago: 50 },
  ];

  for (const r of reviewData) {
    const reviewDate = new Date(now.getTime() - r.days_ago * 24 * 60 * 60 * 1000);
    await db.reviews.add({
      business_id: r.business_id,
      source: r.source,
      external_id: r.external_id,
      review_url: null,
      author_name: r.author_name,
      rating: r.rating,
      text: r.text,
      review_date: reviewDate.toISOString().split('T')[0],
      sentiment_score: r.sentiment_score,
      sentiment_label: r.sentiment_label,
      scraped_at: reviewDate.toISOString(),
    });
  }

  // Add scrape logs — timestamps match the most recent review for each business
  const b1LogDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago (matches newest Acme review)
  await db.scrapeLogs.add({
    business_id: b1Id!,
    source: 'trustpilot',
    status: 'success',
    reviews_found: 8,
    error_message: null,
    started_at: b1LogDate.toISOString(),
    completed_at: new Date(b1LogDate.getTime() + 5000).toISOString(),
  });

  const b2LogDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago (matches newest Mountain View review)
  await db.scrapeLogs.add({
    business_id: b2Id!,
    source: 'bbb',
    status: 'success',
    reviews_found: 6,
    error_message: null,
    started_at: b2LogDate.toISOString(),
    completed_at: new Date(b2LogDate.getTime() + 5000).toISOString(),
  });

  // Add default sentiment config
  await db.sentimentConfig.add({
    rating_weight: 0.7,
    text_weight: 0.3,
    threshold: 0.1,
    updated_at: new Date().toISOString(),
  });

  // Add default scheduler config
  await db.schedulerConfig.add({
    interval_hours: 6,
    last_run: null,
  });
}
