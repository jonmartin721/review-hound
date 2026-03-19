'use client';

import type { BusinessWithStats } from '@/lib/storage/types';
import { BusinessCard } from './BusinessCard';
import { IS_PORTFOLIO_MODE } from '@/lib/portfolio';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';

interface BusinessGridProps {
  businesses: BusinessWithStats[];
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  onAddBusiness?: () => void;
}

export function BusinessGrid({ businesses, onEdit, onDelete, onAddBusiness }: BusinessGridProps) {
  if (businesses.length === 0) {
    return (
      <Card className="p-12 text-center items-center">
        <div className="mx-auto w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-foreground font-medium text-lg">No businesses tracked yet</p>
        <p className="text-muted-foreground mt-1">
          {IS_PORTFOLIO_MODE
            ? 'Start a local workspace in this browser, then add sources to scrape reviews or clone the full app for always-on monitoring.'
            : 'Get started by adding your first business to track reviews.'}
        </p>
        {onAddBusiness && (
          <Button onClick={onAddBusiness} className="mt-6">
            <Plus />
            Add Business
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.map((business) => (
        <BusinessCard
          key={business.id}
          business={business}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
