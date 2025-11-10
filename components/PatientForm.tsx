import React, { useState, useCallback, useRef } from 'react';
import type { PatientData } from '../types';
import { StethoscopeIcon, UploadCloudIcon, HelpCircleIcon, CameraIcon, WaveformIcon, ThermometerIcon, EyeIcon, HandIcon, XIcon } from './icons';
import { getRdtGuideAudio } from '../services/geminiService';
import * as AudioUtils from '../utils/audio';

type Modality = 'rashPhoto' | 'tonguePhoto' | 'eyePhoto' | 'palmPhoto' | 'nailPhoto' | 'coughAudio';

// --- MultimodalAnalysis Component ---
const MultimodalAnalysis = ({
  onFileChange,
  previews,
  onTemperatureScan,
}: {
  onFileChange: (modality: Modality, file: File | null) => void;
  previews: { [key: string]: string | null };
  onTemperatureScan: (temp: string) => void;
}) => {
  const fileInputRefs = {
    rashPhoto: useRef<HTMLInputElement>(null),
    tonguePhoto: useRef<HTMLInputElement>(null),
    eyePhoto: useRef<HTMLInputElement>(null),
    palmPhoto: useRef<HTMLInputElement>(null),
    nailPhoto: useRef<HTMLInputElement>(null),
  };

  const [isRecording, setIsRecording] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, modality: Modality) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(modality, e.target.files[0]);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onFileChange('coughAudio', new File([audioBlob], "cough.webm", {type: 'audio/webm'}));
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not start recording. Please ensure microphone permissions are granted.");
    }
  }, [onFileChange]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);
  
  const handleFeverTouch = useCallback(() => {
    setIsScanning(true);
    // Simulate a 10-second scan
    setTimeout(() => {
        // Generate a realistic fever temperature
        const randomTemp = (37.5 + Math.random() * 2.5).toFixed(1);
        onTemperatureScan(randomTemp);
        setIsScanning(false);
    }, 5000); // 5s for demo purposes
  }, [onTemperatureScan]);

  const modalityConfig = [
    { id: 'rashPhoto', title: 'Rash Selfie', icon: <CameraIcon className="w-8 h-8"/> },
    { id: 'tonguePhoto', title: 'Tongue Selfie', icon: <CameraIcon className="w-8 h-8"/> },
    { id: 'eyePhoto', title: 'Eye Selfie', icon: <EyeIcon className="w-8 h-8"/> },
    { id: 'palmPhoto', title: 'Palm Selfie', icon: <HandIcon className="w-8 h-8"/> },
    { id: 'nailPhoto', title: 'Nail Selfie', icon: <CameraIcon className="w-8 h-8"/> },
  ];

  const renderImageUploader = (modality: any) => (
    <div key={modality.id} className="relative group bg-slate-100/50 rounded-lg p-4 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50/50 transition-all duration-300 h-40">
      {previews[modality.id] ? (
        <>
            <img src={previews[modality.id]} alt={`${modality.title} preview`} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
            <button onClick={() => {
                onFileChange(modality.id as Modality, null);
                if(fileInputRefs[modality.id as keyof typeof fileInputRefs].current) fileInputRefs[modality.id as keyof typeof fileInputRefs].current!.value = '';
            }} className="absolute top-1 right-1 z-10 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <XIcon className="w-4 h-4" />
            </button>
        </>
      ) : (
        <>
          {modality.icon}
          <p className="mt-2 text-sm font-semibold text-slate-600">{modality.title}</p>
          <button onClick={() => fileInputRefs[modality.id as keyof typeof fileInputRefs].current?.click()} className="mt-1 text-xs text-teal-500 font-medium hover:underline">Upload</button>
          <input type="file" accept="image/*" ref={fileInputRefs[modality.id as keyof typeof fileInputRefs]} onChange={(e) => handleFileSelect(e, modality.id as Modality)} className="hidden" />
        </>
      )}
    </div>
  );
  
  return (
    <div className="bg-white/30 p-4 rounded-lg mt-6">
        <h3 className="font-bold text-slate-700 text-lg mb-4">🔥 FeverFusion™ Multimodal Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {modalityConfig.map(renderImageUploader)}
            {/* Audio Recorder */}
            <div className="relative group bg-slate-100/50 rounded-lg p-4 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50/50 transition-all duration-300 h-40">
                {previews.coughAudio ? (
                     <>
                        <WaveformIcon className="w-8 h-8 text-teal-500" />
                        <p className="mt-2 text-sm font-semibold text-slate-600">Cough Audio</p>
                        <audio src={previews.coughAudio} controls className="mt-2 w-full h-8" />
                        <button onClick={() => onFileChange('coughAudio', null)} className="absolute top-1 right-1 z-10 p-1 bg-black/50 text-white rounded-full">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <WaveformIcon className="w-8 h-8 text-slate-500" />
                        <p className="mt-2 text-sm font-semibold text-slate-600">Cough Sound</p>
                        <button onClick={isRecording ? stopRecording : startRecording} className={`mt-2 text-sm font-medium px-3 py-1 rounded-full text-white ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-teal-500'}`}>
                            {isRecording ? 'Stop' : 'Record'}
                        </button>
                    </>
                )}
            </div>
            {/* FeverTouch */}
            <div className="bg-slate-100/50 rounded-lg p-4 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50/50 transition-all duration-300 h-40">
                <ThermometerIcon className={`w-8 h-8 ${isScanning ? 'text-red-500 animate-pulse-soft' : 'text-slate-500'}`} />
                <p className="mt-2 text-sm font-semibold text-slate-600">FeverTouch™</p>
                <button onClick={handleFeverTouch} disabled={isScanning} className="mt-1 text-sm text-teal-500 font-medium hover:underline disabled:text-slate-400 disabled:no-underline">
                    {isScanning ? 'Scanning...' : 'Start Scan'}
                </button>
                {isScanning && <p className="text-xs text-slate-500 mt-1">Place phone on forehead...</p>}
            </div>
        </div>
    </div>
  )
}


