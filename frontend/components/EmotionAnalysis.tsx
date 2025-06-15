import React, { useEffect, useRef, useState } from "react";
import { Camera, Mic, MessageSquare, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

interface AnalysisState {
  imageEmotion: string | null;
  voiceEmotion: string | null;
  chatResponse: string | null;
  error: string | null;
  stage: "initial" | "capturing" | "recording" | "analyzing" | "complete";
}

export const EmotionAnalysis = () => {
  const [state, setState] = useState<AnalysisState>({
    imageEmotion: null,
    voiceEmotion: null,
    chatResponse: null,
    error: null,
    stage: "initial",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef<string>("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    startProcess();
    return () => cleanup();
  }, []);

  const startProcess = async () => {
    setState(prev => ({ ...prev, stage: "capturing" }));
    await startCamera();
    setTimeout(captureImage, 3000);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: "Failed to access camera. Please ensure camera permissions are granted.",
        stage: "initial"
      }));
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    try {
      const blob = await new Promise<Blob>((resolve) => 
        canvasRef.current!.toBlob(blob => resolve(blob!), "image/jpeg")
      );

      const formData = new FormData();
      formData.append("file", blob, "capture.jpg");

      const response = await axios.post("http://localhost:7000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setState(prev => ({
        ...prev,
        imageEmotion: response.data.resopnse,
        stage: "recording"
      }));

      // Stop video stream
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;

      // Start voice recording
      startVoiceRecording();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: "Failed to analyze image",
        stage: "initial"
      }));
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Initialize speech recognition
      if ("webkitSpeechRecognition" in window) {
        recognitionRef.current = new webkitSpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          transcriptRef.current = Array.from(event.results)
            .map(result => result[0].transcript)
            .join("");
        };

        recognitionRef.current.start();
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.wav");

        try {
          setState(prev => ({ ...prev, stage: "analyzing" }));

          // Analyze voice emotion
          const audioResponse = await axios.post(
            "http://localhost:7000/analyze-audio",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" }
            }
          );

          // Get chat response based on transcript
          const chatResponse = await axios.post(
            "http://localhost:7000/chat",
            { text: transcriptRef.current }
          );

          setState(prev => ({
            ...prev,
            voiceEmotion: audioResponse.data.response,
            chatResponse: chatResponse.data.text,
            stage: "complete"
          }));
        } catch (err) {
          setState(prev => ({
            ...prev,
            error: "Failed to analyze voice or get chat response",
            stage: "complete"
          }));
        }

        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };

      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000); // Record for 5 seconds

    } catch (err) {
      setState(prev => ({
        ...prev,
        error: "Failed to start voice recording",
        stage: "initial"
      }));
    }
  };

  const cleanup = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const getStageMessage = () => {
    switch (state.stage) {
      case "initial":
        return "Starting analysis...";
      case "capturing":
        return "Capturing image in 3 seconds...";
      case "recording":
        return "Recording voice...";
      case "analyzing":
        return "Analyzing results...";
      case "complete":
        return "Analysis complete!";
      default:
        return "";
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
            {getStageMessage()}
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              {state.error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Preview (hidden but functional) */}
        <div className="hidden">
          <video ref={videoRef} playsInline muted />
          <canvas ref={canvasRef} />
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Image Emotion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Camera className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Image Emotion
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              {state.imageEmotion || "Analyzing..."}
            </p>
          </motion.div>

          {/* Voice Emotion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Mic className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Voice Emotion
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              {state.voiceEmotion || "Waiting for voice..."}
            </p>
          </motion.div>

          {/* Chat Response */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Response
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              {state.chatResponse || "Waiting for analysis..."}
            </p>
          </motion.div>
        </div>

        {/* Progress Indicator */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
            style={{
              width: (() => {
                switch (state.stage) {
                  case "initial": return "0%";
                  case "capturing": return "25%";
                  case "recording": return "50%";
                  case "analyzing": return "75%";
                  case "complete": return "100%";
                  default: return "0%";
                }
              })()
            }}
          />
        </div>
      </div>
    </div>
  );
};