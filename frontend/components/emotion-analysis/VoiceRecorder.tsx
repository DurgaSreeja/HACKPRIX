import React, { useRef, useEffect } from "react";
import { Mic } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcript: string) => void;
  isFirstTime: boolean;
}

export const VoiceRecorder = ({
  onRecordingComplete,
  isFirstTime,
}: VoiceRecorderProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef<string>("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (isFirstTime) {
      startRecording();
    }
    return () => cleanup();
  }, [isFirstTime]);

  const cleanup = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      if ("webkitSpeechRecognition" in window) {
        recognitionRef.current = new webkitSpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          transcriptRef.current = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("");
        };

        recognitionRef.current.start();
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        onRecordingComplete(audioBlob, transcriptRef.current);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, 5000);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={startRecording}
      className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
      disabled={isFirstTime}
    >
      <Mic className="w-5 h-5" />
      {isFirstTime ? "Recording..." : "Start Recording"}
    </motion.button>
  );
};
