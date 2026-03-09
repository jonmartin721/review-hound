import { getWorkspaceMode, IS_PORTFOLIO_MODE } from '../portfolio';
import type { ApiSearchResult, SearchResult } from '../storage/types';

type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface SeedBusinessRecord {
  key: string;
  name: string;
  address: string | null;
  trustpilot_url: string | null;
  bbb_url: string | null;
  yelp_url: string | null;
  google_place_id: string | null;
  yelp_business_id: string | null;
}

export interface SeedReviewRecord {
  businessKey: string;
  source: string;
  external_id: string;
  author_name: string | null;
  rating: number | null;
  text: string | null;
  sentiment_score: number | null;
  sentiment_label: SentimentLabel | null;
  days_ago: number;
}

export interface SeedScrapeLogRecord {
  businessKey: string;
  source: string;
  status: 'success' | 'failed';
  reviews_found: number;
  days_ago_started: number;
  error_message?: string | null;
}

export interface SeedAlertConfigRecord {
  businessKey: string;
  email: string;
  alert_on_negative: boolean;
  negative_threshold: number;
  enabled: boolean;
}

export interface SeedApiConfigRecord {
  provider: string;
  api_key: string;
  enabled: boolean;
}

export interface SampleScrapeReview {
  external_id: string;
  author_name?: string | null;
  rating?: number | null;
  text?: string | null;
  review_date?: string | null;
  review_url?: string | null;
}

interface ApiSearchCatalogEntry {
  name: string;
  address: string;
  google_place_id?: string;
  yelp_business_id?: string;
  google_rating?: number;
  google_review_count?: number;
  yelp_rating?: number;
  yelp_review_count?: number;
}

const now = new Date();

