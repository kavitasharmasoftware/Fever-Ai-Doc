import type { ReactNode } from 'react'; // Keep ReactNode import if used elsewhere

// --- MultimodalAnalysis Component ---
// FIX: Remove React component definitions and related imports from types.ts.
// These components are defined in components/PatientForm.tsx.

type Modality = 'rashPhoto' | 'tonguePhoto' | 'eyePhoto' | 'palmPhoto' | 'nailPhoto' | 'coughAudio';


// FIX: Removed MultimodalAnalysis and PatientForm components, and PatientFormProps interface.
// They are correctly defined in `components/PatientForm.tsx`.

export type FeverFusionModality = 'rashPhoto' | 'tonguePhoto' | 'eyePhoto' | 'palmPhoto' | 'nailPhoto' | 'coughAudio';

export interface PatientData {
  age: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  symptoms: string;
  additionalSymptoms?: string;
  pastMedicalHistory: string;
  feverDays: string;
  temperature: string;
  rdtResult: string;
  location: string;
  season: 'Monsoon' | 'Summer' | 'Winter' | 'Post-Monsoon' | '';
  travel: string;
  cvConfidence: string;
  photo?: { // Used for RDT Photo
    base64: string;
    mimeType: string;
  };
  
  // FeverFusion Modalities
  rashPhoto?: { base64: string; mimeType: string; };
  tonguePhoto?: { base64: string; mimeType: string; };
  eyePhoto?: { base64: string; mimeType: string; };
  palmPhoto?: { base64: string; mimeType: string; };
  nailPhoto?: { base64: string; mimeType: string; };
  coughAudio?: { base64: string; mimeType: string; };
}

// New types for the updated Diagnosis structure
export type RiskLevel = "Low" | "Moderate" | "High" | "Emergency";
export type DiseaseTrend = "increasing" | "stable" | "decreasing";
export type AlertFlag = "Yes" | "No";

export interface OutbreakPrediction {
  disease_trend: DiseaseTrend;
  district_risk_level: RiskLevel;
  alert_flag: AlertFlag;
  data_sources_used: string[];
}

export interface Diagnosis {
  summary: string;
  primary_suspected_diagnosis: string;
  differential_diagnoses: string[];
  risk_level: RiskLevel; // Patient's individual risk level
  confidence_score: string; // e.g., "75%", "High"
  recommended_actions: string[];
  outbreak_prediction: OutbreakPrediction;
  research_notes: string;
  disclaimer: string;
  timestamp?: number;
}

