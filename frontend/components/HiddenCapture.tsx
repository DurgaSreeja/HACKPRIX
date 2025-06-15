import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, Camera, MessageSquare, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { StatusCard } from "./status/StatusCard";
import { AudioRecorder } from "./audio/AudioRecorder";

interface AnalysisStatus {
  image: {
    status: "pending" | "complete" | "error";
    result: string | null;
  };
  audio: {
    status: "idle" | "recording" | "analyzing" | "complete" | "error";
    result: string | null;
  };
  text: {
    status: "idle" | "transcribing" | "complete";
    result: string | null;
  };
}

export const HiddenCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    image: { status: "pending", result: null },
    audio: { status: "idle", result: null },
    text: { status: "idle", result: null },
  });
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let captureTimeout: NodeJS.Timeout;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          captureTimeout = setTimeout(capturePhoto, 5000);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setAnalysisStatus((prev) => ({
          ...prev,
          image: { status: "error", result: "Failed to access camera" },
        }));
      }
    };

    const capturePhoto = async () => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);

          canvasRef.current.toBlob(async (blob) => {
            if (blob) {
              const formData = new FormData();
              formData.append("file", blob, "photo.jpg");

              try {
                const response = await axios.post(
                  "http://localhost:7000/upload",
                  formData,
                  {
                    headers: { "Content-Type": "multipart/form-data" },
                  }
                );
                setAnalysisStatus((prev) => ({
                  ...prev,
                  image: {
                    status: "complete",
                    result: response.data.response || "No data",
                  },
                }));
                setShowAudioRecorder(true);
              } catch (error) {
                setAnalysisStatus((prev) => ({
                  ...prev,
                  image: { status: "error", result: "Analysis failed" },
                }));
              } finally {
                if (stream) {
                  stream.getTracks().forEach((track) => track.stop());
                }
              }
            }
          }, "image/jpeg");
        }
      }
    };

    startCamera();

    // Initialize speech recognition
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setAnalysisStatus((prev) => ({
          ...prev,
          text: { status: "complete", result: transcript },
        }));
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setAnalysisStatus((prev) => ({
          ...prev,
          text: { status: "idle", result: null },
        }));
      };
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (captureTimeout) {
        clearTimeout(captureTimeout);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setAnalysisStatus((prev) => ({
          ...prev,
          audio: { ...prev.audio, status: "analyzing" },
        }));

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.wav");

        try {
          const response = await axios.post(
            "http://localhost:7000/analyze-audio",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          setAnalysisStatus((prev) => ({
            ...prev,
            audio: { status: "complete", result: response.data.response },
          }));
        } catch (error) {
          setAnalysisStatus((prev) => ({
            ...prev,
            audio: { status: "error", result: "Failed to analyze audio" },
          }));
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAnalysisStatus((prev) => ({
        ...prev,
        audio: { ...prev.audio, status: "recording" },
        text: { ...prev.text, status: "transcribing" },
      }));

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      setAnalysisStatus((prev) => ({
        ...prev,
        audio: { status: "error", result: "Failed to start recording" },
      }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center max-w-3xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatusCard
                title="Image Analysis"
                icon={Camera}
                status={analysisStatus.image.status}
                result={analysisStatus.image.result}
              />
              <StatusCard
                title="Audio Analysis"
                icon={Volume2}
                status={analysisStatus.audio.status}
                result={analysisStatus.audio.result}
              />
              <StatusCard
                title="Speech to Text"
                icon={MessageSquare}
                status={analysisStatus.text.status}
                result={analysisStatus.text.result}
              />
            </div>

            {/* Display Predictions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 bg-white dark:bg-gray-800 shadow-md rounded-md"
            >
              <h2 className="text-lg font-semibold mb-4">Predictions</h2>
              {/* Image Prediction */}
              <div className="mb-6">
                <h3 className="text-md font-medium">Image Prediction:</h3>
                <p className="text-sm">
                  {analysisStatus.image.result || "No prediction yet."}
                </p>
              </div>
              {/* Audio Prediction */}
              <div className="mb-6">
                <h3 className="text-md font-medium">Audio Prediction:</h3>
                <p className="text-sm">
                  {analysisStatus.audio.result || "No prediction yet."}
                </p>
              </div>
              {/* Transcription */}
              <div>
                <h3 className="text-md font-medium">Transcription:</h3>
                <p className="text-sm">
                  {analysisStatus.text.result || "No transcription yet."}
                </p>
              </div>
            </motion.div>

            {/* Audio Recorder */}
            {showAudioRecorder && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <AudioRecorder
                  isRecording={isRecording}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Hidden elements */}
        <video ref={videoRef} style={{ display: "none" }} playsInline muted />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
};
