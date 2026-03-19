import { Card, CardContent } from '@/components/ui/card';

interface StatCardsProps {
  stats: {
    total_reviews: number;
    avg_rating: number;
    positive_pct: number;
    negative_pct: number;
  };
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-3xl font-bold text-primary font-mono">
            {stats.total_reviews}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Reviews</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-3xl font-bold text-primary font-mono">
            {stats.avg_rating.toFixed(1)}★
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Avg Rating</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-3xl font-bold text-positive font-mono">
            {Math.round(stats.positive_pct)}%
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Positive</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-3xl font-bold text-negative font-mono">
            {Math.round(stats.negative_pct)}%
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Negative</div>
        </CardContent>
      </Card>
    </div>
  );
}
