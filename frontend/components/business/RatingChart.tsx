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

function getChartColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    borderColor: isDark ? '#E5A84B' : '#C4922F',
    backgroundColor: isDark ? 'rgba(229, 168, 75, 0.15)' : 'rgba(196, 146, 47, 0.15)',
    gridColor: isDark ? '#2A2A2A' : '#E0DDD8',
    textColor: isDark ? '#8A8A8A' : '#6B6B6B',
  };
}

interface RatingChartProps {
  businessId: number;
}

export function RatingChart({ businessId }: RatingChartProps) {
  const storage = useStorage();
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [colors, setColors] = useState(() =>
    typeof window !== 'undefined'
      ? getChartColors()
      : {
          borderColor: '#C4922F',
          backgroundColor: 'rgba(196, 146, 47, 0.15)',
          gridColor: '#E0DDD8',
          textColor: '#6B6B6B',
        }
  );
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  useEffect(() => {
    storage.getChartData(businessId).then(setChartData);
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
