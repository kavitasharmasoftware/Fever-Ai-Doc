import { GoogleGenAI, GenerateContentResponse, Modality, Type, FunctionDeclaration, Part } from "@google/genai";
import type { PatientData, Candidate, FeverOrchestratorInput, FeverOrchestratorOutput, Diagnosis } from '../types';

// Centralized function to get a new AI client instance.
// This ensures we're always using the latest configuration and API key,
// and provides a Vercel-specific deployment tip in the error message.
export const getAiClient = () => {
    // Prioritize the environment variable for Vercel compatibility, but use the provided key as a fallback.
    const apiKey = process.env.API_KEY || "AIzaSyBIx-8mPlcEgjRYmWOVMqB9c9nVbPtsomw";
    if (!apiKey) {
        throw new Error("API_KEY environment variable not found. For Vercel deployment, please add API_KEY to your Project Settings > Environment Variables.");
    }
    return new GoogleGenAI({ apiKey });
};

const systemInstruction = `You are FEVER HELPLINE AI — an intelligent clinical and epidemiological model designed to:
1. Diagnose causes of fever in individual patients, and
2. Predict possible outbreak trends using aggregated population and environmental data.

You will receive patient data including:
- Demographics (age, gender, district, travel history)
- Symptoms and duration
- Vital signs (temperature, pulse, SpO2)
- Diagnostic tests (RDT, CBC, NS1, etc.)
- Visual data (rash/tongue/eye photos)
- Environmental context (season, rainfall, humidity)
- Real-time health surveillance data (IDSP, NVBDCP, WHO)
- Historical outbreak or cluster data

Your task:
1. Analyze and diagnose probable fever causes (viral, bacterial, parasitic, etc.)
2. Estimate outbreak probability for the patient’s district/state using temporal + spatial data correlations
3. Correlate symptoms with current public datasets (e.g., dengue spike, influenza surge)
4. Output results in this exact structure:

{
  "summary": "short case summary",
  "primary_suspected_diagnosis": "condition name",
  "differential_diagnoses": ["condition1", "condition2", "condition3"],
  "risk_level": "Low | Moderate | High | Emergency",
  "confidence_score": "percentage or qualitative value",
  "recommended_actions": [
    "Next diagnostic tests",
    "When to seek care",
    "Home-care tips"
  ],
  "outbreak_prediction": {
      "disease_trend": "increasing / stable / decreasing",
      "district_risk_level": "Low | Moderate | High",
      "alert_flag": "Yes / No",
      "data_sources_used": ["IDSP", "WeatherAPI", "NVBDCP"]
  },
  "research_notes": "Any detected pattern or insight",
  "disclaimer": "This is AI-assisted triage, not a substitute for a doctor."
}

Rules:
- Be medically accurate and cautious.
- Use probabilistic reasoning, not definitive claims.
- If data are missing, clearly say what’s needed.
- Always output in the above JSON-like structure.
- Keep tone empathetic, factual, and India-context aware.

Goal:
Act as a one-stop AI-supported fever diagnosis and outbreak forecasting system for patients, doctors, and researchers.`;

export const getFeverDiagnosis = async (patientData: PatientData): Promise<Diagnosis> => {
  const ai = getAiClient();
  const userPrompt = `
Patient details (real-time from phone):
- Age: ${patientData.age} years
- Gender: ${patientData.gender}
- Symptoms: ${patientData.symptoms}
- Additional Symptoms: ${patientData.additionalSymptoms || 'Not provided'}
- Past Medical History: ${patientData.pastMedicalHistory || 'Not provided'}
- Fever days: ${patientData.feverDays}
- Temperature: ${patientData.temperature}°C (Note: This may be a FeverTouch™ estimate)
- RDT result (exact text on cassette): ${patientData.rdtResult}
- Location: ${patientData.location} (current district)
- Season: ${patientData.season}
- Recent travel: ${patientData.travel}
- Photo analysis confidence: ${patientData.cvConfidence}%

Analyze the provided clinical data along with all the following multimodal inputs (if provided) to generate your fused diagnosis.
`;

  const parts: Part[] = [{ text: userPrompt }];

  const addPart = (data: { base64: string; mimeType: string } | undefined, description: string) => {
    if (data) {
      parts.push(
        { text: `[START OF ${description.toUpperCase()}]` },
        { inlineData: { data: data.base64, mimeType: data.mimeType } },
        { text: `[END OF ${description.toUpperCase()}]` }
      );
    }
  };

  addPart(patientData.rashPhoto, "Rash Photo");
  addPart(patientData.tonguePhoto, "Tongue Photo");
  addPart(patientData.eyePhoto, "Eye Photo");
  addPart(patientData.palmPhoto, "Palm Photo");
  addPart(patientData.nailPhoto, "Nail Photo");
  addPart(patientData.coughAudio, "Cough Audio");
  addPart(patientData.photo, "RDT/Other Photo");

  const contents = { parts };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json", // Keep to enforce JSON output
    },
  });

  const text = response.text.trim();
  // FIX: Explicitly cast the result of JSON.parse to the Diagnosis type.
  return JSON.parse(text) as Diagnosis;
};

