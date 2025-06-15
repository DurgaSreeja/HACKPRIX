// src/components/emotion-analysis/ErrorDisplay.tsx
import React from "react";
import { X, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ErrorDisplayProps {
  error: string;
  onDismiss: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center justify-between"
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
      <button onClick={onDismiss}>
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
};
