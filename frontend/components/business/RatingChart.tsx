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

function isDark() {
  return document.documentElement.classList.contains('dark');
}

function getChartColors() {
  const dark = isDark();
  return {
    borderColor: dark ? '#8ba3c4' : '#5b7a9d',
    backgroundColor: dark ? 'rgba(139, 163, 196, 0.3)' : 'rgba(91, 122, 157, 0.25)',
    gridColor: dark ? '#3a3a3a' : '#dcdcdc',
    textColor: dark ? '#999999' : '#777777',
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
          borderColor: '#5b7a9d',
          backgroundColor: 'rgba(91, 122, 157, 0.25)',
          gridColor: '#dcdcdc',
          textColor: '#777777',
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