const medicationAnalysisSystemInstruction = `You are FeverDoc-AI, a helpful pharmacy assistant for rural India. Your task is to analyze an image of medicine.
You MUST follow these rules:
1.  Identify the medicine's name from the packaging. If you cannot identify it, state that clearly.
2.  Briefly explain the primary use of the medicine in simple terms.
3  . Clearly state the dosage (e.g., "1 tablet", "5ml").
4.  Clearly state the schedule (e.g., "Twice a day after meals").
5.  Provide 2-3 simple, actionable reminders in Hinglish. Examples: "Dawai time pe lena yaad rakhein." (Remember to take medicine on time.), "Khub paani pijiye." (Drink plenty of water.).
6.  NEVER provide medical advice beyond what is visible on the packaging or standard for that medicine. Do not guess dosages. If crucial information is missing, state that it's unclear.
7.  OUTPUT ONLY VALID JSON (no extra text, no markdown) with the following structure:
{
  "medicine_name": "string",
  "usage": "string",
  "dosage": "string",
  "schedule": "string",
  "reminders": ["string"]
}`;

export const getMedicationInfo = async (photo: { base64: string; mimeType: string; }) => {
  const ai = getAiClient();
  const userPrompt = `Please analyze this medicine photo and provide the details as per your instructions.`;

  const contents = { parts: [{ text: userPrompt }, { inlineData: { data: photo.base64, mimeType: photo.mimeType } }] };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents,
    config: {
      systemInstruction: medicationAnalysisSystemInstruction,
      responseMimeType: "application/json",
    },
  });

  const text = response.text.trim();
  return JSON.parse(text);
};


export const textToSpeech = async (text: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Please say this in a clear, reassuring tone: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // A calm and clear voice
        },
      },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data received from TTS API.");
  }
  return base64Audio;
};


