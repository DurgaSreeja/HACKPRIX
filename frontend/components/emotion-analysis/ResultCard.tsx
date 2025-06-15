import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface ResultCardProps {
  icon: LucideIcon;
  title: string;
  result: string | null;
  delay?: number;
}

export const ResultCard = ({
  icon: Icon,
  title,
  result,
  delay = 0,
}: ResultCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
      <p className="text-gray-600 dark:text-gray-300">
        {result || "Waiting for analysis..."}
      </p>
    </motion.div>
  );
};
