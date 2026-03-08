import { getWorkspaceMode } from '../portfolio';
import { db } from './schema';

export async function seedDemoData(): Promise<void> {
  const count = await db.businesses.count();
  if (count > 0 || getWorkspaceMode() !== 'sample') return;

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  // ─── Businesses ───────────────────────────────────────────────────────────

  const b1Id = await db.businesses.add({
    name: 'Acme Coffee Co.',
    address: 'Portland, OR',
    trustpilot_url: 'https://www.trustpilot.com/review/acmecoffee.com',
    bbb_url: null,
    yelp_url: 'https://www.yelp.com/biz/acme-coffee-portland',
    google_place_id: null,
    yelp_business_id: 'acme-coffee-portland',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const b2Id = await db.businesses.add({
    name: 'Mountain View Auto',
    address: 'Denver, CO',
    trustpilot_url: null,
    bbb_url: 'https://www.bbb.org/us/co/denver/profile/auto-repair/mountain-view-auto',
    yelp_url: null,
    google_place_id: 'ChIJmountainviewauto',
    yelp_business_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const b3Id = await db.businesses.add({
    name: 'Lakeside Dental Group',
    address: 'Austin, TX',
    trustpilot_url: 'https://www.trustpilot.com/review/lakesidedental.com',
    bbb_url: null,
    yelp_url: null,
    google_place_id: 'ChIJlakesidedental',
    yelp_business_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const b4Id = await db.businesses.add({
    name: 'Harbor Fresh Market',
    address: 'Seattle, WA',
    trustpilot_url: null,
    bbb_url: 'https://www.bbb.org/us/wa/seattle/profile/grocery/harbor-fresh-market',
    yelp_url: 'https://www.yelp.com/biz/harbor-fresh-market-seattle',
    google_place_id: null,
    yelp_business_id: 'harbor-fresh-market-seattle',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // ─── Reviews ──────────────────────────────────────────────────────────────

  // Acme Coffee Co. — 14 reviews (9 trustpilot, 5 yelp)
  // Upward trend: older reviews are more mixed, recent ones are more positive
  const acmeReviews = [
    // Trustpilot — 9 reviews
    { source: 'trustpilot', external_id: 'acme-tp-1', author_name: 'Priya S.', rating: 5, text: 'This place has completely won me over. The oat milk cortado is genuinely one of the best drinks I\'ve had anywhere in Portland. The staff remembered my order on my second visit — that\'s rare.', sentiment_score: 0.91, sentiment_label: 'positive', days_ago: 1 },
    { source: 'trustpilot', external_id: 'acme-tp-2', author_name: 'Owen T.', rating: 5, text: 'Came in on a busy Saturday morning and still got my order in under 5 minutes. Flat white was perfect — properly textured milk, good extraction on the shot. Finally a shop that doesn\'t overcomplicate things.', sentiment_score: 0.84, sentiment_label: 'positive', days_ago: 6 },
    { source: 'trustpilot', external_id: 'acme-tp-3', author_name: 'Marcus B.', rating: 4, text: 'Really solid coffee and a great spot to work for a few hours. WiFi is reliable and they don\'t rush you out. The pour-over takes a while but it\'s worth it. Pastries are good too, though prices have crept up a bit.', sentiment_score: 0.62, sentiment_label: 'positive', days_ago: 12 },
    { source: 'trustpilot', external_id: 'acme-tp-4', author_name: 'Fiona L.', rating: 5, text: 'Just moved to the neighborhood and this is already my daily spot. The baristas are genuinely friendly, not just performatively so. Cold brew is exceptional.', sentiment_score: 0.88, sentiment_label: 'positive', days_ago: 19 },
    { source: 'trustpilot', external_id: 'acme-tp-5', author_name: 'Derek W.', rating: 4, text: 'Good coffee, nice vibe. The seasonal lavender latte was interesting — not my usual thing but I enjoyed it. A little loud on weekend mornings but that\'s kind of expected.', sentiment_score: 0.50, sentiment_label: 'positive', days_ago: 28 },
    { source: 'trustpilot', external_id: 'acme-tp-6', author_name: 'Camille J.', rating: 3, text: 'Mixed feelings. The espresso drinks are good but I ordered a drip coffee once and it tasted like it had been sitting for a while. Maybe I caught them at a bad time. Would try again.', sentiment_score: 0.04, sentiment_label: 'neutral', days_ago: 44 },
    { source: 'trustpilot', external_id: 'acme-tp-7', author_name: 'Ryan H.', rating: 2, text: 'Waited almost 20 minutes during what wasn\'t even a particularly busy time. The latte I got was fine, but the wait killed the experience. They need more staff during the afternoon rush.', sentiment_score: -0.38, sentiment_label: 'negative', days_ago: 62 },
    { source: 'trustpilot', external_id: 'acme-tp-8', author_name: 'Annika P.', rating: 4, text: 'Lovely little shop. I like that they source beans locally — you can really taste the difference. The drip options change seasonally which keeps it interesting. Staff is always helpful.', sentiment_score: 0.67, sentiment_label: 'positive', days_ago: 78 },
    { source: 'trustpilot', external_id: 'acme-tp-9', author_name: 'Jerome C.', rating: 3, text: 'Decent enough. Nothing jumped out at me, coffee was warm and made correctly. Comfortable seating. Prices are on the higher end for what you get but that\'s Portland for you.', sentiment_score: -0.02, sentiment_label: 'neutral', days_ago: 95 },

    // Yelp — 5 reviews
    { source: 'yelp', external_id: 'acme-yelp-1', author_name: 'Tasha R.', rating: 5, text: 'OK I don\'t write reviews often but this place deserves one. The matcha latte is the real deal — earthy, not too sweet, and the foam is perfect. The playlist they had on was great too. Seriously good vibes all around.', sentiment_score: 0.92, sentiment_label: 'positive', days_ago: 4 },
    { source: 'yelp', external_id: 'acme-yelp-2', author_name: 'Neil F.', rating: 4, text: 'Solid neighborhood coffee shop. I\'ve been coming here for a couple months now and the quality is consistent. Friendly faces behind the counter. My only note is the outdoor seating gets a lot of street noise.', sentiment_score: 0.58, sentiment_label: 'positive', days_ago: 23 },
    { source: 'yelp', external_id: 'acme-yelp-3', author_name: 'Gabby M.', rating: 5, text: 'Obsessed with their cold brew. Smooth, not bitter, and they don\'t water it down with ice. The breakfast sandwich was a 9/10. Will be back probably every weekend.', sentiment_score: 0.87, sentiment_label: 'positive', days_ago: 47 },
    { source: 'yelp', external_id: 'acme-yelp-4', author_name: 'Phil D.', rating: 2, text: 'Overpriced for what you get. My espresso tasted burnt and when I mentioned it the barista was pretty dismissive. Maybe a bad day, but $6 for a mediocre shot is a lot to ask.', sentiment_score: -0.52, sentiment_label: 'negative', days_ago: 71 },
    { source: 'yelp', external_id: 'acme-yelp-5', author_name: 'Sera K.', rating: 4, text: 'Good coffee and a pleasant atmosphere. Gets crowded on weekends but the line moves quickly. I appreciate that they have oat milk at no extra charge now — a small thing but it adds up.', sentiment_score: 0.55, sentiment_label: 'positive', days_ago: 101 },
  ];

  // Mountain View Auto — 14 reviews (8 bbb, 6 google_places)
  // Downward trend: older reviews are more positive, recent ones more negative
  const mountainViewReviews = [
    // BBB — 8 reviews
    { source: 'bbb', external_id: 'mv-bbb-1', author_name: 'Todd S.', rating: 1, text: 'Got quoted $340 for a brake job. Final bill was $890. They added labor charges and parts that were never discussed. I\'ve disputed it and heard nothing back. Would not recommend to anyone.', sentiment_score: -0.93, sentiment_label: 'negative', days_ago: 2 },
    { source: 'bbb', external_id: 'mv-bbb-2', author_name: 'Denise V.', rating: 2, text: 'They had my car for four days for a job they said would take one. Communication was poor — I had to call them every day for an update. The repair seems fine but the whole experience was stressful.', sentiment_score: -0.48, sentiment_label: 'negative', days_ago: 9 },
    { source: 'bbb', external_id: 'mv-bbb-3', author_name: 'Carlos M.', rating: 1, text: 'First time customer and it was a disaster. They diagnosed the wrong problem, charged me for the fix, and the actual issue wasn\'t resolved. Took it to another shop who found the real problem immediately.', sentiment_score: -0.87, sentiment_label: 'negative', days_ago: 17 },
    { source: 'bbb', external_id: 'mv-bbb-4', author_name: 'Paula G.', rating: 3, text: 'It was okay. Oil change was done quickly and the price was fair. Waiting room was a bit grungy. Nothing went wrong but nothing impressed me either.', sentiment_score: 0.07, sentiment_label: 'neutral', days_ago: 33 },
    { source: 'bbb', external_id: 'mv-bbb-5', author_name: 'Frank N.', rating: 4, text: 'Brought my truck in for a transmission service. They were upfront about what needed to be done and stuck to the quoted price. Good work, no surprises. This was about six weeks ago — seems to still be holding up fine.', sentiment_score: 0.59, sentiment_label: 'positive', days_ago: 48 },
    { source: 'bbb', external_id: 'mv-bbb-6', author_name: 'Angela R.', rating: 5, text: 'Been coming here for years. The team has always been honest with me about what actually needs to be done versus what can wait. That kind of integrity is hard to find at a mechanic. Highly recommend.', sentiment_score: 0.89, sentiment_label: 'positive', days_ago: 67 },
    { source: 'bbb', external_id: 'mv-bbb-7', author_name: 'Steve B.', rating: 4, text: 'Good shop. Fixed my AC last summer without any drama. Gave me a clear rundown of the issue and the parts involved. Took a bit longer than estimated but they knocked $50 off the bill for the inconvenience.', sentiment_score: 0.52, sentiment_label: 'positive', days_ago: 83 },
    { source: 'bbb', external_id: 'mv-bbb-8', author_name: 'Judy W.', rating: 5, text: 'Best mechanic I\'ve found in Denver. Fair prices, they don\'t upsell you on things you don\'t need, and the work holds up. My whole family brings their cars here.', sentiment_score: 0.91, sentiment_label: 'positive', days_ago: 105 },

    // Google Places — 6 reviews
    { source: 'google_places', external_id: 'mv-gp-1', author_name: 'Ray H.', rating: 2, text: 'Took my car in for a simple inspection. They came back with a list of $1,800 in "necessary" repairs. Got a second opinion — needed about $200 worth of work. Felt like a shakedown.', sentiment_score: -0.71, sentiment_label: 'negative', days_ago: 5 },
    { source: 'google_places', external_id: 'mv-gp-2', author_name: 'Kim L.', rating: 2, text: 'Not what it used to be. I think they changed ownership or management recently? Used to be my go-to spot but the last two visits have been frustrating — slow, uncommunicative, and the prices jumped a lot.', sentiment_score: -0.44, sentiment_label: 'negative', days_ago: 14 },
    { source: 'google_places', external_id: 'mv-gp-3', author_name: 'Brent O.', rating: 3, text: 'Did what I needed done. Rotated my tires and checked the fluids. Nothing extraordinary but they didn\'t try to rip me off either. Middle of the road experience.', sentiment_score: 0.05, sentiment_label: 'neutral', days_ago: 38 },
    { source: 'google_places', external_id: 'mv-gp-4', author_name: 'Michelle T.', rating: 4, text: 'Had a good experience getting my timing belt replaced here. They were thorough and explained what they found. A little pricier than some competitors but I felt confident in the work.', sentiment_score: 0.61, sentiment_label: 'positive', days_ago: 55 },
    { source: 'google_places', external_id: 'mv-gp-5', author_name: 'Greg A.', rating: 5, text: 'Solid shop. Helped me out same-day when my battery died and I couldn\'t get a tow. They fit me in, got it sorted, didn\'t overcharge. Exactly what you want in a pinch.', sentiment_score: 0.83, sentiment_label: 'positive', days_ago: 79 },
    { source: 'google_places', external_id: 'mv-gp-6', author_name: 'Lorraine D.', rating: 4, text: 'Good mechanics who take the time to explain what\'s going on. I always feel like I understand what I\'m paying for and why. That transparency keeps me coming back.', sentiment_score: 0.70, sentiment_label: 'positive', days_ago: 98 },
  ];

  // Lakeside Dental Group — 12 reviews (7 trustpilot, 5 google_places)
  // Consistently very positive, stable
  const lakesideReviews = [
    // Trustpilot — 7 reviews
    { source: 'trustpilot', external_id: 'ld-tp-1', author_name: 'Maria C.', rating: 5, text: 'I\'ve been terrified of dentists my whole life. Dr. Patel completely changed that for me. She\'s patient, explains everything before she does it, and the hygienist was incredibly gentle. First dental visit in years where I didn\'t leave shaking.', sentiment_score: 0.95, sentiment_label: 'positive', days_ago: 3 },
    { source: 'trustpilot', external_id: 'ld-tp-2', author_name: 'Josh R.', rating: 5, text: 'Came in for a cleaning and ended up needing a crown. Not exactly what I wanted to hear but they walked me through the options and worked with my insurance to find the best path. The crown appointment was fast and painless.', sentiment_score: 0.82, sentiment_label: 'positive', days_ago: 11 },
    { source: 'trustpilot', external_id: 'ld-tp-3', author_name: 'Nadia F.', rating: 4, text: 'Really professional practice. The office is modern and clean, staff is warm and organized. My only quibble is the wait time — I was called back about 15 minutes after my scheduled time. But the care itself was excellent.', sentiment_score: 0.63, sentiment_label: 'positive', days_ago: 22 },
    { source: 'trustpilot', external_id: 'ld-tp-4', author_name: 'Brett M.', rating: 5, text: 'Just moved to Austin and finding a good dentist is always stressful. Lakeside came highly recommended and they lived up to it. They did a full workup on my first visit and the hygienist was thorough without being rough. Already booked my next appointment.', sentiment_score: 0.88, sentiment_label: 'positive', days_ago: 35 },
    { source: 'trustpilot', external_id: 'ld-tp-5', author_name: 'Carla H.', rating: 5, text: 'My kids have been patients here for three years and they actually look forward to going to the dentist. The staff is wonderful with children — patient, playful, and they explain everything in kid-friendly terms.', sentiment_score: 0.93, sentiment_label: 'positive', days_ago: 54 },
    { source: 'trustpilot', external_id: 'ld-tp-6', author_name: 'Ian W.', rating: 4, text: 'Good experience overall. Needed some fillings done and it was handled efficiently. Dr. Torres is skilled and the numbing was actually effective for once. Parking can be tight on weekday mornings though.', sentiment_score: 0.60, sentiment_label: 'positive', days_ago: 72 },
    { source: 'trustpilot', external_id: 'ld-tp-7', author_name: 'Vanessa B.', rating: 5, text: 'Exceptional care from start to finish. The front desk is organized and helpful with insurance questions, the hygienist did the most thorough cleaning I\'ve had, and Dr. Patel has a great eye for spotting small issues before they become big ones. This is what dental care should be.', sentiment_score: 0.94, sentiment_label: 'positive', days_ago: 88 },

    // Google Places — 5 reviews
    { source: 'google_places', external_id: 'ld-gp-1', author_name: 'Sam K.', rating: 5, text: 'Needed an emergency appointment for a cracked tooth and they fit me in the same day. Excellent response, excellent work. I\'ve been going to them ever since.', sentiment_score: 0.90, sentiment_label: 'positive', days_ago: 7 },
    { source: 'google_places', external_id: 'ld-gp-2', author_name: 'Danielle P.', rating: 4, text: 'Great dentist office. Professional, clean, and the staff genuinely seems to enjoy working there which makes the whole experience better. I had one small billing issue that took a couple calls to sort out but they were apologetic and got it fixed.', sentiment_score: 0.58, sentiment_label: 'positive', days_ago: 27 },
    { source: 'google_places', external_id: 'ld-gp-3', author_name: 'Thomas L.', rating: 5, text: 'Best dental practice I\'ve been to in over a decade. Competent, kind, and not pushy about treatments you don\'t need. Refreshing to find that in a dental office.', sentiment_score: 0.86, sentiment_label: 'positive', days_ago: 46 },
    { source: 'google_places', external_id: 'ld-gp-4', author_name: 'Rachel A.', rating: 5, text: 'Had a deep cleaning done here after putting it off for way too long. The hygienist was incredible — honest about what she found, gentle, and gave great aftercare advice. Highly recommended.', sentiment_score: 0.89, sentiment_label: 'positive', days_ago: 69 },
    { source: 'google_places', external_id: 'ld-gp-5', author_name: 'Kevin M.', rating: 4, text: 'Solid dental practice. Modern equipment, knowledgeable staff. Appointments run on schedule which I appreciate. Been a patient for two years and no complaints.', sentiment_score: 0.65, sentiment_label: 'positive', days_ago: 102 },
  ];

  // Harbor Fresh Market — 11 reviews (8 yelp, 3 bbb)
  // Mostly positive with a couple negatives
  const harborReviews = [
    // Yelp — 8 reviews
    { source: 'yelp', external_id: 'hf-yelp-1', author_name: 'Cora N.', rating: 5, text: 'The fish counter here is the real deal. I asked the guy behind the counter what was freshest today and he took five minutes to actually explain where everything came from and how to prepare it. You don\'t get that at a chain. Salmon was amazing.', sentiment_score: 0.92, sentiment_label: 'positive', days_ago: 2 },
    { source: 'yelp', external_id: 'hf-yelp-2', author_name: 'Doug T.', rating: 4, text: 'Good local market. Produce section is always well-stocked and the staff is friendly. Prices are a bit higher than the big chains but the quality justifies it most of the time. Their prepared foods section is underrated.', sentiment_score: 0.61, sentiment_label: 'positive', days_ago: 8 },
    { source: 'yelp', external_id: 'hf-yelp-3', author_name: 'Lena M.', rating: 2, text: 'Bought a bag of clams that had a funky smell when I opened them at home. Called the store and the person I spoke with was polite but basically said nothing they could do without the receipt. For $22 worth of bad shellfish, a little more flexibility would go a long way.', sentiment_score: -0.55, sentiment_label: 'negative', days_ago: 15 },
    { source: 'yelp', external_id: 'hf-yelp-4', author_name: 'Art S.', rating: 5, text: 'I make a weekly trip here specifically for their bread and cheese selection. The staff in the specialty section know their products and will let you try before you buy. Can\'t find that level of service anywhere else in the area.', sentiment_score: 0.88, sentiment_label: 'positive', days_ago: 24 },
    { source: 'yelp', external_id: 'hf-yelp-5', author_name: 'Yuki P.', rating: 4, text: 'Love this store. It\'s a bit of a drive for me but worth it. Good selection of local and Pacific NW products. The mushroom vendor they bring in on Saturdays is incredible. Only reason it\'s not 5 stars is the checkout lines can be long.', sentiment_score: 0.68, sentiment_label: 'positive', days_ago: 38 },
    { source: 'yelp', external_id: 'hf-yelp-6', author_name: 'Rob C.', rating: 3, text: 'It\'s fine. Good produce and the butcher is decent. I go when I have time for a more intentional shopping trip. For everyday groceries it\'s hard to justify the prices but for something special it works well.', sentiment_score: 0.09, sentiment_label: 'neutral', days_ago: 55 },
    { source: 'yelp', external_id: 'hf-yelp-7', author_name: 'Nina H.', rating: 5, text: 'Hands down the best grocery store in Seattle. The commitment to local sourcing is real, not just a marketing thing. I\'ve talked to several of the vendors they carry and they all speak highly of the partnership. Great store.', sentiment_score: 0.91, sentiment_label: 'positive', days_ago: 76 },
    { source: 'yelp', external_id: 'hf-yelp-8', author_name: 'Patrick O.', rating: 1, text: 'Parking lot is a nightmare and the staff near the entrance was rude when I asked where something was. The store itself is nice enough but I left frustrated. Won\'t be rushing back.', sentiment_score: -0.62, sentiment_label: 'negative', days_ago: 99 },

    // BBB — 3 reviews
    { source: 'bbb', external_id: 'hf-bbb-1', author_name: 'Elaine T.', rating: 5, text: 'Wonderful market. Everything is clearly labeled with sourcing information and the staff are genuinely knowledgeable. The seafood is always fresh and the prices are reasonable for the quality. Shopping here feels like supporting something good.', sentiment_score: 0.90, sentiment_label: 'positive', days_ago: 18 },
    { source: 'bbb', external_id: 'hf-bbb-2', author_name: 'Walter K.', rating: 4, text: 'Good market, good people. I bought a bad bottle of olive oil — wrong flavor, my mistake reading the label — and they exchanged it no questions asked. Little things like that matter a lot.', sentiment_score: 0.64, sentiment_label: 'positive', days_ago: 52 },
    { source: 'bbb', external_id: 'hf-bbb-3', author_name: 'Sandra L.', rating: 5, text: 'Everything about this store feels intentional — the layout, the product selection, the staff. You can tell the owners care about what they\'re selling. Best market in the neighborhood by a wide margin.', sentiment_score: 0.87, sentiment_label: 'positive', days_ago: 88 },
  ];

  // Insert all reviews
  const allReviews = [
    ...acmeReviews.map(r => ({ ...r, business_id: b1Id! })),
    ...mountainViewReviews.map(r => ({ ...r, business_id: b2Id! })),
    ...lakesideReviews.map(r => ({ ...r, business_id: b3Id! })),
    ...harborReviews.map(r => ({ ...r, business_id: b4Id! })),
  ];

  for (const r of allReviews) {
    const reviewDate = daysAgo(r.days_ago);
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

  // ─── Scrape Logs ──────────────────────────────────────────────────────────

  const scrapeLog = async (
    business_id: number,
    source: string,
    status: 'success' | 'failed',
    reviews_found: number,
    days_ago_started: number,
    error_message: string | null = null,
  ) => {
    const started = daysAgo(days_ago_started);
    await db.scrapeLogs.add({
      business_id,
      source,
      status,
      reviews_found,
      error_message,
      started_at: started.toISOString(),
      completed_at: new Date(started.getTime() + 6000).toISOString(),
    });
  };

  // Acme Coffee Co. — trustpilot + yelp scrape history
  await scrapeLog(b1Id!, 'trustpilot', 'success', 3, 1);
  await scrapeLog(b1Id!, 'yelp', 'success', 1, 1);
  await scrapeLog(b1Id!, 'trustpilot', 'success', 2, 15);
  await scrapeLog(b1Id!, 'yelp', 'success', 2, 15);
  await scrapeLog(b1Id!, 'trustpilot', 'success', 30, 29);

  // Mountain View Auto — bbb + google_places scrape history
  await scrapeLog(b2Id!, 'bbb', 'success', 3, 2);
  await scrapeLog(b2Id!, 'google_places', 'success', 2, 2);
  await scrapeLog(b2Id!, 'bbb', 'success', 2, 16);
  await scrapeLog(b2Id!, 'google_places', 'success', 1, 16);
  await scrapeLog(b2Id!, 'bbb', 'success', 4, 30);

  // Lakeside Dental Group — trustpilot + google_places scrape history
  await scrapeLog(b3Id!, 'trustpilot', 'success', 2, 3);
  await scrapeLog(b3Id!, 'google_places', 'success', 2, 3);
  await scrapeLog(b3Id!, 'trustpilot', 'success', 1, 18);
  await scrapeLog(b3Id!, 'google_places', 'success', 1, 18);
  await scrapeLog(b3Id!, 'trustpilot', 'success', 3, 32);

  // Harbor Fresh Market — yelp (success) + bbb (2 recent failures = warning badge)
  await scrapeLog(b4Id!, 'yelp', 'success', 2, 2);
  await scrapeLog(b4Id!, 'bbb', 'failed', 0, 2, 'Connection timed out after 30s — host unreachable');
  await scrapeLog(b4Id!, 'yelp', 'success', 1, 13);
  await scrapeLog(b4Id!, 'bbb', 'failed', 0, 4, 'Page not found: BBB listing returned 404');
  await scrapeLog(b4Id!, 'yelp', 'success', 3, 27);

  // ─── Alert Configs ────────────────────────────────────────────────────────

  await db.alertConfigs.add({
    business_id: b2Id!,
    email: 'owner@mountainviewauto.com',
    alert_on_negative: true,
    negative_threshold: -0.3,
    enabled: true,
  });

  await db.alertConfigs.add({
    business_id: b1Id!,
    email: 'info@acmecoffee.com',
    alert_on_negative: true,
    negative_threshold: -0.5,
    enabled: false,
  });

  // ─── Sentiment Config ─────────────────────────────────────────────────────

  await db.sentimentConfig.add({
    rating_weight: 0.7,
    text_weight: 0.3,
    threshold: 0.1,
    updated_at: new Date().toISOString(),
  });

  // ─── Scheduler Config ─────────────────────────────────────────────────────

  await db.schedulerConfig.add({
    interval_hours: 6,
    last_run: null,
  });
}
