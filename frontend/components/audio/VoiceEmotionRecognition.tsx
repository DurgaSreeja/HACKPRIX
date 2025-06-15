import React, { useState, useRef } from "react";
import axios from "axios";

const VoiceEmotionRecognition: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [emotion, setEmotion] = useState<string>("");
  const [error, setError] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = () => {
    setEmotion("");
    setError("");
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.wav");

          axios
            .post("http://localhost:7000/analyze-audio", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
            .then((response) => {
              setEmotion(response.data.response);
            })
            .catch((err) => {
              console.error("Error:", err);
              setError("Failed to analyze audio");
            });
        };

        mediaRecorder.start();
        setIsRecording(true);
      })
      .catch((err) => {
        console.error("Microphone access denied:", err);
        setError("Microphone access denied");
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Voice Emotion Recognition</h1>
      <p className="text-gray-600 mb-6">
        Record your voice and find out the emotion!
      </p>
      <button
        className={`px-6 py-3 rounded-full font-semibold text-white ${
          isRecording ? "bg-red-500" : "bg-green-500"
        } hover:opacity-80 transition`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>

      {emotion && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-2xl font-semibold text-center text-blue-600">
            Emotion Detected:
          </h2>
          <p className="text-xl text-center text-gray-800 mt-2">{emotion}</p>
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-100 text-red-700 border border-red-400 rounded p-4">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceEmotionRecognition;
