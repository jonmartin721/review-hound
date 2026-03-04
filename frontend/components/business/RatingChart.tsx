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
  const accent = getCssVar('--accent');
  return {
    borderColor: accent,
    backgroundColor: accent + '26',
    gridColor: getCssVar('--border'),
    textColor: getCssVar('--text-secondary'),
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
          borderColor: '#E5A84B',
          backgroundColor: 'rgba(229, 168, 75, 0.15)',
          gridColor: '#2A2A2A',
          textColor: '#8A8A8A',
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
      <div className="h-32 flex items-center justify-center text-[var(--text-muted)]">
        {error}
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="h-32 flex items-center justify-center text-[var(--text-muted)]">
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

  return <Line ref={chartRef} data={data} options={options} />;
}
