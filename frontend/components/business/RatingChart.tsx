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

/** Resolve a CSS color value (including oklch) to an rgb() string Canvas2D can use. */
function resolveColor(value: string): string {
  const el = document.createElement('div');
  el.style.color = value;
  document.body.appendChild(el);
  const resolved = getComputedStyle(el).color;
  document.body.removeChild(el);
  return resolved;
}

function getChartColors() {
  const style = getComputedStyle(document.documentElement);
  const borderColor = resolveColor(style.getPropertyValue('--chart-1').trim());
  // Build a transparent variant from the resolved rgb value
  const match = borderColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  const backgroundColor = match
    ? `rgba(${match[1]}, ${match[2]}, ${match[3]}, 0.25)`
    : borderColor;
  return {
    borderColor,
    backgroundColor,
    gridColor: resolveColor(style.getPropertyValue('--border').trim()),
    textColor: resolveColor(style.getPropertyValue('--muted-foreground').trim()),
  };
}

interface RatingChartProps {
  businessId: number;
}

export function RatingChart({ businessId }: RatingChartProps) {
  const storage = useStorage();
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState<ReturnType<typeof getChartColors> | null>(null);
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
    setColors(getChartColors());
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

  if (!chartData || !colors) {
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
