import React from 'react';
import PatientForm from './PatientForm';
import type { PatientData } from '../types';
import { VideoIcon, PillIcon, HistoryIcon, ActivityIcon, ThermometerIcon } from './icons';

type Modality = 'rashPhoto' | 'tonguePhoto' | 'eyePhoto' | 'palmPhoto' | 'nailPhoto' | 'coughAudio';

interface HomePageProps {
  onTriageSubmit: (e: React.FormEvent) => void;
  formData: Omit<PatientData, 'photo'>;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTriagePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triagePhotoPreview: string | null;
  onStartLiveConsult: () => void;
  onMedicationCheck: (e: React.FormEvent) => void;
  onMedicationPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  medicationPhotoPreview: string | null;
  isLoading: boolean;
  onMultimodalChange: (modality: Modality, file: File | null) => void;
  multimodalPreviews: { [key: string]: string | null };
  onViewPastDiagnoses: () => void;
  onViewDiseaseSurveillance: () => void;
  onViewFeverOrchestrator: () => void; // New prop for Orchestrator
  onFillSampleData: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  onTriageSubmit,
  formData,
  onFormChange,
  onTriagePhotoChange,
  triagePhotoPreview,
  onStartLiveConsult,
  onMedicationCheck,
  onMedicationPhotoChange,
  medicationPhotoPreview,
  isLoading,
  onMultimodalChange,
  multimodalPreviews,
  onViewPastDiagnoses,
  onViewDiseaseSurveillance,
  onViewFeverOrchestrator, // Destructure new prop
  onFillSampleData,
}) => {
  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl mx-auto">
        {/* Live Consultation Card */}
        <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 text-center flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Live Video AI Consult</h2>
          <VideoIcon className="w-12 h-12 text-teal-500 mb-4"/>
          <p className="text-slate-600 mb-4 text-sm">Real-time diagnosis with our AI doctor via video call.</p>
          <button onClick={onStartLiveConsult} className="w-full px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-all">
            Start Live Call
          </button>
        </div>

        {/* Medication Check Card */}
        <form onSubmit={onMedicationCheck} className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 text-center flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Medication Check</h2>
          <PillIcon className="w-12 h-12 text-green-500 mb-4"/>
          <p className="text-slate-600 mb-4 text-sm">Upload a photo of medicine to get info on usage and dosage.</p>
          <label htmlFor="medication-photo" className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all cursor-pointer">
            {medicationPhotoPreview ? 'Change Photo' : 'Upload Photo'}
          </label>
          <input id="medication-photo" name="medication-photo" type="file" className="sr-only" onChange={onMedicationPhotoChange} accept="image/*" />
          {medicationPhotoPreview && (
            <button type="submit" className="mt-2 w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all">
              Analyze Medicine
            </button>
          )}
        </form>

        {/* Patient History Card */}
        <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 text-center flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Patient History</h2>
          <HistoryIcon className="w-12 h-12 text-purple-500 mb-4"/>
          <p className="text-slate-600 mb-4 text-sm">View past AI diagnoses and track patient history over time.</p>
          <button onClick={onViewPastDiagnoses} className="w-full px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-all">
            View History
          </button>
        </div>
        
        {/* Disease Surveillance Card */}
        <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 text-center flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Surveillance</h2>
          <ActivityIcon className="w-12 h-12 text-blue-500 mb-4"/>
          <p className="text-slate-600 mb-4 text-sm">Real-time outbreak monitoring and disease trend analysis.</p>
          <button onClick={onViewDiseaseSurveillance} className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all">
            View Dashboard
          </button>
        </div>

        {/* Fever Orchestrator Card (New) */}
        <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 text-center flex flex-col items-center justify-center md:col-span-2 lg:col-span-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">AI Fever Orchestrator</h2>
            <ThermometerIcon className="w-12 h-12 text-indigo-500 mb-4"/>
            <p className="text-slate-600 mb-4 text-sm max-w-xl">
              Start a conversation to generate a detailed remote monitoring report. Begin with the patient's ID, and the AI will guide you through collecting the rest of the information.
            </p>
            <button onClick={onViewFeverOrchestrator} className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-all">
              Start Orchestrator Chat
            </button>
        </div>
      </div>
      
      <div className="text-center">
          <button onClick={onFillSampleData} className="px-4 py-2 text-sm bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-all">
            Fill with Sample Data
          </button>
      </div>

      <PatientForm
        onSubmit={onTriageSubmit}
        isLoading={isLoading}
        formData={formData}
        onFormChange={onFormChange}
        onPhotoChange={onTriagePhotoChange}
        photoPreview={triagePhotoPreview}
        onMultimodalChange={onMultimodalChange}
        multimodalPreviews={multimodalPreviews}
      />
    </div>
  );
};

export default HomePage;