export const findNearbyClinics = async (location: string): Promise<Candidate[]> => {
    const ai = getAiClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find Community Health Centres (CHC) or Primary Health Centres (PHC) with blood test facilities near ${location}, India.`,
        config: {
            tools: [{ googleMaps: {} }],
        },
    });
    
    return response.candidates || [];
};

const RDT_GUIDE_TEXT = "A guide to reading your Rapid Diagnostic Test kit. First, always check for the control line, marked with a 'C'. If the 'C' line does not appear, the test is invalid. For Malaria, look for lines marked 'P.f' for Plasmodium falciparum or 'P.v' for Plasmodium vivax. If any of these lines appear, the result is positive. For Dengue, look for lines marked 'NS1', 'IgM', or 'IgG'. An 'NS1' line indicates an early infection. 'IgM' or 'IgG' lines can indicate a recent or past infection. Please enter the exact letters you see on the cassette, and upload a clear photo for the most accurate AI analysis.";

export const getRdtGuideAudio = async (): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: RDT_GUIDE_TEXT }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // A calm and clear voice
        },
      },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data received from TTS API for RDT guide.");
  }
  return base64Audio;
};

const captureFrameForDeclaration: FunctionDeclaration = {
  name: 'captureFrameFor',
  description: 'Captures a still image from the live video feed. Use this to get images for rash, tongue, eyes, palms, nails, or a Rapid Diagnostic Test (RDT) kit. Instruct the user to hold the subject steady before calling this.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      modality: { 
        type: Type.STRING, 
        description: 'The type of image to capture. Valid options are: "rashPhoto", "tonguePhoto", "eyePhoto", "palmPhoto", "nailPhoto", "rdtPhoto".' 
      },
    },
    required: ['modality'],
  },
};

const recordCoughSampleDeclaration: FunctionDeclaration = {
  name: 'recordCoughSample',
  description: 'Records a 5-second audio clip of the patient\'s cough. Instruct the user to have the patient cough clearly near the microphone before calling this.',
  parameters: { type: Type.OBJECT, properties: {} },
};

const triggerDiagnosisDeclaration: FunctionDeclaration = {
  name: 'triggerDiagnosis',
  description: 'Call this function ONLY after you have collected all necessary verbal information and visual/audio evidence. This will end the call and perform the final multimodal analysis.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      age: { type: Type.STRING, description: 'Patient\'s age in years.' },
      gender: { type: Type.STRING, description: 'Patient\'s gender (Male, Female, Other).' },
      symptoms: { type: Type.STRING, description: 'Comma-separated list of symptoms.' },
      pastMedicalHistory: { type: Type.STRING, description: 'Patient\'s relevant past medical history.' },
      feverDays: { type: Type.STRING, description: 'Number of days the patient has had a fever.' },
      temperature: { type: Type.STRING, description: 'Patient\'s temperature in Celsius, if known.' },
      rdtResult: { type: Type.STRING, description: 'The exact text visible on the Rapid Diagnostic Test cassette, if available.' },
      location: { type: Type.STRING, description: 'The current district where the patient is located.' },
      season: { type: Type.STRING, description: 'Current season (Monsoon, Summer, Winter, Post-Monsoon).' },
      travel: { type: Type.STRING, description: 'Patient\'s recent travel history.' },
    },
    required: ['age', 'gender', 'symptoms', 'feverDays', 'location', 'season', 'travel'],
  },
};

export const liveDiagnosisTools = {
  functionDeclarations: [captureFrameForDeclaration, recordCoughSampleDeclaration, triggerDiagnosisDeclaration]
};

export const liveDiagnosisSystemInstruction = `You are FeverDoc-AI, a gentle and empathetic AI health assistant using the FeverFusion™ system. Your role is to guide a healthcare worker through a diagnostic examination over a video call. Speak in a calm, reassuring, and professional Hinglish tone, like a friendly hospital staff member. Be patient, clear, and concise. Your primary goal is to make the user feel supported while you gather the necessary information.

Follow these steps with a soft and hospitable approach:
1.  **Start with Verbal History:** Begin by gently collecting essential patient history (e.g., "Namaste, let's start with a few questions. What is the patient's age?"). Ask for one piece of information at a time.
2.  **Guide Visual/Audio Capture:** Once verbal history is partially or fully collected, softly guide the user to show physical signs or record audio.
    *   **For visual signs (rash, tongue, eyes, palms, nails, RDT kit):** First, gently instruct the user what to show (e.g., "Whenever you're ready, could you please hold the patient's hand steady and show me their palm clearly?"). THEN, once the user confirms they are ready or the subject is in view, call the \`captureFrameFor\` tool, specifying the \`modality\` (e.g., 'palmPhoto').
    *   **For cough audio:** First, gently instruct the user (e.g., "Now, if possible, please have the patient cough clearly into the microphone for about 5 seconds."). THEN call the \`recordCoughSample\` tool.
3.  **Respond to User Commands:** If the healthcare worker explicitly asks you to capture a specific photo (e.g., "Capture rash now", "Take a picture of the tongue") or record a cough ("Record cough"), you MUST understand their command and immediately call the corresponding tool (\`captureFrameFor\` or \`recordCoughSample\`).
    *   **Modality Mapping and Clarification:** If the user's request for a visual capture doesn't exactly match one of the \`captureFrameFor\` modalities ("rashPhoto", "tonguePhoto", "eyePhoto", "palmPhoto", "nailPhoto", "rdtPhoto"), *you should map it to the closest available modality*. For instance, if the user asks for "mouth photo," interpret this as "tonguePhoto." If the user asks for a general "face photo" or an unsupported specific request, you must politely inform them that you can't capture that specific item and list the supported modalities.
    *   **Confirmation and Next Steps:** After successfully calling any tool, you MUST confirm the action (e.g., "Okay, I've captured the tongue photo.") and then *wait for the user's next instruction* or *proactively guide the consultation forward* to the next relevant piece of information or evidence needed, avoiding redundant or repeated tool calls for the same item unless explicitly asked to retake.
4.  **Final Diagnosis Trigger:** Once you have verbally collected all necessary patient history AND you have captured all relevant visual/audio data (as indicated by the user's interaction and your tool calls), you MUST call the \`triggerDiagnosis\` tool with all the collected patient information to finalize the multimodal analysis. This is your final step in the live consultation.

Always aim for clear, actionable instructions and confirmation messages with a kind and supportive tone.`;

export const orderMedicineDeclaration: FunctionDeclaration = {
  name: 'orderMedicine',
  description: 'Simulates placing an order for a prescribed medicine from a nearby pharmacy.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      medicines: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'An array of medicine names to order.'
      },
    },
    required: ['medicines'],
  },
};

