import type { OutbreakAlert, SurveillanceRegionData, AlertSeverity, FeverType, OverallStats, WeeklyTrendPoint, WeeklyTrendData } from '../types';

const districts = ['Jaipur', 'Kochi', 'Patna', 'Pune', 'Hyderabad', 'Lucknow', 'Bhopal', 'Chennai', 'Guwahati', 'Agra'];
const feverTypes: FeverType[] = ['Dengue', 'Malaria', 'Typhoid', 'Flu', 'Chikungunya', 'Other Viral'];
const severities: AlertSeverity[] = ['Low', 'Moderate', 'High', 'Critical'];

// Helper to get a random item from an array
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// Helper to get a random number within a range
const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number): number => parseFloat((Math.random() * (max - min) + min).toFixed(1));


/**
 * Generates dynamic mock data for outbreak alerts.
 */
const generateDynamicAlerts = (): OutbreakAlert[] => {
  const numAlerts = getRandomInt(2, 6); // Vary number of alerts
  const alerts: OutbreakAlert[] = [];
  const today = new Date();

  for (let i = 0; i < numAlerts; i++) {
    const severity = getRandomItem(severities);
    const feverType = getRandomItem(feverTypes);
    const district = getRandomItem(districts);
    
    // Simulate detection date within the last 7 days
    const detectionDate = new Date(today.setDate(today.getDate() - getRandomInt(0, 7))).toISOString().split('T')[0];

    let trigger = '';
    let recommendedAction = '';

    switch (severity) {
      case 'Critical':
        trigger = `${getRandomInt(40, 70)}% spike in ${feverType} cases above seasonal baseline; unusual climate patterns.`;
        recommendedAction = 'Deploy rapid response teams; immediate mass screening and treatment; activate emergency protocols.';
        break;
      case 'High':
        trigger = `${getRandomInt(20, 35)}% spike in ${feverType} cases; sustained high mosquito breeding index.`;
        recommendedAction = 'Intensify fogging/larvicide operations; launch public awareness campaign on vector control.';
        break;
      case 'Moderate':
        trigger = `Localized cluster of ${feverType} cases identified; recent travel history correlation.`;
        recommendedAction = 'Conduct focused rapid diagnostic tests; distribute prophylactic medication where appropriate.';
        break;
      case 'Low':
      default:
        trigger = `Minor increase in reported ${feverType} cases; potential localized environmental factor.`;
        recommendedAction = 'Monitor trends closely; inspect water sources; advise on safe hygiene practices.';
        break;
    }

    alerts.push({
      id: `alert-${Date.now() + i}`, // Unique ID
      district,
      feverType,
      severity,
      detectionDate,
      trigger,
      recommendedAction
    });
  }
  return alerts;
};

/**
 * Generates dynamic mock data for surveillance region data.
 */
const generateDynamicRegionData = (): SurveillanceRegionData[] => {
  const regionData: SurveillanceRegionData[] = [];
  
  districts.forEach((districtName, index) => {
    const baselineCases = getRandomInt(30, 100);
    const currentCases = getRandomInt(baselineCases * 0.7, baselineCases * 1.5); // Cases fluctuate around baseline
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (currentCases > baselineCases * 1.2) {
      trend = 'increasing';
    } else if (currentCases < baselineCases * 0.8) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    let alertLevel: AlertSeverity;
    if (currentCases > baselineCases * 1.4) alertLevel = 'Critical';
    else if (currentCases > baselineCases * 1.1) alertLevel = 'High';
    else if (currentCases > baselineCases * 0.9) alertLevel = 'Moderate';
    else alertLevel = 'Low';

    const climate = {
      temperatureC: getRandomFloat(25, 35), // Realistic tropical temperatures
      humidityPercent: getRandomInt(60, 95), // High humidity
      rainfallMm: getRandomInt(20, 300), // Variable rainfall
    };

    regionData.push({
      id: `region-${index + 1}`,
      name: `${districtName} District`,
      currentCases,
      baselineCases,
      trend,
      alertLevel,
      climate,
    });
  });
  return regionData;
};

/**
 * Generates dynamic overall surveillance statistics.
 */
const getSurveillanceOverallStats = (alerts: OutbreakAlert[], regions: SurveillanceRegionData[]): OverallStats => {
  const totalActiveAlerts = alerts.length;
  const regionsUnderHighAlert = regions.filter(r => r.alertLevel === 'High' || r.alertLevel === 'Critical').length;
  
  const totalCases = regions.reduce((sum, r) => sum + r.currentCases, 0);
  const averageCasesPerRegion = regions.length > 0 ? parseFloat((totalCases / regions.length).toFixed(1)) : 0;

  const totalTemp = regions.reduce((sum, r) => sum + r.climate.temperatureC, 0);
  const avgTemperatureC = regions.length > 0 ? parseFloat((totalTemp / regions.length).toFixed(1)) : 0;

  const totalHumidity = regions.reduce((sum, r) => sum + r.climate.humidityPercent, 0);
  const avgHumidityPercent = regions.length > 0 ? parseFloat((totalHumidity / regions.length).toFixed(1)) : 0;

  return {
    totalActiveAlerts,
    regionsUnderHighAlert,
    averageCasesPerRegion,
    avgTemperatureC,
    avgHumidityPercent,
  };
};

/**
 * Generates dynamic weekly fever trend data for a conceptual graph.
 */
const getWeeklyFeverTrendData = (): WeeklyTrendData => {
  const now = new Date();
  const weekLabels = Array.from({ length: 8 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (7 * (7 - i))); // Go back 7 weeks
    return `Week ${Math.ceil((d.getDate() + 6 - d.getDay()) / 7)}`;
  });

  const generateTrend = (base: number, fluctuation: number): WeeklyTrendPoint[] => {
    return weekLabels.map((week, i) => {
      const cases = Math.max(0, base + getRandomInt(-fluctuation, fluctuation) + (i * 2)); // Slightly increasing trend
      return { week, cases };
    });
  };

  return {
    overallFeverCases: generateTrend(150, 50),
    dengueCases: generateTrend(40, 20),
    malariaCases: generateTrend(20, 15),
  };
};

// --- Public API Functions ---

export const getOutbreakAlerts = async (): Promise<OutbreakAlert[]> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(generateDynamicAlerts()), getRandomInt(500, 1000)); // Simulate API call latency
  });
};

export const getSurveillanceRegionData = async (): Promise<SurveillanceRegionData[]> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(generateDynamicRegionData()), getRandomInt(700, 1300)); // Simulate API call latency
  });
};

export const getOverallSurveillanceStats = async (): Promise<OverallStats> => {
  return new Promise(async resolve => {
    // Need alerts and region data to compute stats
    const alerts = await generateDynamicAlerts();
    const regions = await generateDynamicRegionData();
    setTimeout(() => resolve(getSurveillanceOverallStats(alerts, regions)), getRandomInt(300, 700)); // Simulate API call latency
  });
};

export const getWeeklyFeverTrends = async (): Promise<WeeklyTrendData> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(getWeeklyFeverTrendData()), getRandomInt(600, 1100)); // Simulate API call latency
  });
};