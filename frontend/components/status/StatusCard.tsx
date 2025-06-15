import React from "react";
import { motion } from "framer-motion";
import { LucideIcon, Loader2 } from "lucide-react";

interface StatusCardProps {
  title: string;
  icon: LucideIcon;
  status: string;
  result: string | null;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  icon: Icon,
  status,
  result,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "complete":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "recording":
      case "analyzing":
      case "transcribing":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "complete":
        return "Complete";
      case "error":
        return "Error";
      case "recording":
        return "Recording";
      case "analyzing":
        return "Analyzing";
      case "transcribing":
        return "Transcribing";
      case "pending":
        return "Pending";
      default:
        return "Idle";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor()}`}
        >
          <div className="flex items-center gap-1">
            {(status === "analyzing" ||
              status === "recording" ||
              status === "transcribing") && (
              <Loader2 className="w-3 h-3 animate-spin" />
            )}
            {getStatusText()}
          </div>
        </div>
      </div>

      {result && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          {result}
        </p>
      )}
    </motion.div>
  );
};