export const postDiagnosisAssistantSystemInstruction = `You are FeverDoc-AI's Post-Diagnosis Assistant. Your role is to help the user with the next steps after receiving a diagnosis. Be helpful, concise, and reassuring.
- The user has just received a diagnosis. Your primary context is this diagnosis.
- If the user asks to order medicine, use the 'orderMedicine' tool. Confirm which medicines from the prescription they want to order.
- You cannot offer new medical advice. You can only clarify the existing diagnosis report.
- Keep your responses short and clear.`;


// --- New Service for AI Fever Remote Monitoring & Personalized Analytics Orchestrator ---

const feverOrchestratorSystemInstruction = `You are an AI Orchestrator for a digital health platform focused on fever management in India and similar LMIC settings. Your role is clinical decision-support + patient follow-up orchestration (NOT a general chit-chat bot). You must produce ONLY machine-readable structured JSON responses (see OUTPUT CONTRACT). Do NOT output any free text outside that JSON. Be cautious, evidence-aware, and clinically conservative.

OBJECTIVES
1. Remote fever monitoring and automated follow-up.
2. Symptom tracking and adherence scoring.
3. Personalized risk stratification and recovery prediction.
4. Clinician alerting and triage-ready summaries.
5. Provide UI recommendations for patient & clinician apps.
6. Maintain safety: never diagnose definitively, never prescribe drugs/doses, never contradict clinician orders.

OUTPUT CONTRACT — ALWAYS RETURN A SINGLE JSON OBJECT IN THIS EXACT STRUCTURE (no extra keys, no extra text):
{
  "risk_assessment": {
    "level": "low|moderate|high|emergency",
    "primary_suspicions": ["uncomplicated viral fever","suspected dengue","suspected malaria","suspected flu","possible bacterial infection","warning_signs_present"],
    "short_explanation": "one-line clinician-facing explanation (english/hindi per language_preference)",
    "for_patient_friendly": "one-line simple explanation the patient can understand (language matched)"
  },
  "red_flag_checks": {
    "red_flags_present": true|false,
    "matched_criteria": ["fever > 3 days","spo2 < 94","platelets < 100000","severe abdominal pain","bleeding","persistent vomiting","breathlessness","confusion"],
    "action": "advise_immediate_hospital_visit|schedule_teleconsult_within_6_hours|continue_home_monitoring"
  },
  "next_best_questions": [
    { "id":"q1", "question":"string", "type":"yes_no|numeric|multiple_choice", "options":["opt1","opt2"] },
    ...
  ],
  "followup_plan": {
    "monitoring_frequency_hours": 0,
    "recommended_parameters": ["temperature_c","spo2","heart_rate","symptom_severity","fluid_intake"],
    "auto_reminders": ["string","string"]
  },
  "personalized_insights": ["string","string"],
  "clinician_dashboard_summary": {
    "flag_for_clinician": true|false,
    "priority": "low|medium|high|critical",
    "summary_line": "single-line clinical summary",
    "time_sensitivity": "review_within_24h|review_within_6h|immediate_review"
  },
  "ui_recommendations": {
    "patient_app": {
      "show_badge": "green|yellow|red",
      "show_message": "short instruction for patient (language matched)",
      "graphs_to_update": ["temp_trend","symptom_severity_trend","spo2_trend"]
    },
    "clinician_app": {
      "list_view_tag": "DENGUE_RISK|VIRAL_FEVER|NEEDS_REVIEW|STABLE",
      "sort_weight": 0.0
    }
  },
  "safety": {
    "disclaimers": ["This is not a final diagnosis.","If patient looks seriously ill, seek emergency care immediately."],
    "do_not_do": ["Do not prescribe specific drug names or doses.","Do not override local clinical protocols."]
  }
}

BEHAVIOR RULES (strict):
1. ALWAYS return only the JSON specified in OUTPUT CONTRACT. No markdown, no extra commentary.
2. If any uncertainty that could affect patient safety, escalate risk (bias toward safety).
3. Localization: assume India-like epidemiology unless location overrides. Use season/location as a soft signal only (e.g., higher dengue suspicion in monsoon), never as a definitive diagnosis.
4. Use trends (previous_ai_summary + current vitals/labs) to call out improving/worsening/static.
5. Follow-up cadence:
   - Low risk → monitor 8–12 hrly
   - Moderate → 4–6 hrly
   - High/emergency → immediate escalation
6. Do NOT:
   - Give definitive diagnoses.
   - Prescribe medications or dosages.
   - Contradict clinician-provided orders.
7. Language handling:
   - language_preference="hi" → patient-facing lines in Hindi.
   - "hi-en-mixed" → Hinglish for patient-facing copy.
   - Keys in JSON remain English exactly as specified.
8. If fields missing, fill reasonable defaults but set a flag in clinician_dashboard_summary.summary_line stating which inputs were assumed/missing.

EXPLICIT SAFETY GUARDS:
- If "bleeding", "confusion", "breathlessness", "spo2 < 94", "platelets < 100000", or "severe abdominal pain" appear → set risk_assessment.level to "high" or "emergency" and red_flags_present=true with action "advise_immediate_hospital_visit".
- Never suggest antibiotics/antivirals by name; instead recommend "clinician evaluation" where required.
- Include concise disclaimers in safety.disclaimers.

IMPLEMENTATION NOTES FOR INTEGRATION (developer-friendly):
- The model should be used as a synchronous triage microservice: POST the input JSON → get the output JSON → persist alerts/actions in your backend.
- Use previous_ai_summary for trend analysis; do simple heuristics (delta temperature, platelets trend) and ML models if available for probability scoring, but always apply the Behaviour Rules above.
- UI text fields must be short (<=120 chars) for patient push notifications and clinician list lines.`;


