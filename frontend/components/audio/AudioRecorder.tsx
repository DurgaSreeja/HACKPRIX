import React from "react";
import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";

interface AudioRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
}) => {
  return (
    <div className="flex flex-col items-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={`p-8 rounded-full ${
          isRecording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-indigo-600 hover:bg-indigo-700"
        } transition-colors`}
      >
        {isRecording ? (
          <Square className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </motion.button>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        {isRecording ? "Click to stop recording" : "Click to start recording"}
      </p>
    </div>
  );
};