// FIX: Make properties optional to align with @google/genai SDK types.
// This resolves a type mismatch when receiving data from the `findNearbyClinics` service.
export interface GroundingChunk {
  maps?: {
    uri?: string;
    title?: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export interface Candidate {
  groundingMetadata?: GroundingMetadata;
}

export interface MedicationInfo {
  medicine_name: string;
  usage: string;
  dosage: string;
  schedule: string;
  reminders: string[];
}

// --- New types for Disease Surveillance ---
export type AlertSeverity = 'Low' | 'Moderate' | 'High' | 'Critical';
export type FeverType = 'Dengue' | 'Malaria' | 'Typhoid' | 'Flu' | 'Chikungunya' | 'Other Viral';

export interface OutbreakAlert {
  id: string;
  district: string;
  feverType: FeverType;
  severity: AlertSeverity;
  detectionDate: string; // YYYY-MM-DD
  trigger: string; // e.g., "30% spike in cases above baseline", "Unusual climate pattern"
  recommendedAction: string;
}

export interface ClimateData {
  temperatureC: number;
  humidityPercent: number;
  rainfallMm: number;
}

export interface SurveillanceRegionData {
  id: string;
  name: string;
  currentCases: number;
  baselineCases: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  alertLevel: AlertSeverity;
  climate: ClimateData;
}

export interface OverallStats {
  totalActiveAlerts: number;
  regionsUnderHighAlert: number;
  averageCasesPerRegion: number;
  avgTemperatureC: number;
  avgHumidityPercent: number;
}

export interface WeeklyTrendPoint {
  week: string; // e.g., "Week 40"
  cases: number;
}

export interface WeeklyTrendData {
  overallFeverCases: WeeklyTrendPoint[];
  dengueCases: WeeklyTrendPoint[];
  malariaCases: WeeklyTrendPoint[];
}


// --- New types for AI Fever Remote Monitoring & Personalized Analytics Orchestrator (INPUT CONTRACT) ---

export type Comorbidity = "diabetes" | "hypertension" | "pregnancy" | "ckd" | "none";
export type PatientGender = "male" | "female" | "other";
export type Symptom = "headache" | "body_pain" | "cough" | "cold" | "rash" | "vomiting" | "loose_motion" | "breathlessness" | "abdominal_pain" | "weakness" | "bleeding" | "confusion" | "chills";
export type Ns1Result = "positive" | "negative" | "na";
export type MalariaResult = "positive" | "negative" | "na";
export type DeviceSource = "manual" | "smart_thermometer" | "wearable";
export type InteractionType = "daily_followup" | "onboarding" | "clinician_view" | "alert_recheck" | "discharge_followup";
export type LanguagePreference = "en" | "hi" | "hi-en-mixed";

export interface OrchestratorClinicalHistory {
  comorbidities: Comorbidity[];
  past_fever_episodes: string;
  recent_travel: boolean;
  vaccination_status: string;
}

export interface OrchestratorContext {
  patient_id: string;
  age: number;
  gender: PatientGender;
  location: string;
  clinical_history: OrchestratorClinicalHistory;
}

export interface OrchestratorVitals {
  heart_rate: number;
  resp_rate: number;
  spo2: number;
  bp_systolic: number;
  bp_diastolic: number;
}

export interface OrchestratorLabReports {
  cbc: string | null;
  platelets: number;
  ns1: Ns1Result;
  malaria: MalariaResult;
  crp: string | "na"; // "value" or "na"
}

export interface OrchestratorDeviceStream {
  source: DeviceSource[];
  adherence_score: number;
}

export interface OrchestratorCurrentStatus {
  day_of_illness: number;
  temperature_c: number;
  symptoms: Symptom[];
  vitals: OrchestratorVitals;
  lab_reports: OrchestratorLabReports;
  device_stream: OrchestratorDeviceStream;
}

export interface FeverOrchestratorInput {
  context: OrchestratorContext;
  current_status: OrchestratorCurrentStatus;
  interaction_type: InteractionType;
  previous_ai_summary: string | null;
  language_preference: LanguagePreference;
}

// --- New types for AI Fever Remote Monitoring & Personalized Analytics Orchestrator (OUTPUT CONTRACT) ---

export type RiskLevelOutput = "low" | "moderate" | "high" | "emergency";
export type PrimarySuspicion = "uncomplicated viral fever" | "suspected dengue" | "suspected malaria" | "suspected flu" | "possible bacterial infection" | "warning_signs_present";
export type RedFlagAction = "advise_immediate_hospital_visit" | "schedule_teleconsult_within_6_hours" | "continue_home_monitoring";
export type QuestionType = "yes_no" | "numeric" | "multiple_choice";
export type ClinicianPriority = "low" | "medium" | "high" | "critical";
export type TimeSensitivity = "review_within_24h" | "review_within_6h" | "immediate_review";
export type PatientAppBadge = "green" | "yellow" | "red";
export type ListViewTag = "DENGUE_RISK" | "VIRAL_FEVER" | "NEEDS_REVIEW" | "STABLE";

export interface OrchestratorRiskAssessment {
  level: RiskLevelOutput;
  primary_suspicions: PrimarySuspicion[];
  short_explanation: string;
  for_patient_friendly: string;
}

export interface OrchestratorRedFlagChecks {
  red_flags_present: boolean;
  matched_criteria: string[]; // Specific criteria matched
  action: RedFlagAction;
}

export interface OrchestratorNextBestQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
}

export interface OrchestratorFollowupPlan {
  monitoring_frequency_hours: number;
  recommended_parameters: string[]; // e.g., "temperature_c", "spo2"
  auto_reminders: string[];
}

export interface OrchestratorClinicianDashboardSummary {
  flag_for_clinician: boolean;
  priority: ClinicianPriority;
  summary_line: string;
  time_sensitivity: TimeSensitivity;
}

export interface OrchestratorPatientApp {
  show_badge: PatientAppBadge;
  show_message: string;
  graphs_to_update: string[]; // e.g., "temp_trend", "symptom_severity_trend"
}

export interface OrchestratorClinicianApp {
  list_view_tag: ListViewTag;
  sort_weight: number;
}

export interface OrchestratorUIRecommendations {
  patient_app: OrchestratorPatientApp;
  clinician_app: OrchestratorClinicianApp;
}

export interface OrchestratorSafety {
  disclaimers: string[];
  do_not_do: string[];
}

export interface FeverOrchestratorOutput {
  risk_assessment: OrchestratorRiskAssessment;
  red_flag_checks: OrchestratorRedFlagChecks;
  next_best_questions: OrchestratorNextBestQuestion[];
    followup_plan: OrchestratorFollowupPlan;
  personalized_insights: string[];
  clinician_dashboard_summary: OrchestratorClinicianDashboardSummary;
  ui_recommendations: OrchestratorUIRecommendations;
  safety: OrchestratorSafety;
}