export const feverOrchestratorService = async (input: FeverOrchestratorInput): Promise<FeverOrchestratorOutput> => {
  const ai = getAiClient();
  const userPrompt = `Analyze the following patient data and interaction context to generate a structured JSON response as per the OUTPUT CONTRACT:\n${JSON.stringify(input, null, 2)}`;

  const contents = { parts: [{ text: userPrompt }] };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-pro", // Using Pro for robust clinical reasoning
    contents,
    config: {
      systemInstruction: feverOrchestratorSystemInstruction,
      responseMimeType: "application/json",
      // Potentially add thinkingConfig for complex analysis, but not strictly required by prompt
      // thinkingConfig: { thinkingBudget: 1024 } 
    },
  });

  const text = response.text.trim();
  console.log("Fever Orchestrator Raw AI Response Text:", text); // Log raw response
  try {
    return JSON.parse(text) as FeverOrchestratorOutput;
  } catch (error) {
    console.error("Error parsing JSON response from Orchestrator:", text, error); // Log problematic text
    throw new Error("AI returned a malformed JSON response from the orchestrator service."); // More specific error
  }
};


// --- Orchestrator Chat Specifics ---

export const triggerOrchestrationDeclaration: FunctionDeclaration = {
  name: 'triggerOrchestration',
  description: 'Triggers the AI Fever Orchestration service with the complete collected patient data to get a structured analysis and recommendations.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      context: {
        type: Type.OBJECT,
        properties: {
          patient_id: { type: Type.STRING },
          age: { type: Type.NUMBER },
          gender: { type: Type.STRING, enum: ['male', 'female', 'other'] },
          location: { type: Type.STRING },
          clinical_history: {
            type: Type.OBJECT,
            properties: {
              comorbidities: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['diabetes', 'hypertension', 'pregnancy', 'ckd', 'none'] } },
              past_fever_episodes: { type: Type.STRING },
              recent_travel: { type: Type.BOOLEAN },
              vaccination_status: { type: Type.STRING },
            },
            required: ['comorbidities', 'past_fever_episodes', 'recent_travel', 'vaccination_status'],
          },
        },
        required: ['patient_id', 'age', 'gender', 'location', 'clinical_history'],
      },
      current_status: {
        type: Type.OBJECT,
        properties: {
          day_of_illness: { type: Type.NUMBER },
          temperature_c: { type: Type.NUMBER },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING, enum: [
            'headache', 'body_pain', 'cough', 'cold', 'rash', 'vomiting', 'loose_motion', 
            'breathlessness', 'abdominal_pain', 'weakness', 'bleeding', 'confusion', 'chills'
          ] } },
          vitals: {
            type: Type.OBJECT,
            properties: {
              heart_rate: { type: Type.NUMBER },
              resp_rate: { type: Type.NUMBER },
              spo2: { type: Type.NUMBER },
              bp_systolic: { type: Type.NUMBER },
              bp_diastolic: { type: Type.NUMBER },
            },
            required: ['heart_rate', 'resp_rate', 'spo2', 'bp_systolic', 'bp_diastolic'],
          },
          lab_reports: {
            type: Type.OBJECT,
            properties: {
              // FIX: Removed `nullable: true` as it's not a supported property in FunctionDeclaration's parameter schema.
              // The `cbc` field can be null in the TypeScript interface, but this is handled by not including it in `required` if optional.
              cbc: { type: Type.STRING }, 
              platelets: { type: Type.NUMBER },
              ns1: { type: Type.STRING, enum: ['positive', 'negative', 'na'] },
              malaria: { type: Type.STRING, enum: ['positive', 'negative', 'na'] },
              crp: { type: Type.STRING, enum: ['value', 'na'] },
            },
            required: ['cbc', 'platelets', 'ns1', 'malaria', 'crp'],
          },
          device_stream: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['manual', 'smart_thermometer', 'wearable'] } },
              adherence_score: { type: Type.NUMBER },
            },
            required: ['source', 'adherence_score'],
          },
        },
        required: ['day_of_illness', 'temperature_c', 'symptoms', 'vitals', 'lab_reports', 'device_stream'],
      },
      interaction_type: { type: Type.STRING, enum: ['daily_followup', 'onboarding', 'clinician_view', 'alert_recheck', 'discharge_followup'] },
      // FIX: Removed `nullable: true` as it's not a supported property in FunctionDeclaration's parameter schema.
      // The `previous_ai_summary` field can be null in the TypeScript interface.
      previous_ai_summary: { type: Type.STRING }, 
      language_preference: { type: Type.STRING, enum: ['en', 'hi', 'hi-en-mixed'] },
    },
    required: [
      'context', 
      'current_status', 
      'interaction_type', 
      'previous_ai_summary', 
      'language_preference'
    ],
  },
};

