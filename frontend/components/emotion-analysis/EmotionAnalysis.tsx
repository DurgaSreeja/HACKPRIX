// src/components/emotion-analysis/EmotionAnalysis.tsx
import React, { useState } from "react";
import { Camera, Mic, MessageSquare } from "lucide-react";
import axios from "axios";
import { CameraCap } from "./CameraCap";
import { VoiceRecorder } from "./VoiceRecorder";
import { ResultCard } from "./ResultCard";
import { LoadingPulse } from "./LoadingPulse";
import type { AnalysisState } from "./types";

export const EmotionAnalysis = () => {
  const [state, setState] = useState<AnalysisState>({
    imageEmotion: null,
    voiceEmotion: null,
    chatResponse: null,
    audioTone: null,
    error: null,
    stage: "initial",
    isLoading: true,
    isFirstVoiceRecording: true,
  });

  const handleImageCapture = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", blob, "capture.jpg");

      const response = await axios.post(
        "http://localhost:7000/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setState((prev) => ({
        ...prev,
        imageEmotion: response.data.resopnse,
        stage: "recording",
        isLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "Failed to analyze image",
        stage: "initial",
        isLoading: false,
      }));
    }
  };

  const handleVoiceRecording = async (audioBlob: Blob, transcript: string) => {
    setState((prev) => ({ ...prev, stage: "analyzing" }));

    const formData = new FormData();
    try {
      formData.append("audio", audioBlob, "recording.wav");
      try {
        const audiosent = await fetch(
          "https://52e9-34-126-145-71.ngrok-free.app/analyze-audio",
          {
            method: "POST",
            body: formData,
          }
        );
        const audiosentiment = await audiosent.json();
        if (audiosent.ok) {
          console.log("Top Emotion:", audiosentiment.top_emotion);
          let voice = "neutral";
          if (audiosentiment.top_emotion == "hap") {
            voice = "Happy";
          } else if (audiosentiment.top_emotion == "Ang") {
            voice = "Angry";
          } else if (audiosentiment.top_emotion == "sad") {
            voice = "Sad";
          }
          setState((prev) => ({
            ...prev,
            audioTone: voice,
            stage: "complete",
          }));
        } else {
          console.error("Error:", audiosentiment.error);
        }
      } catch (error) {
        console.error("Failed to send audio:", error);
      }

      // Fetch voice emotion and chat response concurrently
      const [audioResponse, chatResponse] = await Promise.all([
        state.isFirstVoiceRecording
          ? axios.post("http://localhost:7000/analyze-audio", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            })
          : Promise.resolve({ data: { response: state.voiceEmotion } }),
        axios.post("http://localhost:7000/chat", {
          text: `User transcript: "${transcript}"

          Detected Face Emotion: ${state.imageEmotion}  
          Detected Voice Emotion: ${state.voiceEmotion}  
          Detected Voice Tone : ${state.audioTone}
          Respond empathetically based on the user's emotions. If the user seems happy, match their enthusiasm. If they seem sad or anxious, respond with warmth and reassurance. If they are angry or frustrated, acknowledge their feelings and provide calming support. Maintain a natural and understanding tone in your response.
`,
        }),
      ]);

      setState((prev) => ({
        ...prev,
        voiceEmotion: audioResponse.data.response,
        chatResponse: chatResponse.data.text,
        isFirstVoiceRecording: false,
        stage: "complete",
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "Failed to process voice recording",
        stage: "complete",
      }));
    }
    try {
      const audiosent = await fetch(
        "https://1a64-34-126-145-71.ngrok-free.app/analyze-audio",
        {
          method: "POST",
          body: formData,
        }
      );
      const audiosentiment = await audiosent.json();
      if (audiosent.ok) {
        console.log("Top Emotion:", audiosentiment.top_emotion);
        setState((prev) => ({
          ...prev,
          audioTone: audiosentiment.top_emotion,
          stage: "complete",
        }));
      } else {
        console.error("Error:", audiosentiment.error);
      }
    } catch (error) {
      console.error("Failed to send audio:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Emotion Analysis
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {state.stage === "initial"
              ? "Starting analysis..."
              : state.stage === "capturing"
              ? "Capturing image in 3 seconds..."
              : state.stage === "recording"
              ? "Recording voice..."
              : state.stage === "analyzing"
              ? "Analyzing results..."
              : "Analysis complete!"}
          </p>
        </div>

        <CameraCap
          onCapture={handleImageCapture}
          onError={(error) =>
            setState((prev) => ({ ...prev, error, stage: "initial" }))
          }
        />

        {state.isLoading ? (
          <LoadingPulse />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <ResultCard
                icon={Camera}
                title="Image Emotion"
                result={state.imageEmotion}
              />
              <ResultCard
                icon={Mic}
                title="Voice Emotion"
                result={state.voiceEmotion}
                delay={0.1}
              />
              <ResultCard
                icon={Mic}
                title="Voice Tone"
                result={state.audioTone}
                delay={0.1}
              />
              <ResultCard
                icon={MessageSquare}
                title="AI Response"
                result={state.chatResponse}
                delay={0.2}
              />
            </div>

            {state.stage !== "initial" && state.stage !== "capturing" && (
              <div className="flex justify-center">
                <VoiceRecorder
                  onRecordingComplete={handleVoiceRecording}
                  isFirstTime={state.isFirstVoiceRecording}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
