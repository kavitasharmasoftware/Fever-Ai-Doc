import React, { useState, useEffect, useCallback } from 'react';
import { getOutbreakAlerts, getSurveillanceRegionData, getOverallSurveillanceStats, getWeeklyFeverTrends } from '../services/surveillanceDataService';
import type { OutbreakAlert, SurveillanceRegionData, AlertSeverity, OverallStats, WeeklyTrendPoint, WeeklyTrendData } from '../types';
import { ArrowLeftIcon, AlertTriangleIcon, MapPinIcon, ActivityIcon, ThermometerIcon, WaveformIcon } from './icons';
import Spinner from './Spinner';

interface DiseaseSurveillancePageProps {
  onGoBack: () => void;
}

const severityColors: Record<AlertSeverity, string> = {
  'Low': 'bg-green-100 text-green-800 border-green-200',
  'Moderate': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'High': 'bg-orange-100 text-orange-800 border-orange-200',
  'Critical': 'bg-red-100 text-red-800 border-red-200',
};

const trendColors = {
  'increasing': 'text-red-500',
  'decreasing': 'text-green-500',
  'stable': 'text-slate-500',
};

const DiseaseSurveillancePage: React.FC<DiseaseSurveillancePageProps> = ({ onGoBack }) => {
  const [outbreakAlerts, setOutbreakAlerts] = useState<OutbreakAlert[]>([]);
  const [regionData, setRegionData] = useState<SurveillanceRegionData[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [weeklyTrendData, setWeeklyTrendData] = useState<WeeklyTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [alerts, regions, stats, trends] = await Promise.all([
        getOutbreakAlerts(),
        getSurveillanceRegionData(),
        getOverallSurveillanceStats(),
        getWeeklyFeverTrends(),
      ]);
      setOutbreakAlerts(alerts);
      setRegionData(regions);
      setOverallStats(stats);
      setWeeklyTrendData(trends);
    } catch (err) {
      console.error("Error fetching surveillance data:", err);
      setError("Failed to load surveillance data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(); // Fetch immediately on mount
    // Removed setInterval for auto-refresh as per user request
  }, [fetchData]);


  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-200 text-center animate-fadeInUp">
        <Spinner message="Loading real-time disease surveillance data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative animate-fadeInUp" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <div className="text-center mt-4">
          <button onClick={onGoBack} className="px-4 py-2 bg-red-200 text-red-800 font-semibold rounded-lg hover:bg-red-300 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Helper for conceptual line graph visualization using SVG
  const renderTrendChart = (dataPoints: WeeklyTrendPoint[], colorClass: string) => {
    if (!dataPoints || dataPoints.length === 0) {
      return <div className="text-center text-slate-500 py-4">No trend data available for this category.</div>;
    }

    const maxCases = Math.max(...dataPoints.map(p => p.cases));
    const minCases = Math.min(...dataPoints.map(p => p.cases));
    const yRange = maxCases - minCases > 0 ? maxCases - minCases : 1;

    // Convert Tailwind class to a direct hex color
    const getSvgColor = (tailwindClass: string) => {
      if (tailwindClass.includes('blue')) return '#3b82f6'; // blue-500
      if (tailwindClass.includes('orange')) return '#f97316'; // orange-500
      if (tailwindClass.includes('purple')) return '#a855f7'; // purple-500
      return '#64748b'; // default slate-500
    };
    const svgColor = getSvgColor(colorClass);

    const chartWidth = 100; // SVG viewBox width
    const chartHeight = 100; // SVG viewBox height
    const xStep = chartWidth / (dataPoints.length - 1);

    const points = dataPoints.map((point, i) => {
        const x = i * xStep;
        // Scale y-value to chart height, invert so higher values are higher on chart
        // Add a small padding (10 units) to prevent points from touching top/bottom of viewBox edges
        const y = chartHeight - (10 + ((point.cases - minCases) / yRange) * (chartHeight - 20));
        return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative w-full overflow-x-auto min-h-[120px]">
        <div className="relative w-full h-32"> {/* Fixed height for visual consistency */}
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            {/* Horizontal grid lines for context */}
            <line x1="0" y1="90" x2="100" y2="90" stroke="#e2e8f0" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" />
            <line x1="0" y1="10" x2="100" y2="10" stroke="#e2e8f0" strokeWidth="0.5" />

            {/* The line graph */}
            <polyline
              fill="none"
              stroke={svgColor}
              strokeWidth="2"
              points={points}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Points on the line */}
            {dataPoints.map((point, i) => {
                const x = i * xStep;
                const y = chartHeight - (10 + ((point.cases - minCases) / yRange) * (chartHeight - 20));
                return (
                    <circle key={i} cx={x} cy={y} r="2" fill={svgColor} stroke="white" strokeWidth="1" />
                );
            })}
          </svg>
        </div>
        {/* X-axis labels (weeks) */}
        <div className="relative h-6 flex justify-between text-xs text-slate-500 px-1 mt-2">
          {dataPoints.map(p => <span key={p.week} className="flex-1 text-center truncate">{p.week.replace('Week ', 'Wk')}</span>)}
        </div>
      </div>
    );
  };


  return (
    <div className="w-full max-w-6xl mx-auto bg-white/60 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 animate-fadeInUp">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onGoBack} className="flex items-center text-slate-600 hover:text-slate-800 transition-colors">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Back to Home</span>
        </button>
        <div className="flex items-center">
            <ActivityIcon className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-slate-800 ml-3">Disease Surveillance</h1>
        </div>
         <button onClick={fetchData} className="px-4 py-2 bg-blue-100 text-blue-800 font-semibold rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2">
            <ActivityIcon className="w-4 h-4"/> Refresh Data
          </button>
      </div>

      <div className="space-y-8">
        {/* Overall Statistics Section */}
        {overallStats && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Overall Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="p-4 rounded-lg shadow-sm border border-slate-200 bg-blue-50 text-blue-800">
                <p className="text-sm font-medium">Active Alerts</p>
                <p className="text-3xl font-bold mt-1">{overallStats.totalActiveAlerts}</p>
              </div>
              <div className="p-4 rounded-lg shadow-sm border border-slate-200 bg-red-50 text-red-800">
                <p className="text-sm font-medium">High/Critical Alerts</p>
                <p className="text-3xl font-bold mt-1">{overallStats.regionsUnderHighAlert}</p>
              </div>
              <div className="p-4 rounded-lg shadow-sm border border-slate-200 bg-green-50 text-green-800">
                <p className="text-sm font-medium">Avg. Cases/Region</p>
                <p className="text-3xl font-bold mt-1">{overallStats.averageCasesPerRegion}</p>
              </div>
              <div className="p-4 rounded-lg shadow-sm border border-slate-200 bg-yellow-50 text-yellow-800 flex items-center gap-2">
                <ThermometerIcon className="w-6 h-6"/>
                <div>
                  <p className="text-sm font-medium">Avg. Temp</p>
                  <p className="text-xl font-bold mt-1">{overallStats.avgTemperatureC}°C</p>
                </div>
              </div>
              <div className="p-4 rounded-lg shadow-sm border border-slate-200 bg-indigo-50 text-indigo-800 flex items-center gap-2">
                 <WaveformIcon className="w-6 h-6"/>
                <div>
                  <p className="text-sm font-medium">Avg. Humidity</p>
                  <p className="text-xl font-bold mt-1">{overallStats.avgHumidityPercent}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Fever Trend Chart */}
        {weeklyTrendData && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Weekly Fever Trends</h2>
            <div className="bg-slate-50 p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Overall Fever Cases</h3>
              {renderTrendChart(weeklyTrendData.overallFeverCases, 'text-blue-500')}
              <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-4">Dengue Cases</h3>
              {renderTrendChart(weeklyTrendData.dengueCases, 'text-orange-500')}
              <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-4">Malaria Cases</h3>
              {renderTrendChart(weeklyTrendData.malariaCases, 'text-purple-500')}
            </div>
          </div>
        )}

        {/* Outbreak Alerts Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangleIcon className="w-7 h-7 text-orange-500"/>
            Active Outbreak Alerts
          </h2>
          {outbreakAlerts.length === 0 ? (
            <p className="text-slate-600 p-4 bg-slate-50 rounded-lg border border-slate-200">No active outbreak alerts at this time.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outbreakAlerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-lg shadow-sm border ${severityColors[alert.severity]}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold">{alert.district} - {alert.feverType}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${severityColors[alert.severity].split(' ')[0].replace('bg', 'bg-')}`}>{alert.severity}</span>
                  </div>
                  <p className="text-sm text-slate-700">Detected: {alert.detectionDate}</p>
                  <p className="text-sm text-slate-700">Trigger: {alert.trigger}</p>
                  <p className="text-sm text-slate-700 mt-2 font-medium">Action: {alert.recommendedAction}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Regional Data Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MapPinIcon className="w-7 h-7 text-teal-500"/>
            Regional Surveillance Data
          </h2>
          {regionData.length === 0 ? (
            <p className="text-slate-600 p-4 bg-slate-50 rounded-lg border border-slate-200">No regional surveillance data available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regionData.map(region => (
                <div key={region.id} className="p-4 rounded-lg shadow-sm border border-slate-200 bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800">{region.name}</h3>
                  <p className="text-sm text-slate-600">Current Cases: <span className="font-semibold">{region.currentCases}</span> (Baseline: {region.baselineCases})</p>
                  <p className="text-sm text-slate-600">Trend: <span className={`font-semibold ${trendColors[region.trend]}`}>{region.trend}</span></p>
                  <p className="text-sm text-slate-600">Alert Level: <span className={`font-semibold ${severityColors[region.alertLevel].split(' ')[1].replace('text', 'text-')}`}>{region.alertLevel}</span></p>
                  <div className="mt-2 text-xs text-slate-500">
                    <p>Temp: {region.climate.temperatureC}°C</p>
                    <p>Humidity: {region.climate.humidityPercent}%</p>
                    <p>Rainfall: {region.climate.rainfallMm}mm</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseSurveillancePage;