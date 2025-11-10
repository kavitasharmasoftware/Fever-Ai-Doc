import React, { useState, useCallback, useEffect, useRef } from 'react';
// FIX: Import `getAiClient` factory function instead of a non-existent `ai` instance.
import { getAiClient, feverOrchestratorService, orchestratorChatSystemInstruction, triggerOrchestrationDeclaration } from '../services/geminiService';
import type { FeverOrchestratorInput, FeverOrchestratorOutput } from '../types';
import { ArrowLeftIcon, ThermometerIcon, BotIcon, SendIcon } from './icons';
import Spinner from './Spinner';
import { Chat, Type } from '@google/genai';

interface FeverOrchestratorPageProps {
  onGoBack: () => void;
}

interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string | FeverOrchestratorOutput; // Allow output to be the structured object
  isJson?: boolean; // Flag to indicate if the text should be rendered as JSON
}

const initialOrchestratorInput: FeverOrchestratorInput = {
  context: {
    patient_id: '',
    age: 0,
    gender: 'male',
    location: '',
    clinical_history: {
      comorbidities: [],
      past_fever_episodes: '',
      recent_travel: false,
      vaccination_status: '',
    },
  },
  current_status: {
    day_of_illness: 0,
    temperature_c: 0,
    symptoms: [],
    vitals: {
      heart_rate: 0,
      resp_rate: 0,
      spo2: 0,
      bp_systolic: 0,
      bp_diastolic: 0,
    },
    lab_reports: {
      cbc: null,
      platelets: 0,
      ns1: 'na',
      malaria: 'na',
      crp: 'na',
    },
    device_stream: {
      source: [],
      adherence_score: 0,
    },
  },
  interaction_type: 'daily_followup', // Default
  previous_ai_summary: null,
  language_preference: 'en', // Default
};

