import React, { useState, useCallback, useEffect } from 'react';
import HomePage from './components/HomePage';
import LiveConsultationPage from './components/LiveConsultationPage';
import DiagnosisReport from './components/DiagnosisReport';
import MedicationReport from './components/MedicationReport';
import Spinner from './components/Spinner';
import PastDiagnosesPage from './components/PastDiagnosesPage'; 
import DiseaseSurveillancePage from './components/DiseaseSurveillancePage';
import FeverOrchestratorPage from './components/FeverOrchestratorPage'; // Import new component
import type { PatientData, Diagnosis, MedicationInfo, FeverFusionModality } from './types';
import { getFeverDiagnosis, getMedicationInfo } from './services/geminiService';
import { fileToBase64, blobToBase64 } from './utils/image';
import { StethoscopeIcon, RefreshCwIcon, ArrowLeftIcon } from './components/icons'; // Import ArrowLeftIcon

type Page = 'home' | 'live_consult' | 'loading' | 'diagnosis' | 'medication_report' | 'error' | 'past_diagnoses' | 'surveillance' | 'orchestrator'; // Added 'orchestrator'

const LOCAL_STORAGE_KEY = 'feverdoc_ai_diagnoses';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [loadingMessage, setLoadingMessage] = useState('Generating Diagnosis...');
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [medicationInfo, setMedicationInfo] = useState<MedicationInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State for Past Diagnoses
  const [pastDiagnoses, setPastDiagnoses] = useState<Diagnosis[]>([]);
  const [selectedPastDiagnosis, setSelectedPastDiagnosis] = useState<Diagnosis | null>(null);

  useEffect(() => {
    // Load past diagnoses from localStorage on initial mount
    try {
      const storedDiagnoses = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedDiagnoses) {
        setPastDiagnoses(JSON.parse(storedDiagnoses));
      }
    } catch (e) {
      console.error("Failed to load diagnoses from localStorage", e);
    }
  }, []);

  // Effect to save diagnoses to localStorage whenever pastDiagnoses changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pastDiagnoses));
    } catch (e) {
      console.error("Failed to save diagnoses to localStorage", e);
    }
  }, [pastDiagnoses]);

  // State for Triage Form
  const [formData, setFormData] = useState<Omit<PatientData, 'photo'>>({
    age: '', gender: '', symptoms: '', additionalSymptoms: '', pastMedicalHistory: '', feverDays: '',
    temperature: '', rdtResult: '', location: '', season: '', travel: '',
    cvConfidence: '85',
  });
  const [triagePhoto, setTriagePhoto] = useState<File | null>(null);
  const [triagePhotoPreview, setTriagePhotoPreview] = useState<string | null>(null);

  // State for Medication Check
  const [medicationPhoto, setMedicationPhoto] = useState<File | null>(null);
  const [medicationPhotoPreview, setMedicationPhotoPreview] = useState<string | null>(null);

  // State for FeverFusion™ Multimodal Inputs
  const [multimodalFiles, setMultimodalFiles] = useState<{ [key in FeverFusionModality]?: File }>({});
  const [multimodalPreviews, setMultimodalPreviews] = useState<{ [key in FeverFusionModality]?: string }>({});

  const handleMultimodalChange = useCallback((modality: FeverFusionModality, file: File | null) => {
    setMultimodalFiles(prev => ({ ...prev, [modality]: file }));

    // Clean up previous blob URL to prevent memory leaks
    if (multimodalPreviews[modality]) {
      URL.revokeObjectURL(multimodalPreviews[modality]!);
    }

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setMultimodalPreviews(prev => ({ ...prev, [modality]: previewUrl }));
    } else {
      setMultimodalPreviews(prev => ({ ...prev, [modality]: undefined }));
    }
  }, [multimodalPreviews]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTriagePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTriagePhoto(file);
      setTriagePhotoPreview(URL.createObjectURL(file));
    }
  };
  
  const handleMedicationPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMedicationPhoto(file);
      setMedicationPhotoPreview(URL.createObjectURL(file));
    }
  };

  const saveDiagnosis = useCallback((newDiagnosis: Diagnosis) => {
    const diagnosisWithTimestamp = { ...newDiagnosis, timestamp: Date.now() };
    setDiagnosis(diagnosisWithTimestamp);
    setPastDiagnoses(prev => [diagnosisWithTimestamp, ...prev]); // Add new diagnosis to the top
  }, []);

  const handleTriageSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingMessage('Generating Fused Multimodal Diagnosis...');
    setCurrentPage('loading');
    setError(null);
    setDiagnosis(null); // Clear current diagnosis
    setSelectedPastDiagnosis(null); // Clear selected past diagnosis

    try {
      let fullPatientData: PatientData = { ...formData, cvConfidence: formData.cvConfidence || '85' };
      
      // Process standard RDT/Other photo
      if (triagePhoto) {
        const base64 = await fileToBase64(triagePhoto);
        fullPatientData.photo = { base64, mimeType: triagePhoto.type };
      }

      // Process all multimodal files
      for (const key in multimodalFiles) {
        const modalityKey = key as FeverFusionModality;
        const file = multimodalFiles[modalityKey];
        if (file) {
          const base64 = await (file.type.startsWith('audio') ? blobToBase64(file) : fileToBase64(file));
          (fullPatientData as any)[modalityKey] = { base64, mimeType: file.type };
        }
      }
      
      const result = await getFeverDiagnosis(fullPatientData);
      saveDiagnosis(result); // Save to state and localStorage
      setCurrentPage('diagnosis');
    } catch (err: unknown) {
      console.error(err);
      let errorMessage: string;
      if (err instanceof Error) {
          errorMessage = err.message;
      } else {
          errorMessage = String(err);
      }
      setError(`An error occurred while generating the diagnosis: ${errorMessage}. Please check the console for details.`);
      setCurrentPage('error');
    }
  }, [formData, triagePhoto, multimodalFiles, saveDiagnosis]);

  const handleMedicationCheck = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationPhoto) {
        setError('Please upload a photo of the medicine.');
        setCurrentPage('error');
        return;
    }
    setLoadingMessage('Analyzing Medication...');
    setCurrentPage('loading');
    setError(null);
    
    try {
        const base64 = await fileToBase64(medicationPhoto);
        const photoData = { base64, mimeType: medicationPhoto.type };
        const result = await getMedicationInfo(photoData);
        setMedicationInfo(result);
        setCurrentPage('medication_report');
    } catch (err: unknown) {
        console.error(err);
        let errorMessage: string;
        if (err instanceof Error) {
            errorMessage = err.message;
        } else {
            errorMessage = String(err);
        }
        setError(`Could not analyze the medication photo: ${errorMessage}. Please try again with a clearer image.`);
        setCurrentPage('error');
    }
  }, [medicationPhoto]);

  const handleDiagnosisFromLiveCall = useCallback(async (patientData: PatientData) => {
    setCurrentPage('loading');
    setLoadingMessage('Generating Fused Diagnosis from Live Call...');
    setError(null);
    setDiagnosis(null); // Clear current diagnosis
    setSelectedPastDiagnosis(null); // Clear selected past diagnosis

    // The live call gathered verbal info, so update the main form state for context
    setFormData(prev => ({...prev, ...patientData}));

    try {
        const result = await getFeverDiagnosis(patientData);
        saveDiagnosis(result); // Save to state and localStorage
        setCurrentPage('diagnosis');
    } catch (err: unknown) {
        console.error(err);
        // Fix: Safely handle the 'unknown' error type by converting it to a string before use.
        let errorMessage: string;
        if (err instanceof Error) {
            errorMessage = err.message;
        } else {
            errorMessage = String(err);
        }
        setError(`An error occurred while generating the diagnosis from the live call: ${errorMessage}.`);
        setCurrentPage('error');
    }
  }, [saveDiagnosis]);

  // Handler for selecting a *specific* past diagnosis to view its report
  const handleViewSpecificPastDiagnosis = useCallback((diag: Diagnosis) => {
    setSelectedPastDiagnosis(diag);
    setDiagnosis(diag); // Also set current diagnosis for DiagnosisReport
    setCurrentPage('diagnosis');
  }, []);

  // Handler for *navigating* to the PastDiagnosesPage
  const onNavigateToPastDiagnoses = useCallback(() => {
    setCurrentPage('past_diagnoses');
  }, []);

  const handleFillSampleData = useCallback(() => {
    const sampleData = {
      age: '28',
      gender: 'Male',
      symptoms: 'high fever, severe headache, body pain, rash on arms, weakness',
      additionalSymptoms: 'The rash consists of small red dots and is not itchy. Body pain is most severe in the lower back and legs.',
      pastMedicalHistory: 'Had a similar high-grade fever about 2 years ago, diagnosed as viral fever. No known comorbidities.',
      feverDays: '4',
      temperature: '39.2',
      rdtResult: 'NS1 positive, Malaria negative, Platelets 95000',
      location: 'Pune, Maharashtra',
      season: 'Monsoon',
      travel: 'no',
      cvConfidence: '90',
    };
    setFormData(sampleData);
  }, []);


  const resetApp = () => {
    setCurrentPage('home');
    setDiagnosis(null);
    setMedicationInfo(null);
    setError(null);
    setSelectedPastDiagnosis(null);
    // Reset triage form
    setFormData({
      age: '', gender: '', symptoms: '', additionalSymptoms: '', pastMedicalHistory: '', feverDays: '',
      temperature: '', rdtResult: '', location: '', season: '', travel: '',
      cvConfidence: '85',
    });
    setTriagePhoto(null);
    setTriagePhotoPreview(null);
    // Reset medication form
    setMedicationPhoto(null);
    setMedicationPhotoPreview(null);
    // Reset multimodal form
    setMultimodalFiles({});
    Object.values(multimodalPreviews).forEach(url => url && URL.revokeObjectURL(url));
    setMultimodalPreviews({});
  };

  const onStartLiveConsult = useCallback(() => {
    setCurrentPage('live_consult');
  }, []);

  const onViewFeverOrchestrator = useCallback(() => { // New handler for Orchestrator page
    setCurrentPage('orchestrator');
  }, []);


  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onTriageSubmit={handleTriageSubmit}
            formData={formData}
            onFormChange={handleFormChange}
            onTriagePhotoChange={handleTriagePhotoChange}
            triagePhotoPreview={triagePhotoPreview}
            onStartLiveConsult={onStartLiveConsult}
            onMedicationCheck={handleMedicationCheck}
            onMedicationPhotoChange={handleMedicationPhotoChange}
            medicationPhotoPreview={medicationPhotoPreview}
            isLoading={false}
            onMultimodalChange={handleMultimodalChange}
            multimodalPreviews={multimodalPreviews as { [key: string]: string | null }}
            onViewPastDiagnoses={onNavigateToPastDiagnoses}
            onViewDiseaseSurveillance={() => setCurrentPage('surveillance')}
            onViewFeverOrchestrator={onViewFeverOrchestrator} // New prop
            onFillSampleData={handleFillSampleData}
          />
        );
      case 'live_consult':
        return (
          <LiveConsultationPage
            onEndConsultationWithData={handleDiagnosisFromLiveCall}
            onEndConsultation={() => setCurrentPage('home')}
          />
        );
      case 'loading':
        return <Spinner message={loadingMessage} />;
      case 'diagnosis':
        return (
          <div className="animate-fadeInUp">
            <DiagnosisReport diagnosis={selectedPastDiagnosis || diagnosis!} location={formData.location} />
            <div className="text-center mt-8">
              <button 
                onClick={resetApp} 
                className="inline-flex items-center px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300 transform hover:scale-105 shadow-md"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Home
              </button>
            </div>
          </div>
        );
       case 'medication_report':
        return (
            <div className="animate-fadeInUp">
                <MedicationReport info={medicationInfo!} />
                <div className="text-center mt-8">
                    <button onClick={resetApp} className="inline-flex items-center px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300 transform hover:scale-105 shadow-md">
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        Back to Home
                    </button>
                </div>
            </div>
        );
      case 'past_diagnoses': 
        return (
          <PastDiagnosesPage
            pastDiagnoses={pastDiagnoses}
            onSelectDiagnosis={handleViewSpecificPastDiagnosis}
            onGoBack={() => setCurrentPage('home')}
          />
        );
      case 'surveillance':
        return (
          <DiseaseSurveillancePage
            onGoBack={() => setCurrentPage('home')}
          />
        );
      case 'orchestrator': // New page case
        return (
          <FeverOrchestratorPage
            onGoBack={() => setCurrentPage('home')}
          />
        );
      case 'error':
        return (
           <div className="w-full max-w-4xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative animate-fadeInUp" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
             <div className="text-center mt-4">
               <button onClick={resetApp} className="px-4 py-2 bg-red-200 text-red-800 font-semibold rounded-lg hover:bg-red-300 transition-colors">
                 Try Again
               </button>
             </div>
          </div>
        )
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 p-4 sm:p-8">
      <header className="text-center mb-8 relative">
        <div className="inline-flex items-center gap-3">
          <StethoscopeIcon className="w-12 h-12 text-teal-500 animate-pulse-soft" />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">FeverDoc-AI</h1>
        </div>
        <p className="text-lg text-slate-600 mt-2">WHO-Trained Tropical Fever Triage Expert</p>
        <p className="text-sm text-slate-500">A Micro Labs Hackathon 2025 Project</p>

        {currentPage !== 'home' && (
          <button 
            onClick={resetApp} 
            className="absolute top-0 right-0 flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-all duration-300 transform hover:scale-105 shadow-sm"
            aria-label="Start Over"
          >
            <RefreshCwIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Start Over</span>
          </button>
        )}
      </header>
      
      <main className="space-y-8">
        {renderContent()}
      </main>

      <footer className="text-center mt-12 text-sm text-slate-500">
        <p>&copy; 2025 Micro Labs. All rights reserved.</p>
        <p>This tool is for informational purposes and is not a substitute for professional medical advice.</p>
      </footer>
    </div>
  );
};

export default App;