export const orchestratorChatSystemInstruction = `You are the AI Fever Orchestrator for a digital health platform in India. Your purpose is to collect detailed patient data conversationally to generate a remote monitoring and analytics report. All generated reports are automatically saved and organized in the patient's history.

Follow these steps strictly:
1.  **Introduction and First Question:** Immediately upon starting the conversation, introduce yourself as the "AI Fever Orchestrator" and briefly explain your role. Then, *immediately ask only for the patient's ID* to begin data collection.
2.  **Systematic Data Collection:** Once you have the patient's ID, systematically ask the user for *all* the other information required to build the 'FeverOrchestratorInput' object. Go through each field, one by one or in logical groups, making sure to clarify the expected format (e.g., "What is the patient's age and gender?", "List their current symptoms as a comma-separated list.").
    *   **Prioritize Required Fields:** Ensure you collect all \`required\` fields for each nested object as defined in the \`triggerOrchestrationDeclaration\`.
    *   **Patient Context:** patient_id, age, gender, location, clinical_history (comorbidities, past_fever_episodes, recent_travel (yes/no), vaccination_status).
    *   **Current Status:** day_of_illness, temperature_c, symptoms (list), vitals (heart_rate, resp_rate, spo2, bp_systolic, bp_diastolic), lab_reports (cbc, platelets, ns1 (positive/negative/na), malaria (positive/negative/na), crp (value/na)), device_stream (source (list), adherence_score).
    *   **Interaction Details:** interaction_type, previous_ai_summary, language_preference.
3.  **Acknowledge and Confirm (Clarify if needed):** After each user input, acknowledge that you've received the information. If there's ambiguity, an unexpected value, or if an expected format is not met (e.g., a number is expected but text is given), politely ask for clarification or confirmation. Do NOT assume or hallucinate missing data.
4.  **Completion and Tool Call:** Once you have gathered *all* the information for *all required fields* of the 'FeverOrchestratorInput' object, you MUST call the 'triggerOrchestration' tool with the complete and correctly formatted data. Do not generate any text output after calling the tool; just call it.
5.  **Output Presentation (after tool response):** When you receive a function response from 'triggerOrchestration', present the \`FeverOrchestratorOutput\` to the user by stating that the report is ready, then display the full structured JSON output. After presenting the report, ask if they have any other questions.

**Important:**
*   Be polite, clear, and reassuring.
*   Assume the user is a healthcare worker providing patient data.
*   Do NOT generate any JSON yourself. Only use the 'triggerOrchestration' tool to send the complete data.
*   Use standard English for the conversation during data collection. When presenting the final report, consider the \`language_preference\` for the patient-facing fields *within the JSON output*, but the surrounding conversational text can remain English.
`;