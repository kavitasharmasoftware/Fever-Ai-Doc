

import React from 'react';
import type { Diagnosis } from '../types';
import { HistoryIcon, AlertTriangleIcon, ArrowLeftIcon } from './icons';

interface PastDiagnosesPageProps {
  pastDiagnoses: Diagnosis[];
  onSelectDiagnosis: (diagnosis: Diagnosis) => void;
  onGoBack: () => void;
}

const PastDiagnosesPage: React.FC<PastDiagnosesPageProps> = ({ pastDiagnoses, onSelectDiagnosis, onGoBack }) => {

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const riskLevelColors = {
    'Low': 'text-green-600',
    'Moderate': 'text-yellow-600',
    'High': 'text-orange-600',
    'Emergency': 'text-red-600',
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/60 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 animate-fadeInUp">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onGoBack} className="flex items-center text-slate-600 hover:text-slate-800 transition-colors">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Back to Home</span>
        </button>
        <div className="flex items-center">
            <HistoryIcon className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-slate-800 ml-3">Patient History</h1>
        </div>
      </div>

      {pastDiagnoses.length === 0 ? (
        <div className="text-center p-8 text-slate-500">
          <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <p className="text-lg">No past diagnoses found. Start a new triage to save your first record!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {pastDiagnoses.map((diag, index) => (
            <div
              key={diag.timestamp || index}
              className="bg-slate-50 p-4 rounded-lg shadow-md hover:shadow-lg hover:bg-slate-100 transition-all duration-200 cursor-pointer border border-slate-200"
              onClick={() => onSelectDiagnosis(diag)}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-slate-800">{diag.primary_suspected_diagnosis}</h2>
                <span className="text-sm text-slate-500">{formatDate(diag.timestamp)}</span>
              </div>
              <p className="text-slate-600 mb-2">Individual Risk: <span className={`font-semibold ${riskLevelColors[diag.risk_level]}`}>{diag.risk_level}</span></p>
              {diag.outbreak_prediction.alert_flag === 'Yes' && (
                <div className="flex items-center text-red-600 text-sm font-medium">
                  <AlertTriangleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span>District Outbreak Alert: {diag.outbreak_prediction.district_risk_level}</span>
                </div>
              )}
              <button
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PastDiagnosesPage;