import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import type { Portfolio } from '../../types';

Chart.register(...registerables);

interface PortfolioChartProps {
  portfolios: Portfolio[];
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ portfolios }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  useEffect(() => {
    if (!chartRef.current || portfolios.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Check if dark mode is enabled
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Generate sample data for the chart
    const generateChartData = () => {
      const days = 30;
      const labels = [];
      const data = [];
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Calculate total portfolio value for this date (mock data)
        const totalValue = portfolios.reduce((sum, portfolio) => {
          // Simulate some volatility in historical data
          const variance = Math.random() * 0.1 - 0.05; // ±5% variance
          const historicalValue = portfolio.totalValue * (1 + variance);
          return sum + historicalValue;
        }, 0);
        
        data.push(totalValue);
      }
      
      return { labels, data };
    };

    const { labels, data } = generateChartData();

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Portfolio Value',
            data,
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#0ea5e9',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#0ea5e9',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return `Value: $${context.parsed.y.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: isDarkMode ? '#9ca3af' : '#64748b',
              font: {
                size: 12,
              },
            },
          },
          y: {
            grid: {
              color: isDarkMode ? '#374151' : '#f1f5f9',
            },
            ticks: {
              color: isDarkMode ? '#9ca3af' : '#64748b',
              font: {
                size: 12,
              },
              callback: function(value) {
                return '$' + Number(value).toLocaleString();
              },
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [portfolios]);

  if (portfolios.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No portfolio data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-64">
      <canvas ref={chartRef} />
    </div>
  );
};

export default PortfolioChart;