interface PatientFormProps {
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  formData: Omit<PatientData, 'photo'>;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  photoPreview: string | null;
  onMultimodalChange: (modality: Modality, file: File | null) => void;
  multimodalPreviews: { [key: string]: string | null };
}

const PatientForm: React.FC<PatientFormProps> = ({ 
  onSubmit, 
  isLoading, 
  formData, 
  onFormChange,
  onPhotoChange,
  photoPreview,
  onMultimodalChange,
  multimodalPreviews
}) => {
  const [isGuidePlaying, setIsGuidePlaying] = useState(false);
  const [rdtGuideAudio, setRdtGuideAudio] = useState<string | null>(null);

  const handlePlayRdtGuide = useCallback(async () => {
    if (isGuidePlaying) return;
    setIsGuidePlaying(true);
    try {
      let audioData = rdtGuideAudio;
      if (!audioData) {
        audioData = await getRdtGuideAudio();
        setRdtGuideAudio(audioData); // Cache the audio data
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBytes = AudioUtils.decode(audioData!);
      const audioBuffer = await AudioUtils.decodeAudioData(audioBytes, audioContext, 24000, 1);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
      source.onended = () => setIsGuidePlaying(false);
    } catch (error) {
      console.error("Error playing RDT guide:", error);
      setIsGuidePlaying(false);
    }
  }, [isGuidePlaying, rdtGuideAudio]);

  const handleTemperatureScan = useCallback((temp: string) => {
    onFormChange({ target: { name: 'temperature', value: temp } } as React.ChangeEvent<HTMLInputElement>);
  }, [onFormChange]);

  const inputStyles = "w-full px-3 py-2 bg-slate-50 text-slate-800 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder-slate-400 transition-all duration-200";

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/60 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
      <div className="flex items-center mb-6">
        <StethoscopeIcon className="w-8 h-8 text-teal-500" />
        <h1 className="text-3xl font-bold text-slate-800 ml-3">Comprehensive AI Triage</h1>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Multimodal Analysis Component */}
        <MultimodalAnalysis onFileChange={onMultimodalChange} previews={multimodalPreviews} onTemperatureScan={handleTemperatureScan}/>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-300/70">
          {/* Patient Info */}
          <div className="space-y-2">
            <label htmlFor="age" className="block text-sm font-medium text-slate-700">Age (years)</label>
            <input type="number" name="age" id="age" value={formData.age} onChange={onFormChange} required className={inputStyles} />
          </div>
          <div className="space-y-2">
            <label htmlFor="gender" className="block text-sm font-medium text-slate-700">Gender</label>
            <select name="gender" id="gender" value={formData.gender} onChange={onFormChange} required className={inputStyles}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {/* Clinical Details */}
          <div className="space-y-2">
            <label htmlFor="feverDays" className="block text-sm font-medium text-slate-700">Fever Days</label>
            <input type="number" name="feverDays" id="feverDays" value={formData.feverDays} onChange={onFormChange} required className={inputStyles} />
          </div>
          <div className="space-y-2">
            <label htmlFor="temperature" className="block text-sm font-medium text-slate-700">Temperature (°C)</label>
            <input type="number" step="0.1" name="temperature" id="temperature" value={formData.temperature} onChange={onFormChange} required className={inputStyles} placeholder="Or use FeverTouch™ scan"/>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="symptoms" className="block text-sm font-medium text-slate-700">Symptoms (comma-separated)</label>
            <textarea name="symptoms" id="symptoms" rows={3} value={formData.symptoms} onChange={onFormChange} required className={inputStyles}></textarea>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="additionalSymptoms" className="block text-sm font-medium text-slate-700">Additional Symptom Details (Optional)</label>
            <textarea 
              name="additionalSymptoms" 
              id="additionalSymptoms" 
              rows={2} 
              value={formData.additionalSymptoms || ''} 
              onChange={onFormChange} 
              className={inputStyles}
              placeholder="e.g., Rash is itchy and on the back, cough is dry"
            ></textarea>
          </div>
           <div className="md:col-span-2 space-y-2">
            <label htmlFor="pastMedicalHistory" className="block text-sm font-medium text-slate-700">Past Medical History</label>
            <textarea 
              name="pastMedicalHistory" 
              id="pastMedicalHistory" 
              rows={3} 
              value={formData.pastMedicalHistory} 
              onChange={onFormChange} 
              className={inputStyles}
              placeholder="e.g., Previous Dengue in 2022, Diabetes, Hypertension"
            ></textarea>
          </div>
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="rdtResult" className="block text-sm font-medium text-slate-700">RDT Result (text on cassette)</label>
              <button type="button" onClick={handlePlayRdtGuide} disabled={isGuidePlaying} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-teal-600 disabled:text-slate-300 disabled:cursor-wait transition-colors" aria-label="How to read RDT results">
                <HelpCircleIcon className="w-5 h-5" />
              </button>
            </div>
            <input type="text" name="rdtResult" id="rdtResult" value={formData.rdtResult} onChange={onFormChange} required className={inputStyles} placeholder="e.g., 'C, M, P positive' or 'NS1 positive'" />
          </div>
          {/* Contextual Info */}
          <div className="space-y-2">
            <label htmlFor="location" className="block text-sm font-medium text-slate-700">Location (District)</label>
            <input type="text" name="location" id="location" value={formData.location} onChange={onFormChange} required className={inputStyles} />
          </div>
          <div className="space-y-2">
            <label htmlFor="season" className="block text-sm font-medium text-slate-700">Season</label>
            <select name="season" id="season" value={formData.season} onChange={onFormChange} required className={inputStyles}>
              <option value="">Select Season</option>
              <option value="Monsoon">Monsoon</option>
              <option value="Summer">Summer</option>
              <option value="Winter">Winter</option>
              <option value="Post-Monsoon">Post-Monsoon</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="travel" className="block text-sm font-medium text-slate-700">Recent Travel History</label>
            <input type="text" name="travel" id="travel" value={formData.travel} onChange={onFormChange} required className={inputStyles} placeholder="e.g., 'None' or 'Visited Mumbai last week'"/>
          </div>
           <div className="space-y-2">
            <label htmlFor="cvConfidence" className="block text-sm font-medium text-slate-700">Photo Analysis Confidence (%)</label>
            <input type="number" name="cvConfidence" id="cvConfidence" value={formData.cvConfidence} onChange={onFormChange} required className={inputStyles} />
          </div>

          {/* Photo Upload */}
          <div className="md:col-span-2 space-y-2">
             <label className="block text-sm font-medium text-slate-700">Upload RDT Photo / Other</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-400 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                 {photoPreview ? (
                  <img src={photoPreview} alt="Patient photo preview" className="mx-auto h-24 w-auto rounded-md object-contain" />
                ) : (
                  <UploadCloudIcon className="mx-auto h-12 w-12 text-slate-400" />
                )}
                <div className="flex text-sm text-slate-600 justify-center">
                  <label htmlFor="photo" className="relative cursor-pointer bg-transparent rounded-md font-medium text-teal-500 hover:text-teal-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500 px-1">
                    <span>Upload a file</span>
                    <input id="photo" name="photo" type="file" className="sr-only" onChange={onPhotoChange} accept="image/*" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4">
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
            {isLoading ? 'Analyzing...' : 'Get AI Diagnosis'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;