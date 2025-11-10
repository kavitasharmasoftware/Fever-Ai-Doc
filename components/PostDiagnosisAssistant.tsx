import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Diagnosis } from '../types';
// FIX: Import `getAiClient` factory function instead of a non-existent `ai` instance.
import { getAiClient, postDiagnosisAssistantSystemInstruction, orderMedicineDeclaration } from '../services/geminiService';
import { BotIcon, SendIcon, PharmacyIcon } from './icons';
import { Chat } from '@google/genai';

interface PostDiagnosisAssistantProps {
  diagnosis: Diagnosis;
}

interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
}

const PostDiagnosisAssistant: React.FC<PostDiagnosisAssistantProps> = ({ diagnosis }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      // Updated summary based on new Diagnosis structure
      const diagnosisSummary = `The primary suspected diagnosis is ${diagnosis.primary_suspected_diagnosis} with a confidence score of ${diagnosis.confidence_score}. The overall patient risk level is ${diagnosis.risk_level}. Recommended actions include: ${diagnosis.recommended_actions.join(', ')}.`;
      
      // FIX: Instantiate the AI client using the factory function.
      const ai = getAiClient();
      const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: postDiagnosisAssistantSystemInstruction,
          // FIX: Restore orderMedicineDeclaration to tools array as indicated by system instruction.
          tools: [{ functionDeclarations: [orderMedicineDeclaration] }] 
        },
        history: [{ role: 'user', parts: [{ text: `Here is the patient's diagnosis context: ${diagnosisSummary}` }] }, { role: 'model', parts: [{ text: "Okay, I understand the diagnosis. How can I help?" }] }]
      });
      setChat(newChat);
      setHistory([{ role: 'model', text: "Okay, I understand the diagnosis. How can I help?" }]);
    };
    initChat();
  }, [diagnosis]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!chat || !messageText.trim()) return;

    const text = messageText.trim();
    setIsLoading(true);
    setHistory(prev => [...prev, { role: 'user', text }]);
    setUserInput('');

    try {
      const result = await chat.sendMessage({ message: text });
      let modelResponse = '';

      if (result.functionCalls && result.functionCalls.length > 0) {
        const fc = result.functionCalls[0];
        if (fc.name === 'orderMedicine') {
            // FIX: Check if medicines argument is a valid array before using it.
            const medicinesArg = fc.args.medicines;
            if (Array.isArray(medicinesArg)) {
              const medicines = medicinesArg.join(', ');
              modelResponse = `Simulating order for: ${medicines}. A local health worker will confirm the delivery.`;
              // FIX: Use the correct structure for sending a tool response back to the model in the Chat API.
              // The `sendMessage` method for `Chat` expects a `Content` object with role 'function' and a `functionResponse` part.
              await chat.sendMessage({
                role: 'function',
                parts: [{
                  functionResponse: {
                    name: fc.name,
                    id: fc.id, // Crucially use the ID from the model's function call
                    response: { result: `Order placed for ${medicines}` },
                  },
                }],
              });
            } else {
                modelResponse = "Sorry, I couldn't process the medicine order due to invalid data.";
            }
        }
      } else {
        modelResponse = result.text;
      }

      if (modelResponse) {
          setHistory(prev => [...prev, { role: 'model', text: modelResponse }]);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setHistory(prev => [...prev, { role: 'system', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [chat]);
  
  // Removed handleOrderMedicine function as prescribed_medication is no longer directly available
  // const handleOrderMedicine = () => {
  //   const medicineText = `Please order the prescribed medication for me: ${diagnosis.prescribed_medication.join(', ')}.`;
  //   handleSendMessage(medicineText);
  // };


  return (
    <div className="mt-8 bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        <BotIcon className="w-6 h-6 mr-2 text-teal-500" />
        Post-Diagnosis Assistant
      </h2>

      <div ref={chatContainerRef} className="h-64 overflow-y-auto bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <BotIcon className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />}
            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-teal-500 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'} ${msg.role === 'system' ? 'bg-red-100 text-red-800' : ''}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3">
                <BotIcon className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1 animate-pulse-soft" />
                <div className="max-w-xs md:max-w-md px-4 py-2 rounded-2xl bg-slate-200 text-slate-800 rounded-bl-none">
                    <div className="h-2 w-16 bg-slate-300 rounded animate-pulse"></div>
                </div>
            </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {/* Removed the "Order Prescribed Medicine" button as prescribed_medication is no longer a direct field */}
        {/* {diagnosis.prescribed_medication && diagnosis.prescribed_medication.length > 0 && (
            <button 
                onClick={handleOrderMedicine}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-full hover:bg-green-200 transition-colors disabled:bg-slate-200 disabled:text-slate-500"
            >
                <PharmacyIcon className="w-4 h-4" />
                Order Prescribed Medicine
            </button>
        )} */}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask a follow-up question..."
          disabled={isLoading}
          className="flex-grow px-4 py-2 bg-white text-slate-800 border border-slate-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
        />
        <button type="submit" disabled={isLoading} className="p-3 bg-teal-500 text-white rounded-full hover:bg-teal-600 disabled:bg-slate-400 transition-colors transform hover:scale-110">
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default PostDiagnosisAssistant;