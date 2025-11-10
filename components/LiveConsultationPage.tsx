import React, { useState, useRef, useCallback, useEffect } from 'react';
import { liveDiagnosisTools, liveDiagnosisSystemInstruction, getAiClient } from '../services/geminiService';
import type { PatientData, FeverFusionModality } from '../types';
import * as AudioUtils from '../utils/audio';
import { blobToBase64 } from '../utils/image';
import { BotIcon, XIcon, VideoIcon, AlertTriangleIcon, CameraIcon, WaveformIcon, StethoscopeIcon } from './icons';
import { Modality, LiveServerMessage } from '@google/genai';

type ModalityCapture = FeverFusionModality | 'rdtPhoto';

interface LiveConsultationPageProps {
    onEndConsultationWithData: (data: PatientData) => void;
    onEndConsultation: () => void;
}

type PermissionState = 'pending' | 'granted' | 'denied';

const LiveConsultationPage: React.FC<LiveConsultationPageProps> = ({ onEndConsultationWithData, onEndConsultation }) => {
    const [permissionState, setPermissionState] = useState<PermissionState>('pending');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Ready to start consultation.');
    const [aiInstruction, setAiInstruction] = useState('');
    const [currentAiSpeechChunk, setCurrentAiSpeechChunk] = useState('');
    const [userTranscription, setUserTranscription] = useState('');
    const [isCapturing, setIsCapturing] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sessionPromiseRef = useRef<ReturnType<ReturnType<typeof getAiClient>['live']['connect']> | null>(null);
    const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const [capturedData, setCapturedData] = useState<Partial<PatientData>>({});
    const [capturedPreviews, setCapturedPreviews] = useState<Partial<Record<ModalityCapture, string>>>({});
    const evidenceBarOrder: ModalityCapture[] = ['rashPhoto', 'tonguePhoto', 'eyePhoto', 'palmPhoto', 'nailPhoto', 'coughAudio', 'rdtPhoto'];


    // Removed API Key check useEffect. For Vercel, the key must be in environment variables.
    // The getAiClient function will handle the check.
    
    const handleCaptureFrame = useCallback(async (modality: ModalityCapture, callId: string, callName: string) => {
        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;
        if (!videoEl || !canvasEl) return;
        
        setStatusMessage(`Capturing ${modality.replace('Photo', '')}...`);
        setIsCapturing(`Capturing ${modality.replace('Photo', '')}...`);
        
        setTimeout(() => setIsCapturing(null), 700);
        
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return;
        
        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
        
        const dataUrl = canvasEl.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        
        const keyToUpdate = modality === 'rdtPhoto' ? 'photo' : modality;
        
        setCapturedData(prev => ({...prev, [keyToUpdate]: { base64, mimeType: 'image/jpeg' }}));
        setCapturedPreviews(prev => ({...prev, [modality]: dataUrl}));
        
        sessionPromiseRef.current?.then(session => {
             session.sendToolResponse({
                functionResponses: { id: callId, name: callName, response: { result: `Successfully captured ${modality.replace('Photo', '')}.` } }
            });
        });

    }, []);
    
    const handleRecordCough = useCallback(async (callId: string, callName: string) => {
        if (!streamRef.current) return;
        
        setStatusMessage("Recording cough for 5s...");
        setIsCapturing("Recording cough for 5s...");
        
        mediaRecorderRef.current = new MediaRecorder(streamRef.current);
        const audioChunks: Blob[] = [];
        mediaRecorderRef.current.ondataavailable = (event) => audioChunks.push(event.data);
        
        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const base64 = await blobToBase64(audioBlob);
            setCapturedData(prev => ({...prev, coughAudio: { base64, mimeType: audioBlob.type }}));
            setCapturedPreviews(prev => ({...prev, coughAudio: 'recorded'}));
            setIsCapturing(null);

            sessionPromiseRef.current?.then(session => {
                session.sendToolResponse({
                    functionResponses: { id: callId, name: callName, response: { result: "Successfully recorded cough audio." } }
                });
            });
        };

        mediaRecorderRef.current.start();
        setTimeout(() => {
             mediaRecorderRef.current?.stop();
        }, 5000);

    }, []);

    const stopSession = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close());
    }, []);

    const startSession = useCallback(async () => {
        if (isSessionActive) return;
        setStatusMessage('Requesting permissions...');
        try {
            // getAiClient() is called first to ensure API key exists before requesting permissions.
            const ai = getAiClient();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setPermissionState('granted');
            setStatusMessage('Starting session...');
            setIsSessionActive(true);

            // FIX: This ref is used to accumulate transcription chunks inside the `onmessage` callback,
            // preventing a stale closure issue where the full text wouldn't be set correctly.
            const currentChunkRef = { current: '' };
            
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = { input: inputAudioContext, output: outputAudioContext };
            
            let nextStartTime = 0;
            const sources = new Set<AudioBufferSourceNode>();

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction: liveDiagnosisSystemInstruction,
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: [liveDiagnosisTools],
                },
                callbacks: {
                    onopen: () => {
                        setStatusMessage('Connected. AI is ready to talk.');
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        processorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = {
                                data: AudioUtils.encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            currentChunkRef.current += message.serverContent.outputTranscription.text;
                            setCurrentAiSpeechChunk(currentChunkRef.current);
                        }
                        if (message.serverContent?.inputTranscription) {
                            setUserTranscription(message.serverContent.inputTranscription.text);
                        }
                        
                        if (message.serverContent?.turnComplete) {
                           setAiInstruction(currentChunkRef.current);
                           setCurrentAiSpeechChunk('');
                           currentChunkRef.current = ''; // Reset ref for next turn
                           setUserTranscription('');
                        }

                        if (message.toolCall?.functionCalls) {
                            for (const fc of message.toolCall.functionCalls) {
                                switch(fc.name) {
                                    case 'captureFrameFor':
                                        handleCaptureFrame(fc.args.modality as ModalityCapture, fc.id, fc.name);
                                        break;
                                    case 'recordCoughSample':
                                        handleRecordCough(fc.id, fc.name);
                                        break;
                                    case 'triggerDiagnosis':
                                        stopSession();
                                        onEndConsultationWithData({ ...capturedData, ...fc.args } as PatientData);
                                        break;
                                }
                            }
                        }

                        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                            try {
                                const audioBuffer = await AudioUtils.decodeAudioData(AudioUtils.decode(audioData), outputAudioContext, 24000, 1);
                                const source = outputAudioContext.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputAudioContext.destination);
                                source.addEventListener('ended', () => sources.delete(source));
                                source.start(nextStartTime);
                                nextStartTime += audioBuffer.duration;
                                sources.add(source);
                            } catch (decodeError) {
                                console.error("Error decoding audio data:", decodeError);
                            }
                        }
                        
                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                            for (const source of sources.values()) {
                                source.stop();
                                sources.delete(source);
                            }
                            nextStartTime = 0;
                        }
                    },
                    onclose: (e: CloseEvent) => {
                        setStatusMessage('Session ended.');
                        setIsSessionActive(false);
                        setPermissionState('pending');
                        console.debug('Live session closed:', e);
                        if (audioContextRef.current) {
                            if (audioContextRef.current.input.state !== 'closed') audioContextRef.current.input.close();
                            if (audioContextRef.current.output.state !== 'closed') audioContextRef.current.output.close();
                            audioContextRef.current = null;
                        }
                        streamRef.current?.getTracks().forEach(track => track.stop());
                        if (videoRef.current) videoRef.current.srcObject = null;
                        processorRef.current?.disconnect();
                    },
                    onerror: (e: any) => {
                        console.error('Live session error:', e);
                        setStatusMessage(e.message || 'An error occurred during live session.');
                        setIsSessionActive(false);
                        if (audioContextRef.current) {
                            if (audioContextRef.current.input.state !== 'closed') audioContextRef.current.input.close();
                            if (audioContextRef.current.output.state !== 'closed') audioContextRef.current.output.close();
                            audioContextRef.current = null;
                        }
                        streamRef.current?.getTracks().forEach(track => track.stop());
                        if (videoRef.current) videoRef.current.srcObject = null;
                        processorRef.current?.disconnect();
                    }
                }
            });
        } catch (error: any) {
            console.error("Failed to start session:", error);
            const msg = error.message.includes("API_KEY") 
                ? error.message // Show the specific API key error from getAiClient
                : "Could not access camera/microphone. Please ensure permissions are granted.";
            setStatusMessage(msg);
            setPermissionState('denied');
            setIsSessionActive(false);
        }
    }, [isSessionActive, onEndConsultationWithData, capturedData, handleCaptureFrame, handleRecordCough, stopSession]);

    useEffect(() => {
        return () => {
            if (isSessionActive) stopSession();
        };
    }, [isSessionActive, stopSession]);

    const renderPreflightChecks = () => (
        <div className="flex flex-col items-center justify-center h-full text-center text-white bg-black/50 p-6 rounded-lg">
            <VideoIcon className="w-16 h-16 mb-4 text-teal-300"/>
            <h2 className="text-3xl font-bold mb-2">Live AI Diagnostic</h2>
            <p className="max-w-md mb-8 text-slate-300">The AI will guide you to capture patient symptoms directly via video for a live diagnosis. Allow camera and microphone access. Ensure your API key is set in the environment variables.</p>
            <button onClick={startSession} className="px-8 py-3 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-teal-500 hover:bg-teal-600 transform hover:scale-105">Start Video Diagnosis</button>
        </div>
    );
    
    interface EvidenceItemProps {
        modality: string;
        preview: string | undefined;
    }

    const EvidenceItem: React.FC<EvidenceItemProps> = ({ modality, preview }) => (
        <div className="flex flex-col items-center gap-1 w-20 text-center">
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center border-2 ${preview ? 'border-teal-400' : 'border-slate-500 border-dashed'} bg-black/30`}>
                {preview === 'recorded' ? <WaveformIcon className="w-8 h-8 text-teal-300" /> :
                 preview ? <img src={preview} alt={`${modality} preview`} className="w-full h-full object-cover rounded-md" /> :
                 modality === 'coughAudio' ? <WaveformIcon className="w-8 h-8 text-slate-400" /> :
                 <CameraIcon className="w-8 h-8 text-slate-400" />}
            </div>
            <p className="text-xs font-medium text-white truncate">{modality.replace('Photo', '').replace('coughAudio', 'Cough')}</p>
        </div>
    );

    const renderContent = () => {
        if (permissionState === 'pending') return renderPreflightChecks();
        if (permissionState === 'denied') return (
            <div className="flex flex-col items-center justify-center h-full text-center text-white bg-black/50 p-6 rounded-lg">
                <AlertTriangleIcon className="w-16 h-16 mb-4 text-red-400"/>
                <h2 className="text-3xl font-bold mb-2 text-red-400">Failed to Start</h2>
                <p className="max-w-md mb-8 text-slate-300">{statusMessage}</p>
                <button onClick={startSession} className="px-8 py-3 bg-slate-500 hover:bg-slate-600 rounded-md text-white">Try Again</button>
            </div>
        );

        return (
            <>
                {isCapturing && (
                    <div className="absolute inset-0 bg-white/30 z-40 flex items-center justify-center animate-pulse">
                        <p className="text-2xl font-bold text-white bg-black/50 px-4 py-2 rounded-lg">{isCapturing}</p>
                    </div>
                )}
                <header className="absolute top-4 left-4 right-4 z-30 p-3 rounded-lg bg-black/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <StethoscopeIcon className={`w-8 h-8 text-teal-300 ${isSessionActive ? 'animate-pulse-soft' : ''}`}/>
                        <div>
                            <h2 className="text-lg font-bold text-white">AI Doctor</h2>
                            <p className="text-sm text-slate-200">
                                {aiInstruction || currentAiSpeechChunk || statusMessage}
                                {currentAiSpeechChunk && <span className="ml-1 animate-pulse">...</span>}
                            </p>
                        </div>
                    </div>
                     {userTranscription && (
                        <div className="mt-2 text-right">
                            <p className="text-sm text-teal-100 italic">You: {userTranscription}<span className="ml-1 animate-pulse">...</span></p>
                        </div>
                    )}
                </header>
                
                <footer className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                     <div className="p-2 rounded-lg bg-black/50 backdrop-blur-sm">
                        <p className="text-sm font-semibold text-slate-300 mb-2 px-2">Captured Evidence</p>
                        <div className="flex justify-center items-start gap-2 overflow-x-auto pb-1">
                           {evidenceBarOrder.map(key => (
                               <EvidenceItem
                                   key={key}
                                   modality={key}
                                   preview={capturedPreviews[key]}
                               />
                           ))}
                        </div>
                    </div>
                    <button 
                        onClick={() => { stopSession(); onEndConsultation(); }}
                        className="w-full flex items-center justify-center gap-3 mt-4 py-3 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 transform hover:scale-105"
                    >
                        <XIcon className="w-6 h-6" />
                        End Consultation
                    </button>
                </footer>
            </>
        );
    };
    
    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col animate-fadeInUp">
            <video ref={videoRef} autoPlay playsInline muted className="absolute top-0 left-0 w-full h-full object-cover z-0"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10"></div>
            
            <div className="relative z-20 flex flex-col h-full">
                {renderContent()}
            </div>
        </div>
    );
};

export default LiveConsultationPage;
