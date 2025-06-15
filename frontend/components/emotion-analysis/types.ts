// src/components/emotion-analysis/types.ts
export interface AnalysisState {
  imageEmotion: string | null;
  voiceEmotion: string | null;
  chatResponse: string | null;
  audioTone: string | null;
  isLoading: boolean;
  isFirstVoiceRecording: boolean;
  error: string | null;
  stage: "initial" | "capturing" | "recording" | "analyzing" | "complete";
}

export interface ResultCardProps {
  icon: LucideIcon;
  title: string;
  result: string | null;
  delay?: number;
}
