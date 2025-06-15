import React, { useEffect, useRef, useState } from "react";
import { Camera, Mic, MessageSquare } from "lucide-react";
import axios from "axios";
import { LoadingPulse } from "./LoadingPulse";
import { ResultCard } from "./ResultCard";
import { VoiceRecorder } from "./VoiceRecorder";

interface AnalysisState {
  imageEmotion: string | null;
  voiceEmotion: string | null;
  chatResponse: string | null;
  isLoading: boolean;
  isFirstVoiceRecording: boolean;
  error: string | null;
}

export const EmotionAnalysis = () => {
  const [state, setState] = useState<AnalysisState>({
    imageEmotion: null,
    voiceEmotion: null,
    chatResponse: null,
    isLoading: true,
    isFirstVoiceRecording: true,
    error: null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    captureAndAnalyzeImage();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const captureAndAnalyzeImage = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Wait 3 seconds before capturing
        await new Promise((resolve) => setTimeout(resolve, 3000));

        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          const context = canvasRef.current.getContext("2d");
          context?.drawImage(videoRef.current, 0, 0);

          const blob = await new Promise<Blob>((resolve) =>
            canvasRef.current!.toBlob((blob) => resolve(blob!), "image/jpeg")
          );

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
            isLoading: false,
          }));
        }

        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "Failed to capture and analyze image",
        isLoading: false,
      }));
    }
  };

  const handleVoiceRecording = async (audioBlob: Blob, transcript: string) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    try {
      if (state.isFirstVoiceRecording) {
        // For first recording, analyze voice emotion
        const audioResponse = await axios.post(
          "http://localhost:7000/analyze-audio",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        setState((prev) => ({
          ...prev,
          voiceEmotion: audioResponse.data.response,
          isFirstVoiceRecording: false,
        }));
      }

      // Always get chat response for the transcript
      const chatResponse = await axios.post("http://localhost:7000/chat", {
        text: transcript,
      });

      setState((prev) => ({
        ...prev,
        chatResponse: chatResponse.data.text,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "Failed to process voice recording",
      }));
    }
  };

  if (state.isLoading) {
    return <LoadingPulse />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Emotion Analysis
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {state.isFirstVoiceRecording
              ? "Speak for 5 seconds to analyze your emotions"
              : "Click the microphone to start a new recording"}
          </p>
        </div>

        {/* Hidden video elements */}
        <div className="hidden">
          <video ref={videoRef} playsInline muted />
          <canvas ref={canvasRef} />
        </div>

        {/* Results Grid */}
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
            icon={MessageSquare}
            title="AI Response"
            result={state.chatResponse}
            delay={0.2}
          />
        </div>

        {/* Voice Recorder */}
        <div className="flex justify-center">
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecording}
            isFirstTime={state.isFirstVoiceRecording}
          />
        </div>
      </div>
    </div>
  );
};
