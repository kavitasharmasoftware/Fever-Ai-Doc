import React, { useState, useCallback } from 'react';
import type { Diagnosis, Candidate } from '../types';
import { AlertTriangleIcon, Volume2Icon, MapPinIcon, ActivityIcon, CarIcon } from './icons';
import { textToSpeech, findNearbyClinics } from '../services/geminiService';
import * as AudioUtils from '../utils/audio';
import PostDiagnosisAssistant from './PostDiagnosisAssistant';

interface DiagnosisReportProps {
  diagnosis: Diagnosis;
  location: string;
}

const riskLevelColors = {
  'Low': 'text-green-700 bg-green-50',
  'Moderate': 'text-yellow-700 bg-yellow-50',
  'High': 'text-orange-700 bg-orange-50',
  'Emergency': 'text-red-700 bg-red-50',
};

const DiagnosisReport: React.FC<DiagnosisReportProps> = ({ diagnosis, location }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [clinics, setClinics] = useState<Candidate[]>([]);
  const [isFindingClinics, setIsFindingClinics] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleSpeak = useCallback(async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const base64Audio = await textToSpeech(text);
      const audioBytes = AudioUtils.decode(base64Audio);
      const audioBuffer = await AudioUtils.decodeAudioData(audioBytes, audioContext, 24000, 1);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
      source.onended = () => setIsSpeaking(false);
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsSpeaking(false);
    }
  }, [isSpeaking]);
  
  const handleFindClinics = useCallback(async () => {
    setIsFindingClinics(true);
    setClinics([]);
    try {
        const result = await findNearbyClinics(location);
        setClinics(result);
    } catch (error) {
        console.error("Error finding clinics:", error);
    } finally {
        setIsFindingClinics(false);
    }
  }, [location]);
  
  // No direct equivalent for 'Book Emergency Cab' in new diagnosis structure, so removing it.
  // const handleBookCab = useCallback(async () => {
  //   setIsBookingCab(true);
  //   setLocationError(null);

  //   const openRideShare = (clinicName: string) => {
  //       const encodedAddress = encodeURIComponent(clinicName);
  //       // This opens Uber, but can be adapted for other services like Ola.
  //       const url = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodedAddress}`;
  //       window.open(url, '_blank');
  //       setIsBookingCab(false);
  //   }

  //   try {
  //       const nearbyClinics = await findNearbyClinics(location);
  //       const firstClinic = nearbyClinics.flatMap(c => c.groundingMetadata?.groundingChunks ?? []).find(chunk => chunk?.maps?.uri);
        
  //       if (firstClinic?.maps?.title) {
  //           openRideShare(firstClinic.maps.title);
  //       } else {
  //           setLocationError("Could not find a specific clinic to book a cab to. Please use the 'Find Facilities' button.");
  //           setIsBookingCab(false);
  //       }
  //   } catch (error) {
  //       console.error("Error booking cab:", error);
  //       setLocationError("An error occurred while trying to book a cab.");
  //       setIsBookingCab(false);
  //   }
  // }, [location]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-white/70 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 space-y-6">
        
        {/* Summary and Primary Diagnosis */}
        <div className="p-6 rounded-lg bg-teal-50/50">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Case Summary</h2>
          <p className="text-lg text-slate-800 mt-1 mb-4">{diagnosis.summary}</p>

          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Primary Suspected Diagnosis</h2>
          <p className="text-3xl font-bold text-teal-700 mt-1">{diagnosis.primary_suspected_diagnosis}</p>
          <p className="text-lg text-slate-600">Confidence Score: {diagnosis.confidence_score}</p>
        </div>

        {/* Risk Level */}
        <div className={`p-4 rounded-lg border-l-4 ${riskLevelColors[diagnosis.risk_level].replace('bg', 'border')}`}>
            <h3 className={`font-bold text-lg ${riskLevelColors[diagnosis.risk_level].split(' ')[0]}`}>
                Individual Patient Risk: {diagnosis.risk_level}
            </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Differential Diagnoses */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Differential Diagnoses</h3>
            <ul className="list-disc list-inside mt-2 text-slate-700 space-y-1">
              {diagnosis.differential_diagnoses.map((diff, index) => <li key={index}>{diff}</li>)}
            </ul>
          </div>
          
          {/* Recommended Actions */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wider flex justify-between items-center mb-1">
                <span>Recommended Actions</span>
                {diagnosis.recommended_actions.length > 0 && (
                    <button onClick={() => handleSpeak(diagnosis.recommended_actions[0])} disabled={isSpeaking} className="text-green-600 hover:text-green-800 disabled:text-slate-400 p-1 rounded-full hover:bg-green-100 transition-colors">
                        <Volume2Icon className="w-5 h-5"/>
                    </button>
                )}
            </h3>
            <ul className="list-disc list-inside mt-2 text-green-900 space-y-1">
              {diagnosis.recommended_actions.map((action, index) => <li key={index}>{action}</li>)}
            </ul>
          </div>
        </div>
          
        {/* Outbreak Prediction */}
        <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-2 mb-1">
                <ActivityIcon className="w-5 h-5"/> Outbreak Prediction for District
            </h3>
            <p className="text-blue-900"><span className="font-semibold">Disease Trend:</span> {diagnosis.outbreak_prediction.disease_trend}</p>
            <p className="text-blue-900"><span className="font-semibold">District Risk Level:</span> {diagnosis.outbreak_prediction.district_risk_level}</p>
            <p className="text-blue-900"><span className="font-semibold">Alert Flag:</span> {diagnosis.outbreak_prediction.alert_flag}</p>
            <p className="text-blue-900 text-sm mt-2">Data Sources: {diagnosis.outbreak_prediction.data_sources_used.join(', ')}</p>
        </div>

        {/* Action Buttons (Find Facilities) */}
        <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Local Resources</h3>
            <div className="flex flex-wrap gap-4 mt-3">
              {/* Removed Book Emergency Cab as its logic relied on old 'immediate_action' */}
              <button
                onClick={handleFindClinics}
                disabled={isFindingClinics}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-400 transition-all duration-300 transform hover:scale-105"
              >
                <MapPinIcon className="w-5 h-5 mr-2" />
                {isFindingClinics ? 'Searching...' : 'Find Nearest Facilities'}
              </button>
            </div>
            {locationError && <p className="text-sm text-red-600 mt-2">{locationError}</p>}
        </div>

        {clinics.length > 0 && (
            <div className="animate-fadeInUp">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Nearby Medical Facilities</h3>
                <ul className="mt-2 space-y-2">
                    {clinics.flatMap(c => c.groundingMetadata?.groundingChunks ?? []).filter(chunk => chunk?.maps?.uri).map((chunk, index) => (
                        <li key={index} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors">
                            <a href={chunk.maps!.uri!} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:underline flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span>{chunk.maps!.title || 'Unnamed Facility'}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {/* Research Notes */}
        <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Research Notes</h3>
            <p className="text-slate-800 mt-1">{diagnosis.research_notes}</p>
        </div>
        
        {/* Disclaimer */}
        <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wider mb-1">Disclaimer</h3>
            <p className="text-amber-900 font-bold">{diagnosis.disclaimer}</p>
        </div>
      </div>
      
      {/* PostDiagnosisAssistant might need to be updated to reflect the new structure, but its core function (chat) should still work */}
      <PostDiagnosisAssistant diagnosis={diagnosis} />

    </div>
  );
};

export default DiagnosisReport;