const FeverOrchestratorPage: React.FC<FeverOrchestratorPageProps> = ({ onGoBack }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialisedRef = useRef(false); // Ref to prevent re-initializing chat

  // State to hold collected data for the orchestrator input
  const [currentOrchestratorInput, setCurrentOrchestratorInput] = useState<FeverOrchestratorInput>(initialOrchestratorInput);

  useEffect(() => {
    const initChat = async () => {
      if (isInitialisedRef.current) return; // Prevent re-initialization
      isInitialisedRef.current = true;

      setError(null);
      setHistory([]); // Clear history on re-init
      setCurrentOrchestratorInput(initialOrchestratorInput); // Reset data

      // FIX: Instantiate the AI client using the factory function.
      const ai = getAiClient();
      const newChat = ai.chats.create({
        model: 'gemini-2.5-pro', // Using Pro for robust reasoning
        config: {
          systemInstruction: orchestratorChatSystemInstruction,
          tools: [{ functionDeclarations: [triggerOrchestrationDeclaration] }],
        },
      });
      setChat(newChat);

      // Programmatically send an initial message to kickstart the AI's introduction
      // This ensures the system instruction is processed and the AI starts the conversation.
      setIsLoading(true);
      try {
        const initialAIMessage = await newChat.sendMessage({ message: "Start conversation." });
        setHistory(prev => [...prev, { role: 'model', text: initialAIMessage.text }]);
      } catch (err) {
        console.error("Error starting orchestrator chat:", err);
        setError("Failed to start the AI conversation. Please try again.");
        setHistory(prev => [...prev, { role: 'system', text: "Failed to start conversation. Please go back and try again." }]);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!chat || !messageText.trim() || isLoading) return;

    const userMessage = messageText.trim();
    setIsLoading(true);
    setHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setUserInput('');
    setError(null); // Clear previous errors on new message

    try {
      const result = await chat.sendMessage({ message: userMessage });
      let modelResponseText = '';

      if (result.functionCalls && result.functionCalls.length > 0) {
        for (const fc of result.functionCalls) {
          if (fc.name === 'triggerOrchestration') {
            const orchestrationInput = fc.args as FeverOrchestratorInput;
            setCurrentOrchestratorInput(orchestrationInput); // Store the AI-built input

            // Now, call the actual service with the collected data
            const serviceOutput = await feverOrchestratorService(orchestrationInput);
            
            // Send the service output back to the model as a tool response
            await chat.sendMessage({
              role: 'function',
              parts: [{
                functionResponse: {
                  name: fc.name,
                  id: fc.id, // Use the ID from the model's function call
                  response: { result: serviceOutput }, // Send the structured output
                },
              }],
            });

            // Display the structured output in the chat
            setHistory(prev => [...prev, { role: 'model', text: "Here is the AI Orchestrator's analysis and recommendations:", isJson: false }, { role: 'model', text: serviceOutput, isJson: true }]);
            // No need for modelResponseText here, as the output is explicitly handled above
            modelResponseText = "Do you have any further questions about this report or other patients?";

          } else {
            modelResponseText = `I received a tool call for an unknown function: ${fc.name}.`;
          }
        }
      } else {
        modelResponseText = result.text;
      }
      
      if (modelResponseText) {
        setHistory(prev => [...prev, { role: 'model', text: modelResponseText }]);
      }

    } catch (err: unknown) {
      console.error("Orchestrator Chat error:", err);
      let errorMessage: string;
      if (err instanceof Error) {
        errorMessage = `Sorry, I encountered an error: ${err.message}. Please try again or go back.`;
      } else if (typeof err === 'string') {
        errorMessage = `Sorry, I encountered an error: ${err}. Please try again or go back.`;
      } else {
        errorMessage = `Sorry, an unknown error occurred. Please try again or go back.`;
      }
      setError(errorMessage);
      setHistory(prev => [...prev, { role: 'system', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  }, [chat, isLoading]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/60 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 animate-fadeInUp">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onGoBack} className="flex items-center text-slate-600 hover:text-slate-800 transition-colors">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Back to Home</span>
        </button>
        <div className="flex items-center">
          <ThermometerIcon className="w-8 h-8 text-indigo-500" />
          <h1 className="text-3xl font-bold text-slate-800 ml-3">AI Fever Orchestrator</h1>
        </div>
      </div>

      <p className="text-slate-600 mb-6">Chat with the AI to collect patient data for remote monitoring and personalized analytics.</p>

      <div ref={chatContainerRef} className="h-96 overflow-y-auto bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-4 custom-scrollbar">
        {history.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && !msg.isJson && <BotIcon className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />}
            {msg.role === 'user' ? (
              <div className="max-w-xs md:max-w-md px-4 py-2 rounded-2xl bg-indigo-500 text-white rounded-br-none">
                <p className="text-sm">{msg.text as string}</p>
              </div>
            ) : msg.isJson ? (
              <div className="w-full bg-slate-100 p-3 rounded-lg border border-slate-200 shadow-sm animate-fadeInUp">
                <p className="text-xs font-semibold text-slate-700 mb-2">Orchestrator Report:</p>
                <pre className="whitespace-pre-wrap break-words text-xs text-slate-800 bg-slate-50 p-2 rounded custom-scrollbar max-h-60 overflow-y-auto">
                  {JSON.stringify(msg.text, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="max-w-xs md:max-w-md px-4 py-2 rounded-2xl bg-slate-200 text-slate-800 rounded-bl-none">
                <p className="text-sm">{msg.text as string}</p>
              </div>
            )}
            {msg.role === 'system' && (
              <div className="max-w-xs md:max-w-md px-4 py-2 rounded-2xl bg-red-100 text-red-800 rounded-bl-none">
                <p className="text-sm">{msg.text as string}</p>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3">
                <BotIcon className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1 animate-pulse-soft" />
                <div className="max-w-xs md:max-w-md px-4 py-2 rounded-2xl bg-slate-200 text-slate-800 rounded-bl-none">
                    <div className="h-2 w-16 bg-slate-300 rounded animate-pulse"></div>
                </div>
            </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your patient's details here..."
          disabled={isLoading}
          className="flex-grow px-4 py-2 bg-white text-slate-800 border border-slate-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
        <button type="submit" disabled={isLoading} className="p-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:bg-slate-400 transition-colors transform hover:scale-110">
          <SendIcon className="w-5 h-5" />
        </button>
      </form>

      {error && (
        <div className="mt-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  );
};

export default FeverOrchestratorPage;