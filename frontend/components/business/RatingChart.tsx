'use client';
import { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { useStorage } from '@/lib/storage/hooks';
import type { ChartData } from '@/lib/storage/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

function getCssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getChartColors() {
  const primary = getCssVar('--primary');
  return {
    borderColor: primary,
    backgroundColor: primary + '26',
    gridColor: getCssVar('--border'),
    textColor: getCssVar('--muted-foreground'),
  };
}

interface RatingChartProps {
  businessId: number;
}

export function RatingChart({ businessId }: RatingChartProps) {
  const storage = useStorage();
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState(() =>
    typeof window !== 'undefined'
      ? getChartColors()
      : {
          borderColor: '#4455A0',
          backgroundColor: 'rgba(68, 85, 160, 0.15)',
          gridColor: '#e2e8f0',
          textColor: '#64748b',
        }
  );
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  useEffect(() => {
    storage.getChartData(businessId)
      .then(setChartData)
      .catch((err) => {
        console.error('Failed to load chart data:', err);
        setError('Could not load rating history.');
      });
  }, [businessId, storage]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setColors(getChartColors());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  if (error) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground">
        Loading chart...
      </div>
    );
  }

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Average Rating',
        data: chartData.data,
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        grid: { color: colors.gridColor },
        ticks: { color: colors.textColor },
      },
      x: {
        grid: { color: colors.gridColor },
        ticks: { color: colors.textColor },
      },
    },
  };

  return (
    <div className="h-64 sm:h-72 xl:h-80">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