function dateDaysAgo(daysAgo: number): string {
  return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenize(value: string | null | undefined): string[] {
  return normalize(value).split(/\s+/).filter((token) => token.length >= 3);
}

function scoreMatch(query: string, location: string | null | undefined, entry: ApiSearchCatalogEntry): number {
  const haystack = `${normalize(entry.name)} ${normalize(entry.address)}`;
  let score = 0;

  for (const token of tokenize(query)) {
    if (haystack.includes(token)) score += 3;
  }

  for (const token of tokenize(location)) {
    if (haystack.includes(token)) score += 2;
  }

  if (normalize(entry.name) === normalize(query)) score += 10;
  if (location && normalize(entry.address).includes(normalize(location))) score += 4;

  return score;
}

function buildFallbackApiResults(
  provider: 'google_places' | 'yelp_fusion',
  query: string,
  location?: string | null
): ApiSearchResult[] {
  const slug = slugify(query || 'sample-business');
  const placeLabel = query.trim() || 'Sample Business';
  const locationLabel = location?.trim() || 'Sample City, USA';

  return Array.from({ length: 3 }, (_, index) => ({
    name: index === 0 ? placeLabel : `${placeLabel} ${['Downtown', 'North', 'Market'][index]}`,
    address: locationLabel,
    rating: provider === 'google_places' ? 4.2 - index * 0.2 : 4.4 - index * 0.2,
    review_count: 28 + index * 11,
    place_id: provider === 'google_places' ? `sample-${slug}-${index + 1}` : undefined,
    business_id: provider === 'yelp_fusion' ? `sample-${slug}-${index + 1}` : undefined,
  }));
}

export function isSampleModeWorkspace(): boolean {
  return IS_PORTFOLIO_MODE && getWorkspaceMode() === 'sample';
}

export const SAMPLE_BUSINESSES: SeedBusinessRecord[] = [
  {
    key: 'acme',
    name: 'Acme Coffee Co.',
    address: 'Portland, OR',
    trustpilot_url: 'https://www.trustpilot.com/review/acmecoffee.com',
    bbb_url: null,
    yelp_url: 'https://www.yelp.com/biz/acme-coffee-portland',
    google_place_id: null,
    yelp_business_id: 'acme-coffee-portland',
  },
  {
    key: 'mountain-view',
    name: 'Mountain View Auto',
    address: 'Denver, CO',
    trustpilot_url: null,
    bbb_url: 'https://www.bbb.org/us/co/denver/profile/auto-repair/mountain-view-auto',
    yelp_url: null,
    google_place_id: 'ChIJmountainviewauto',
    yelp_business_id: null,
  },
  {
    key: 'lakeside',
    name: 'Lakeside Dental Group',
    address: 'Austin, TX',
    trustpilot_url: 'https://www.trustpilot.com/review/lakesidedental.com',
    bbb_url: null,
    yelp_url: null,
    google_place_id: 'ChIJlakesidedental',
    yelp_business_id: null,
  },
  {
    key: 'harbor',
    name: 'Harbor Fresh Market',
    address: 'Seattle, WA',
    trustpilot_url: null,
    bbb_url: 'https://www.bbb.org/us/wa/seattle/profile/grocery/harbor-fresh-market',
    yelp_url: 'https://www.yelp.com/biz/harbor-fresh-market-seattle',
    google_place_id: null,
    yelp_business_id: 'harbor-fresh-market-seattle',
  },
  {
    key: 'riverstone',
    name: 'Riverstone Home Services',
    address: 'Phoenix, AZ',
    trustpilot_url: 'https://www.trustpilot.com/review/riverstonehome.com',
    bbb_url: 'https://www.bbb.org/us/az/phoenix/profile/home-services/riverstone-home-services',
    yelp_url: 'https://www.yelp.com/biz/riverstone-home-services-phoenix',
    google_place_id: 'ChIJriverstonehome',
    yelp_business_id: 'riverstone-home-services-phoenix',
  },
  {
    key: 'bluebird',
    name: 'Bluebird Yoga Studio',
    address: 'Madison, WI',
    trustpilot_url: null,
    bbb_url: null,
    yelp_url: null,
    google_place_id: 'ChIJbluebirdyoga',
    yelp_business_id: 'bluebird-yoga-madison',
  },
  {
    key: 'summit',
    name: 'Summit Pet Clinic',
    address: 'Minneapolis, MN',
    trustpilot_url: 'https://www.trustpilot.com/review/summitpetclinic.com',
    bbb_url: null,
    yelp_url: 'https://www.yelp.com/biz/summit-pet-clinic-minneapolis',
    google_place_id: 'ChIJsummitpetclinic',
    yelp_business_id: 'summit-pet-clinic-minneapolis',
  },
];

export const SAMPLE_REVIEWS: SeedReviewRecord[] = [
  { businessKey: 'acme', source: 'trustpilot', external_id: 'acme-tp-1', author_name: 'Priya S.', rating: 5, text: 'Best cortado in Portland and the team remembers regulars.', sentiment_score: 0.91, sentiment_label: 'positive', days_ago: 1 },
  { businessKey: 'acme', source: 'trustpilot', external_id: 'acme-tp-2', author_name: 'Owen T.', rating: 5, text: 'Busy Saturday, still fast service and a great flat white.', sentiment_score: 0.84, sentiment_label: 'positive', days_ago: 6 },
  { businessKey: 'acme', source: 'trustpilot', external_id: 'acme-tp-3', author_name: 'Marcus B.', rating: 4, text: 'Great work spot, reliable Wi-Fi, good pastries.', sentiment_score: 0.62, sentiment_label: 'positive', days_ago: 12 },
  { businessKey: 'acme', source: 'trustpilot', external_id: 'acme-tp-4', author_name: 'Camille J.', rating: 3, text: 'Espresso is solid, but drip coffee was stale once.', sentiment_score: 0.04, sentiment_label: 'neutral', days_ago: 44 },
  { businessKey: 'acme', source: 'trustpilot', external_id: 'acme-tp-5', author_name: 'Ryan H.', rating: 2, text: 'Wait was long and the latte was only okay.', sentiment_score: -0.38, sentiment_label: 'negative', days_ago: 62 },
  { businessKey: 'acme', source: 'trustpilot', external_id: 'acme-tp-6', author_name: 'Annika P.', rating: 4, text: 'Local beans, kind staff, and rotating drip options.', sentiment_score: 0.67, sentiment_label: 'positive', days_ago: 78 },
  { businessKey: 'acme', source: 'yelp', external_id: 'acme-yelp-1', author_name: 'Tasha R.', rating: 5, text: 'Matcha latte was balanced and not syrupy.', sentiment_score: 0.92, sentiment_label: 'positive', days_ago: 4 },
  { businessKey: 'acme', source: 'yelp', external_id: 'acme-yelp-2', author_name: 'Neil F.', rating: 4, text: 'Consistent neighborhood shop, just a little noisy outside.', sentiment_score: 0.58, sentiment_label: 'positive', days_ago: 23 },
  { businessKey: 'acme', source: 'yelp', external_id: 'acme-yelp-3', author_name: 'Gabby M.', rating: 5, text: 'Cold brew stays smooth even with ice.', sentiment_score: 0.87, sentiment_label: 'positive', days_ago: 47 },
  { businessKey: 'acme', source: 'yelp', external_id: 'acme-yelp-4', author_name: 'Phil D.', rating: 2, text: 'Burnt espresso and a dismissive response at the counter.', sentiment_score: -0.52, sentiment_label: 'negative', days_ago: 71 },
  { businessKey: 'acme', source: 'yelp', external_id: 'acme-yelp-5', author_name: 'Sera K.', rating: 4, text: 'Crowded on weekends, but the line moves.', sentiment_score: 0.55, sentiment_label: 'positive', days_ago: 101 },
  { businessKey: 'acme', source: 'yelp', external_id: 'acme-yelp-6', author_name: 'Jonah E.', rating: 5, text: 'Breakfast sandwich and espresso combo never misses.', sentiment_score: 0.86, sentiment_label: 'positive', days_ago: 16 },

  { businessKey: 'mountain-view', source: 'bbb', external_id: 'mv-bbb-1', author_name: 'Todd S.', rating: 1, text: 'Quoted low, billed high, and no follow-up on the dispute.', sentiment_score: -0.93, sentiment_label: 'negative', days_ago: 2 },
  { businessKey: 'mountain-view', source: 'bbb', external_id: 'mv-bbb-2', author_name: 'Denise V.', rating: 2, text: 'Repair took four days with poor communication.', sentiment_score: -0.48, sentiment_label: 'negative', days_ago: 9 },
  { businessKey: 'mountain-view', source: 'bbb', external_id: 'mv-bbb-3', author_name: 'Carlos M.', rating: 1, text: 'Misdiagnosed the issue and charged for the wrong fix.', sentiment_score: -0.87, sentiment_label: 'negative', days_ago: 17 },
  { businessKey: 'mountain-view', source: 'bbb', external_id: 'mv-bbb-4', author_name: 'Paula G.', rating: 3, text: 'Quick oil change, forgettable waiting room.', sentiment_score: 0.07, sentiment_label: 'neutral', days_ago: 33 },
  { businessKey: 'mountain-view', source: 'bbb', external_id: 'mv-bbb-5', author_name: 'Frank N.', rating: 4, text: 'Transmission service was clear and on quote.', sentiment_score: 0.59, sentiment_label: 'positive', days_ago: 48 },
  { businessKey: 'mountain-view', source: 'bbb', external_id: 'mv-bbb-6', author_name: 'Angela R.', rating: 5, text: 'Used to be my most trusted mechanic in town.', sentiment_score: 0.89, sentiment_label: 'positive', days_ago: 67 },
  { businessKey: 'mountain-view', source: 'google_places', external_id: 'mv-gp-1', author_name: 'Ray H.', rating: 2, text: 'Second opinion saved me from a padded repair list.', sentiment_score: -0.71, sentiment_label: 'negative', days_ago: 5 },
  { businessKey: 'mountain-view', source: 'google_places', external_id: 'mv-gp-2', author_name: 'Kim L.', rating: 2, text: 'Feels slower and more expensive than it used to.', sentiment_score: -0.44, sentiment_label: 'negative', days_ago: 14 },
  { businessKey: 'mountain-view', source: 'google_places', external_id: 'mv-gp-3', author_name: 'Brent O.', rating: 3, text: 'Tire rotation was fine, nothing special.', sentiment_score: 0.05, sentiment_label: 'neutral', days_ago: 38 },
  { businessKey: 'mountain-view', source: 'google_places', external_id: 'mv-gp-4', author_name: 'Michelle T.', rating: 4, text: 'Timing belt replacement was thorough.', sentiment_score: 0.61, sentiment_label: 'positive', days_ago: 55 },
  { businessKey: 'mountain-view', source: 'google_places', external_id: 'mv-gp-5', author_name: 'Greg A.', rating: 5, text: 'Same-day battery help kept me moving.', sentiment_score: 0.83, sentiment_label: 'positive', days_ago: 79 },
  { businessKey: 'mountain-view', source: 'google_places', external_id: 'mv-gp-6', author_name: 'Lorraine D.', rating: 4, text: 'Explains repairs well when the shop is on its game.', sentiment_score: 0.7, sentiment_label: 'positive', days_ago: 98 },

  { businessKey: 'lakeside', source: 'trustpilot', external_id: 'ld-tp-1', author_name: 'Maria C.', rating: 5, text: 'First dental visit in years without panic.', sentiment_score: 0.95, sentiment_label: 'positive', days_ago: 3 },
  { businessKey: 'lakeside', source: 'trustpilot', external_id: 'ld-tp-2', author_name: 'Josh R.', rating: 5, text: 'Crown appointment was fast and painless.', sentiment_score: 0.82, sentiment_label: 'positive', days_ago: 11 },
  { businessKey: 'lakeside', source: 'trustpilot', external_id: 'ld-tp-3', author_name: 'Nadia F.', rating: 4, text: 'Excellent care, just a short wait past the appointment time.', sentiment_score: 0.63, sentiment_label: 'positive', days_ago: 22 },
  { businessKey: 'lakeside', source: 'trustpilot', external_id: 'ld-tp-4', author_name: 'Carla H.', rating: 5, text: 'Wonderful with children and great at explaining each step.', sentiment_score: 0.93, sentiment_label: 'positive', days_ago: 54 },
  { businessKey: 'lakeside', source: 'trustpilot', external_id: 'ld-tp-5', author_name: 'Vanessa B.', rating: 5, text: 'Front desk, hygienist, and dentist are all excellent.', sentiment_score: 0.94, sentiment_label: 'positive', days_ago: 88 },
  { businessKey: 'lakeside', source: 'google_places', external_id: 'ld-gp-1', author_name: 'Sam K.', rating: 5, text: 'Emergency cracked tooth appointment the same day.', sentiment_score: 0.9, sentiment_label: 'positive', days_ago: 7 },
  { businessKey: 'lakeside', source: 'google_places', external_id: 'ld-gp-2', author_name: 'Danielle P.', rating: 4, text: 'Professional and warm staff. Billing issue was fixed quickly.', sentiment_score: 0.58, sentiment_label: 'positive', days_ago: 27 },
  { businessKey: 'lakeside', source: 'google_places', external_id: 'ld-gp-3', author_name: 'Thomas L.', rating: 5, text: 'Kind, competent, and not pushy.', sentiment_score: 0.86, sentiment_label: 'positive', days_ago: 46 },
  { businessKey: 'lakeside', source: 'google_places', external_id: 'ld-gp-4', author_name: 'Rachel A.', rating: 5, text: 'Deep cleaning was honest, gentle, and thorough.', sentiment_score: 0.89, sentiment_label: 'positive', days_ago: 69 },
  { businessKey: 'lakeside', source: 'google_places', external_id: 'ld-gp-5', author_name: 'Kevin M.', rating: 4, text: 'Appointments run on time and the equipment feels modern.', sentiment_score: 0.65, sentiment_label: 'positive', days_ago: 102 },

  { businessKey: 'harbor', source: 'yelp', external_id: 'hf-yelp-1', author_name: 'Cora N.', rating: 5, text: 'Fish counter staff really know the product.', sentiment_score: 0.92, sentiment_label: 'positive', days_ago: 2 },
  { businessKey: 'harbor', source: 'yelp', external_id: 'hf-yelp-2', author_name: 'Doug T.', rating: 4, text: 'Quality produce and strong prepared foods.', sentiment_score: 0.61, sentiment_label: 'positive', days_ago: 8 },
  { businessKey: 'harbor', source: 'yelp', external_id: 'hf-yelp-3', author_name: 'Lena M.', rating: 2, text: 'Bad shellfish and not much flexibility on the refund.', sentiment_score: -0.55, sentiment_label: 'negative', days_ago: 15 },
  { businessKey: 'harbor', source: 'yelp', external_id: 'hf-yelp-4', author_name: 'Art S.', rating: 5, text: 'Bread and cheese section is worth the weekly trip.', sentiment_score: 0.88, sentiment_label: 'positive', days_ago: 24 },
  { businessKey: 'harbor', source: 'yelp', external_id: 'hf-yelp-5', author_name: 'Yuki P.', rating: 4, text: 'Great local products, long checkout lines.', sentiment_score: 0.68, sentiment_label: 'positive', days_ago: 38 },
  { businessKey: 'harbor', source: 'yelp', external_id: 'hf-yelp-6', author_name: 'Patrick O.', rating: 1, text: 'Rough parking and a curt interaction near the door.', sentiment_score: -0.62, sentiment_label: 'negative', days_ago: 99 },
  { businessKey: 'harbor', source: 'bbb', external_id: 'hf-bbb-1', author_name: 'Elaine T.', rating: 5, text: 'Excellent sourcing labels and consistently fresh seafood.', sentiment_score: 0.9, sentiment_label: 'positive', days_ago: 18 },
  { businessKey: 'harbor', source: 'bbb', external_id: 'hf-bbb-2', author_name: 'Walter K.', rating: 4, text: 'Returned a mislabeled bottle with no hassle.', sentiment_score: 0.64, sentiment_label: 'positive', days_ago: 52 },
  { businessKey: 'harbor', source: 'bbb', external_id: 'hf-bbb-3', author_name: 'Sandra L.', rating: 5, text: 'Thoughtful layout, thoughtful staff, thoughtful buying.', sentiment_score: 0.87, sentiment_label: 'positive', days_ago: 88 },
  { businessKey: 'harbor', source: 'bbb', external_id: 'hf-bbb-4', author_name: 'Miles D.', rating: 4, text: 'Pricey, but the produce and butcher counter are dependable.', sentiment_score: 0.57, sentiment_label: 'positive', days_ago: 61 },

  { businessKey: 'riverstone', source: 'trustpilot', external_id: 'rs-tp-1', author_name: 'Alicia P.', rating: 2, text: 'Appointment window kept shifting and nobody called first.', sentiment_score: -0.58, sentiment_label: 'negative', days_ago: 4 },
  { businessKey: 'riverstone', source: 'trustpilot', external_id: 'rs-tp-2', author_name: 'Henry L.', rating: 3, text: 'Technician was polite, but the follow-up quote was vague.', sentiment_score: 0.01, sentiment_label: 'neutral', days_ago: 13 },
  { businessKey: 'riverstone', source: 'trustpilot', external_id: 'rs-tp-3', author_name: 'Dawn M.', rating: 4, text: 'Hot water heater install went smoothly.', sentiment_score: 0.66, sentiment_label: 'positive', days_ago: 27 },
  { businessKey: 'riverstone', source: 'trustpilot', external_id: 'rs-tp-4', author_name: 'Kevin J.', rating: 5, text: 'Clear pricing and a technician who cleaned up after the job.', sentiment_score: 0.88, sentiment_label: 'positive', days_ago: 45 },
  { businessKey: 'riverstone', source: 'bbb', external_id: 'rs-bbb-1', author_name: 'Monica H.', rating: 1, text: 'Missed the service window and charged a cancellation fee.', sentiment_score: -0.91, sentiment_label: 'negative', days_ago: 6 },
  { businessKey: 'riverstone', source: 'bbb', external_id: 'rs-bbb-2', author_name: 'Peter F.', rating: 2, text: 'Office was hard to reach once the job slipped.', sentiment_score: -0.49, sentiment_label: 'negative', days_ago: 14 },
  { businessKey: 'riverstone', source: 'bbb', external_id: 'rs-bbb-3', author_name: 'Latoya B.', rating: 4, text: 'Leak repair held up well and the invoice matched the quote.', sentiment_score: 0.63, sentiment_label: 'positive', days_ago: 31 },
  { businessKey: 'riverstone', source: 'bbb', external_id: 'rs-bbb-4', author_name: 'Evan S.', rating: 5, text: 'Great electrician and fast scheduling after the first hiccup.', sentiment_score: 0.83, sentiment_label: 'positive', days_ago: 58 },
  { businessKey: 'riverstone', source: 'google_places', external_id: 'rs-gp-1', author_name: 'Mira C.', rating: 4, text: 'Plumber explained the issue clearly and fixed it in one visit.', sentiment_score: 0.72, sentiment_label: 'positive', days_ago: 12 },
  { businessKey: 'riverstone', source: 'google_places', external_id: 'rs-gp-2', author_name: 'Theo W.', rating: 5, text: 'Needed emergency HVAC help and got it the same day.', sentiment_score: 0.89, sentiment_label: 'positive', days_ago: 23 },
  { businessKey: 'riverstone', source: 'yelp_api', external_id: 'rs-yapi-1', author_name: 'Nora G.', rating: 4, text: 'Good communication from the dispatch team this time.', sentiment_score: 0.6, sentiment_label: 'positive', days_ago: 17 },
  { businessKey: 'riverstone', source: 'yelp_api', external_id: 'rs-yapi-2', author_name: 'Calvin O.', rating: null, text: 'Work order notes were detailed and easy to understand.', sentiment_score: 0.41, sentiment_label: 'positive', days_ago: 40 },

  { businessKey: 'summit', source: 'trustpilot', external_id: 'spc-tp-1', author_name: 'Lauren P.', rating: 5, text: 'Our anxious rescue dog did surprisingly well here.', sentiment_score: 0.92, sentiment_label: 'positive', days_ago: 3 },
  { businessKey: 'summit', source: 'trustpilot', external_id: 'spc-tp-2', author_name: 'DeShawn K.', rating: 4, text: 'Helpful vets, but the front desk felt a little rushed.', sentiment_score: 0.46, sentiment_label: 'positive', days_ago: 10 },
  { businessKey: 'summit', source: 'trustpilot', external_id: 'spc-tp-3', author_name: 'Mei L.', rating: 5, text: 'Follow-up instructions after surgery were excellent.', sentiment_score: 0.9, sentiment_label: 'positive', days_ago: 25 },
  { businessKey: 'summit', source: 'trustpilot', external_id: 'spc-tp-4', author_name: 'Avery N.', rating: 3, text: 'Care was fine, but the estimate changed twice.', sentiment_score: -0.03, sentiment_label: 'neutral', days_ago: 61 },
  { businessKey: 'summit', source: 'google_places', external_id: 'spc-gp-1', author_name: 'Rina S.', rating: 5, text: 'Same-day urgent care visit for our cat was handled beautifully.', sentiment_score: 0.94, sentiment_label: 'positive', days_ago: 5 },
  { businessKey: 'summit', source: 'google_places', external_id: 'spc-gp-2', author_name: 'Joel M.', rating: 4, text: 'Clear explanations and kind techs.', sentiment_score: 0.69, sentiment_label: 'positive', days_ago: 19 },
  { businessKey: 'summit', source: 'google_places', external_id: 'spc-gp-3', author_name: 'Penny R.', rating: 2, text: 'Prescription refill took too many calls.', sentiment_score: -0.42, sentiment_label: 'negative', days_ago: 42 },
  { businessKey: 'summit', source: 'yelp_api', external_id: 'spc-yapi-1', author_name: 'Grace D.', rating: 5, text: 'Kind team and zero upsell pressure.', sentiment_score: 0.88, sentiment_label: 'positive', days_ago: 8 },
  { businessKey: 'summit', source: 'yelp_api', external_id: 'spc-yapi-2', author_name: 'Tom B.', rating: 4, text: null, sentiment_score: 0.35, sentiment_label: 'positive', days_ago: 28 },
  { businessKey: 'summit', source: 'yelp_api', external_id: 'spc-yapi-3', author_name: 'Ella W.', rating: 2, text: 'Waited too long for discharge paperwork after surgery.', sentiment_score: -0.51, sentiment_label: 'negative', days_ago: 57 },
];

export const SAMPLE_SCRAPE_LOGS: SeedScrapeLogRecord[] = [
  { businessKey: 'acme', source: 'trustpilot', status: 'success', reviews_found: 3, days_ago_started: 1 },
  { businessKey: 'acme', source: 'yelp', status: 'success', reviews_found: 2, days_ago_started: 1 },
  { businessKey: 'acme', source: 'yelp_api', status: 'success', reviews_found: 1, days_ago_started: 9 },
  { businessKey: 'acme', source: 'trustpilot', status: 'success', reviews_found: 2, days_ago_started: 15 },
  { businessKey: 'acme', source: 'yelp', status: 'success', reviews_found: 4, days_ago_started: 29 },

  { businessKey: 'mountain-view', source: 'bbb', status: 'success', reviews_found: 3, days_ago_started: 2 },
  { businessKey: 'mountain-view', source: 'google_places', status: 'success', reviews_found: 2, days_ago_started: 2 },
  { businessKey: 'mountain-view', source: 'bbb', status: 'success', reviews_found: 2, days_ago_started: 16 },
  { businessKey: 'mountain-view', source: 'google_places', status: 'success', reviews_found: 1, days_ago_started: 16 },
  { businessKey: 'mountain-view', source: 'bbb', status: 'success', reviews_found: 4, days_ago_started: 30 },

  { businessKey: 'lakeside', source: 'trustpilot', status: 'success', reviews_found: 2, days_ago_started: 3 },
  { businessKey: 'lakeside', source: 'google_places', status: 'success', reviews_found: 2, days_ago_started: 3 },
  { businessKey: 'lakeside', source: 'trustpilot', status: 'success', reviews_found: 1, days_ago_started: 18 },
  { businessKey: 'lakeside', source: 'google_places', status: 'success', reviews_found: 1, days_ago_started: 18 },
  { businessKey: 'lakeside', source: 'trustpilot', status: 'success', reviews_found: 3, days_ago_started: 32 },

  { businessKey: 'harbor', source: 'yelp', status: 'success', reviews_found: 2, days_ago_started: 2 },
  { businessKey: 'harbor', source: 'bbb', status: 'failed', reviews_found: 0, days_ago_started: 2, error_message: 'Connection timed out after 30s - host unreachable' },
  { businessKey: 'harbor', source: 'yelp_api', status: 'success', reviews_found: 1, days_ago_started: 7 },
  { businessKey: 'harbor', source: 'bbb', status: 'failed', reviews_found: 0, days_ago_started: 4, error_message: 'Page not found: BBB listing returned 404' },
  { businessKey: 'harbor', source: 'yelp', status: 'success', reviews_found: 3, days_ago_started: 27 },

  { businessKey: 'riverstone', source: 'trustpilot', status: 'success', reviews_found: 1, days_ago_started: 4 },
  { businessKey: 'riverstone', source: 'bbb', status: 'failed', reviews_found: 0, days_ago_started: 4, error_message: 'Upstream complaint feed returned 502' },
  { businessKey: 'riverstone', source: 'google_places', status: 'success', reviews_found: 2, days_ago_started: 8 },
  { businessKey: 'riverstone', source: 'yelp_api', status: 'success', reviews_found: 2, days_ago_started: 10 },
  { businessKey: 'riverstone', source: 'bbb', status: 'success', reviews_found: 2, days_ago_started: 20 },

  { businessKey: 'bluebird', source: 'google_places', status: 'success', reviews_found: 0, days_ago_started: 3 },
  { businessKey: 'bluebird', source: 'yelp_api', status: 'success', reviews_found: 0, days_ago_started: 3 },
  { businessKey: 'bluebird', source: 'google_places', status: 'success', reviews_found: 0, days_ago_started: 19 },
  { businessKey: 'bluebird', source: 'yelp_api', status: 'success', reviews_found: 0, days_ago_started: 19 },

  { businessKey: 'summit', source: 'trustpilot', status: 'success', reviews_found: 2, days_ago_started: 3 },
  { businessKey: 'summit', source: 'google_places', status: 'success', reviews_found: 1, days_ago_started: 6 },
  { businessKey: 'summit', source: 'yelp_api', status: 'failed', reviews_found: 0, days_ago_started: 6, error_message: 'Temporary rate limit while fetching Yelp API reviews' },
  { businessKey: 'summit', source: 'yelp_api', status: 'success', reviews_found: 2, days_ago_started: 21 },
  { businessKey: 'summit', source: 'trustpilot', status: 'success', reviews_found: 3, days_ago_started: 34 },
];

export const SAMPLE_ALERT_CONFIGS: SeedAlertConfigRecord[] = [
  { businessKey: 'mountain-view', email: 'owner@mountainviewauto.com', alert_on_negative: true, negative_threshold: -0.3, enabled: true },
  { businessKey: 'acme', email: 'info@acmecoffee.com', alert_on_negative: true, negative_threshold: -0.5, enabled: false },
  { businessKey: 'riverstone', email: 'ops@riverstonehome.com', alert_on_negative: true, negative_threshold: -0.4, enabled: true },
  { businessKey: 'summit', email: 'team@summitpetclinic.com', alert_on_negative: true, negative_threshold: -0.2, enabled: true },
  { businessKey: 'bluebird', email: 'hello@bluebirdyoga.com', alert_on_negative: true, negative_threshold: -0.4, enabled: false },
];

export const SAMPLE_API_CONFIGS: SeedApiConfigRecord[] = [
  { provider: 'google_places', api_key: 'demo-google-places-key', enabled: true },
  { provider: 'yelp_fusion', api_key: 'demo-yelp-fusion-key', enabled: true },
  { provider: 'resend', api_key: 'demo-resend-key', enabled: true },
  { provider: 'resend_from_email', api_key: 'alerts@sample.reviewhound.local', enabled: true },
];

const SAMPLE_API_SEARCH_CATALOG: ApiSearchCatalogEntry[] = [
  { name: 'Acme Coffee Co.', address: 'Portland, OR', google_place_id: 'ChIJacmecoffeeportland', yelp_business_id: 'acme-coffee-portland', google_rating: 4.7, google_review_count: 214, yelp_rating: 4.6, yelp_review_count: 188 },
  { name: 'Mountain View Auto', address: 'Denver, CO', google_place_id: 'ChIJmountainviewauto', google_rating: 3.3, google_review_count: 143 },
  { name: 'Lakeside Dental Group', address: 'Austin, TX', google_place_id: 'ChIJlakesidedental', google_rating: 4.8, google_review_count: 201 },
  { name: 'Harbor Fresh Market', address: 'Seattle, WA', yelp_business_id: 'harbor-fresh-market-seattle', yelp_rating: 4.2, yelp_review_count: 167 },
  { name: 'Riverstone Home Services', address: 'Phoenix, AZ', google_place_id: 'ChIJriverstonehome', yelp_business_id: 'riverstone-home-services-phoenix', google_rating: 4.1, google_review_count: 119, yelp_rating: 3.9, yelp_review_count: 82 },
  { name: 'Bluebird Yoga Studio', address: 'Madison, WI', google_place_id: 'ChIJbluebirdyoga', yelp_business_id: 'bluebird-yoga-madison', google_rating: 4.9, google_review_count: 52, yelp_rating: 4.8, yelp_review_count: 34 },
  { name: 'Summit Pet Clinic', address: 'Minneapolis, MN', google_place_id: 'ChIJsummitpetclinic', yelp_business_id: 'summit-pet-clinic-minneapolis', google_rating: 4.5, google_review_count: 97, yelp_rating: 4.4, yelp_review_count: 71 },
  { name: 'West Loop Bakeshop', address: 'Chicago, IL', google_place_id: 'ChIJwestloopbakeshop', yelp_business_id: 'west-loop-bakeshop-chicago', google_rating: 4.6, google_review_count: 89, yelp_rating: 4.5, yelp_review_count: 66 },
  { name: 'Copper State Dentistry', address: 'Phoenix, AZ', google_place_id: 'ChIJcopperstatedental', yelp_business_id: 'copper-state-dentistry-phoenix', google_rating: 4.7, google_review_count: 142, yelp_rating: 4.6, yelp_review_count: 58 },
];

const WEB_SOURCE_SEARCH_CATALOG = SAMPLE_BUSINESSES.map((business) => ({
  name: business.name,
  address: business.address ?? '',
  trustpilot_url: business.trustpilot_url,
  bbb_url: business.bbb_url,
}));

const TRUSTPILOT_SCRAPE_QUEUES: Record<string, SampleScrapeReview[]> = {
  'https://www.trustpilot.com/review/acmecoffee.com': [
    { external_id: 'acme-tp-q1', author_name: 'Riley P.', rating: 5, text: 'Espresso came out perfect even during the rush.', review_date: dateDaysAgo(2) },
    { external_id: 'acme-tp-q2', author_name: 'Nina G.', rating: 4, text: 'Friendly staff and a genuinely comfortable place to work.', review_date: dateDaysAgo(9) },
    { external_id: 'acme-tp-q3', author_name: 'Oscar D.', rating: 3, text: 'Coffee is good, but power outlets are always taken.', review_date: dateDaysAgo(18) },
  ],
  'https://www.trustpilot.com/review/lakesidedental.com': [
    { external_id: 'ld-tp-q1', author_name: 'Kelsey M.', rating: 5, text: 'Best dentist experience I have had in years.', review_date: dateDaysAgo(4) },
    { external_id: 'ld-tp-q2', author_name: 'Andre S.', rating: 5, text: 'Kind hygienist, clear treatment plan, and zero upsell.', review_date: dateDaysAgo(12) },
    { external_id: 'ld-tp-q3', author_name: 'Marina V.', rating: 4, text: 'Short wait, but the actual care was excellent.', review_date: dateDaysAgo(21) },
  ],
  'https://www.trustpilot.com/review/riverstonehome.com': [
    { external_id: 'rs-tp-q1', author_name: 'Olive T.', rating: 2, text: 'Install worked, but the appointment window slipped twice.', review_date: dateDaysAgo(3) },
    { external_id: 'rs-tp-q2', author_name: 'Peter J.', rating: 4, text: 'Cleaner finish work than I expected from a big service company.', review_date: dateDaysAgo(11) },
    { external_id: 'rs-tp-q3', author_name: 'Vera K.', rating: 5, text: 'Tech explained each step and fixed the issue in one visit.', review_date: dateDaysAgo(24) },
  ],
  'https://www.trustpilot.com/review/summitpetclinic.com': [
    { external_id: 'spc-tp-q1', author_name: 'Julia C.', rating: 5, text: 'Our dog felt safe here, which says a lot.', review_date: dateDaysAgo(2) },
    { external_id: 'spc-tp-q2', author_name: 'Damon F.', rating: 4, text: 'Good follow-up call after the procedure.', review_date: dateDaysAgo(14) },
    { external_id: 'spc-tp-q3', author_name: 'Rae L.', rating: 3, text: 'Care was solid, but checkout took a while.', review_date: dateDaysAgo(27) },
  ],
};

const BBB_SCRAPE_QUEUES: Record<string, SampleScrapeReview[]> = {
  'https://www.bbb.org/us/co/denver/profile/auto-repair/mountain-view-auto': [
    { external_id: 'mv-bbb-q1', author_name: 'Casey H.', rating: 1, text: 'The estimate changed after I dropped off the car.', review_date: dateDaysAgo(1) },
    { external_id: 'mv-bbb-q2', author_name: 'Marlon T.', rating: 2, text: 'Repair worked, but communication was rough throughout.', review_date: dateDaysAgo(10) },
    { external_id: 'mv-bbb-q3', author_name: 'Pia D.', rating: 4, text: 'Front desk was better this visit and the car was done on time.', review_date: dateDaysAgo(25) },
  ],
  'https://www.bbb.org/us/wa/seattle/profile/grocery/harbor-fresh-market': [
    { external_id: 'hf-bbb-q1', author_name: 'Teri B.', rating: 5, text: 'Consistently fresh seafood and helpful service.', review_date: dateDaysAgo(5) },
    { external_id: 'hf-bbb-q2', author_name: 'Luis P.', rating: 4, text: 'Love the local makers they carry.', review_date: dateDaysAgo(13) },
    { external_id: 'hf-bbb-q3', author_name: 'Gina M.', rating: 2, text: 'Product quality is good, but the parking lot is still chaos.', review_date: dateDaysAgo(26) },
  ],
  'https://www.bbb.org/us/az/phoenix/profile/home-services/riverstone-home-services': [
    { external_id: 'rs-bbb-q1', author_name: 'Hector W.', rating: 2, text: 'Work was fine once they arrived, but scheduling was sloppy.', review_date: dateDaysAgo(4) },
    { external_id: 'rs-bbb-q2', author_name: 'Lena C.', rating: 4, text: 'Tech was knowledgeable and respectful of the house.', review_date: dateDaysAgo(12) },
    { external_id: 'rs-bbb-q3', author_name: 'Mina D.', rating: 5, text: 'Fast HVAC repair and no surprise charges.', review_date: dateDaysAgo(23) },
  ],
};

const YELP_WEB_SCRAPE_QUEUES: Record<string, SampleScrapeReview[]> = {
  'https://www.yelp.com/biz/acme-coffee-portland': [
    { external_id: 'acme-yelp-q1', author_name: 'Zoe H.', rating: 5, text: 'Cold brew and breakfast sandwich were both excellent.', review_date: dateDaysAgo(3) },
    { external_id: 'acme-yelp-q2', author_name: 'Marcus T.', rating: 4, text: 'Great drinks, limited seating after 9 a.m.', review_date: dateDaysAgo(10) },
    { external_id: 'acme-yelp-q3', author_name: 'Leah P.', rating: 3, text: 'Coffee was good, but the line stalled for a while.', review_date: dateDaysAgo(20) },
  ],
  'https://www.yelp.com/biz/harbor-fresh-market-seattle': [
    { external_id: 'hf-yelp-q1', author_name: 'Ben S.', rating: 5, text: 'The prepared foods counter keeps getting better.', review_date: dateDaysAgo(2) },
    { external_id: 'hf-yelp-q2', author_name: 'Talia V.', rating: 4, text: 'Worth the premium when I need quality produce.', review_date: dateDaysAgo(11) },
    { external_id: 'hf-yelp-q3', author_name: 'Ned F.', rating: 2, text: 'Checkout was slow and the lot was packed again.', review_date: dateDaysAgo(24) },
  ],
  'https://www.yelp.com/biz/riverstone-home-services-phoenix': [
    { external_id: 'rs-yelp-q1', author_name: 'Amber G.', rating: 5, text: 'Plumber was on time and fixed the leak quickly.', review_date: dateDaysAgo(5) },
    { external_id: 'rs-yelp-q2', author_name: 'Cole M.', rating: 4, text: 'Office communication improved a lot from my last visit.', review_date: dateDaysAgo(13) },
    { external_id: 'rs-yelp-q3', author_name: 'Naomi J.', rating: 2, text: 'Fine work, but invoices still arrive later than promised.', review_date: dateDaysAgo(22) },
  ],
  'https://www.yelp.com/biz/summit-pet-clinic-minneapolis': [
    { external_id: 'spc-yelp-q1', author_name: 'Priya L.', rating: 5, text: 'The urgent care vet was calm and reassuring.', review_date: dateDaysAgo(4) },
    { external_id: 'spc-yelp-q2', author_name: 'Gabe R.', rating: 4, text: 'Caring staff and a clean clinic.', review_date: dateDaysAgo(16) },
    { external_id: 'spc-yelp-q3', author_name: 'Marta W.', rating: 2, text: 'Prescription pickup still feels too manual.', review_date: dateDaysAgo(28) },
  ],
};

const GOOGLE_SCRAPE_QUEUES: Record<string, SampleScrapeReview[]> = {
  ChIJmountainviewauto: [
    { external_id: 'mv-gp-q1', author_name: 'Trevor P.', rating: 1, text: 'Pickup was promised by noon and my car was still untouched at 4.', review_date: dateDaysAgo(1) },
    { external_id: 'mv-gp-q2', author_name: 'Sonia F.', rating: 2, text: 'Felt pressured into services I had not approved yet.', review_date: dateDaysAgo(11) },
    { external_id: 'mv-gp-q3', author_name: 'Derek N.', rating: 3, text: 'Repair seems okay, but updates were hard to get.', review_date: dateDaysAgo(20) },
  ],
  ChIJlakesidedental: [
    { external_id: 'ld-gp-q1', author_name: 'Helen Y.', rating: 5, text: 'Whitening consult was quick, clear, and low-pressure.', review_date: dateDaysAgo(2) },
    { external_id: 'ld-gp-q2', author_name: 'Omar T.', rating: 5, text: 'They stayed on schedule and explained every charge.', review_date: dateDaysAgo(13) },
    { external_id: 'ld-gp-q3', author_name: 'Jill A.', rating: 4, text: 'Friendly hygienist and painless x-rays.', review_date: dateDaysAgo(24) },
  ],
  ChIJriverstonehome: [
    { external_id: 'rs-gp-q1', author_name: 'Ben R.', rating: 5, text: 'Water heater replacement was clean and fast.', review_date: dateDaysAgo(2) },
    { external_id: 'rs-gp-q2', author_name: 'Sheila W.', rating: 4, text: 'Dispatch called ahead and the tech wore boot covers.', review_date: dateDaysAgo(9) },
    { external_id: 'rs-gp-q3', author_name: 'Marcos I.', rating: 2, text: 'The repair held, but the reschedule process was rough.', review_date: dateDaysAgo(18) },
  ],
  ChIJbluebirdyoga: [
    { external_id: 'bb-gp-q1', author_name: 'Paige H.', rating: 5, text: 'Lovely beginner flow and a calm studio.', review_date: dateDaysAgo(1) },
    { external_id: 'bb-gp-q2', author_name: 'Rosa V.', rating: 5, text: 'Teachers are encouraging without being intense.', review_date: dateDaysAgo(8) },
    { external_id: 'bb-gp-q3', author_name: 'Cameron J.', rating: 4, text: 'Great instructors and a clean space, just limited parking.', review_date: dateDaysAgo(16) },
  ],
  ChIJsummitpetclinic: [
    { external_id: 'spc-gp-q1', author_name: 'Malik C.', rating: 5, text: 'Dental cleaning for our dog went smoother than expected.', review_date: dateDaysAgo(2) },
    { external_id: 'spc-gp-q2', author_name: 'Tina E.', rating: 3, text: 'Good care, slower checkout than I hoped for.', review_date: dateDaysAgo(12) },
    { external_id: 'spc-gp-q3', author_name: 'Harper D.', rating: 4, text: 'Vet explained the lab results in plain language.', review_date: dateDaysAgo(26) },
  ],
};

const YELP_SCRAPE_QUEUES: Record<string, SampleScrapeReview[]> = {
  'acme-coffee-portland': [
    { external_id: 'acme-yapi-q1', author_name: 'Molly G.', rating: 5, text: 'Barista steered me to a seasonal drink that ruled.', review_date: dateDaysAgo(2) },
    { external_id: 'acme-yapi-q2', author_name: 'Ethan V.', rating: 4, text: 'Reliable coffee, excellent oat milk options.', review_date: dateDaysAgo(10) },
    { external_id: 'acme-yapi-q3', author_name: 'Syd K.', rating: 3, text: 'Tasty drinks, but seating fills up fast after lunch.', review_date: dateDaysAgo(21) },
  ],
  'harbor-fresh-market-seattle': [
    { external_id: 'hf-yapi-q1', author_name: 'Jana L.', rating: 5, text: 'Prepared soups were outstanding on a rainy day.', review_date: dateDaysAgo(1) },
    { external_id: 'hf-yapi-q2', author_name: 'Keith M.', rating: 4, text: 'Excellent produce quality and fast deli service.', review_date: dateDaysAgo(9) },
    { external_id: 'hf-yapi-q3', author_name: 'Robin F.', rating: 2, text: 'Still wish the parking situation were less chaotic.', review_date: dateDaysAgo(22) },
  ],
  'riverstone-home-services-phoenix': [
    { external_id: 'rs-yapi-q1', author_name: 'Dana K.', rating: 5, text: 'Electrician diagnosed the issue quickly and left good notes.', review_date: dateDaysAgo(3) },
    { external_id: 'rs-yapi-q2', author_name: 'Wes B.', rating: 4, text: 'The service window actually held this time.', review_date: dateDaysAgo(11) },
    { external_id: 'rs-yapi-q3', author_name: 'Ivy S.', rating: 2, text: 'The fix worked, but I still had to chase a receipt.', review_date: dateDaysAgo(25) },
  ],
  'bluebird-yoga-madison': [
    { external_id: 'bb-yapi-q1', author_name: 'Noah T.', rating: 5, text: 'Studio smells clean and the instructors are warm.', review_date: dateDaysAgo(2) },
    { external_id: 'bb-yapi-q2', author_name: 'Fern L.', rating: 5, text: 'Great mix of restorative and strength classes.', review_date: dateDaysAgo(14) },
  ],
  'summit-pet-clinic-minneapolis': [
    { external_id: 'spc-yapi-q4', author_name: 'Claire P.', rating: 5, text: 'Text updates during our cat surgery were reassuring.', review_date: dateDaysAgo(4) },
    { external_id: 'spc-yapi-q5', author_name: 'Dev J.', rating: 4, text: 'Friendly staff and transparent pricing at checkout.', review_date: dateDaysAgo(15) },
    { external_id: 'spc-yapi-q6', author_name: 'Irene M.', rating: 2, text: 'Helpful vet, but the meds were not ready when promised.', review_date: dateDaysAgo(29) },
  ],
};

export function getSampleGooglePlacesResults(query: string, location?: string | null): ApiSearchResult[] {
  const ranked = SAMPLE_API_SEARCH_CATALOG
    .filter((entry) => entry.google_place_id)
    .map((entry) => ({
      entry,
      score: scoreMatch(query, location, entry),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ entry }) => ({
      name: entry.name,
      address: entry.address,
      rating: entry.google_rating,
      review_count: entry.google_review_count,
      place_id: entry.google_place_id,
    }));

  return ranked.length > 0 ? ranked : buildFallbackApiResults('google_places', query, location);
}

export function getSampleYelpResults(query: string, location?: string | null): ApiSearchResult[] {
  const ranked = SAMPLE_API_SEARCH_CATALOG
    .filter((entry) => entry.yelp_business_id)
    .map((entry) => ({
      entry,
      score: scoreMatch(query, location, entry),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ entry }) => ({
      name: entry.name,
      address: entry.address,
      rating: entry.yelp_rating,
      review_count: entry.yelp_review_count,
      business_id: entry.yelp_business_id,
    }));

  return ranked.length > 0 ? ranked : buildFallbackApiResults('yelp_fusion', query, location);
}

function buildFallbackScrapeQueue(
  source: 'trustpilot' | 'bbb' | 'yelp' | 'google_places' | 'yelp_api',
  url: string
): SampleScrapeReview[] {
  const slug = slugify(url);
  const labelBySource = {
    trustpilot: 'Trustpilot',
    bbb: 'BBB',
    yelp: 'Yelp',
    google_places: 'Google',
    yelp_api: 'Yelp API',
  };
  const label = labelBySource[source];

  return [
    {
      external_id: `${slug}-${source}-1`,
      author_name: 'Sample Reviewer',
      rating: 5,
      text: `${label} sample review for ${url}.`,
      review_date: dateDaysAgo(3),
    },
    {
      external_id: `${slug}-${source}-2`,
      author_name: 'Local Guide',
      rating: 4,
      text: `Reliable service and a polished sample-mode experience.`,
      review_date: dateDaysAgo(14),
    },
  ];
}

export function getSampleScrapeReviews(
  source: 'trustpilot' | 'bbb' | 'yelp' | 'google_places' | 'yelp_api',
  url: string,
  existingExternalIds: Iterable<string>
): SampleScrapeReview[] {
  const queuesBySource = {
    trustpilot: TRUSTPILOT_SCRAPE_QUEUES,
    bbb: BBB_SCRAPE_QUEUES,
    yelp: YELP_WEB_SCRAPE_QUEUES,
    google_places: GOOGLE_SCRAPE_QUEUES,
    yelp_api: YELP_SCRAPE_QUEUES,
  };
  const queue = queuesBySource[source][url] ?? buildFallbackScrapeQueue(source, url);
  const existing = new Set(existingExternalIds);

  return queue.filter((review) => !existing.has(review.external_id)).slice(0, 3);
}

export function getSampleSentiment(
  text: string | null | undefined,
  rating: number | null | undefined
): { score: number; label: SentimentLabel } {
  if (rating != null) {
    if (rating >= 4) return { score: 0.72, label: 'positive' };
    if (rating <= 2) return { score: -0.62, label: 'negative' };
  }

  const normalizedText = normalize(text);
  const positiveHints = ['great', 'excellent', 'kind', 'friendly', 'smooth', 'fast', 'helpful'];
  const negativeHints = ['slow', 'rough', 'bad', 'late', 'rude', 'stale', 'hard'];

  if (positiveHints.some((hint) => normalizedText.includes(hint))) {
    return { score: 0.48, label: 'positive' };
  }
  if (negativeHints.some((hint) => normalizedText.includes(hint))) {
    return { score: -0.46, label: 'negative' };
  }

  return { score: 0.04, label: 'neutral' };
}

export function getSampleSourceSearchResults(
  query: string,
  location?: string | null
): { trustpilot: SearchResult[]; bbb: SearchResult[] } {
  const ranked = WEB_SOURCE_SEARCH_CATALOG
    .map((entry) => ({
      entry,
      score: scoreMatch(query, location, {
        name: entry.name,
        address: entry.address,
      }),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  const trustpilot = ranked
    .filter(({ entry }) => entry.trustpilot_url)
    .slice(0, 5)
    .map(({ entry }) => ({
      name: entry.name,
      url: entry.trustpilot_url!,
      address: entry.address || undefined,
    }));

  const bbb = ranked
    .filter(({ entry }) => entry.bbb_url)
    .slice(0, 5)
    .map(({ entry }) => ({
      name: entry.name,
      url: entry.bbb_url!,
      address: entry.address || undefined,
    }));

  if (trustpilot.length > 0 || bbb.length > 0) {
    return { trustpilot, bbb };
  }

  const fallbackSlug = slugify(query || 'sample-business');
  const fallbackName = query.trim() || 'Sample Business';
  const fallbackLocation = location?.trim() || 'Sample City, USA';

  return {
    trustpilot: [
      {
        name: fallbackName,
        url: `https://www.trustpilot.com/review/${fallbackSlug}.example`,
        address: fallbackLocation,
      },
    ],
    bbb: [
      {
        name: fallbackName,
        url: `https://www.bbb.org/us/sample/profile/${fallbackSlug}`,
        address: fallbackLocation,
      },
    ],
  };
}
