import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

interface WeeklyCheckin {
  paragraph: string;
  totalMood: number | null;
  totalSleepQuality: number | null;
  activityCount: string[] | null;
  totalAnxiety: number | null;
  totalStress: number | null;
}

interface UserDetails {
  name: string;
  email: string;
}

export const UserCheckIns = () => {
  const { userId } = useParams();
  const [checkin, setCheckin] = useState<WeeklyCheckin | null>(null);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await axios.get(
          `http://localhost:5000/api/users/${userId}`
        );
        const checkinResponse = await axios.get(
          `http://localhost:5000/api/weekly-checkins/${userId}`
        );

        setUser(userResponse.data);
        setCheckin(checkinResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          "We encountered an issue while loading your weekly check-in. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Fetch recommendations only when checkin is available
  useEffect(() => {
    if (checkin && checkin.paragraph) {
      const fetchRecommendations = async () => {
        const prompt = `Analyze the following user check-in data and provide personalized recommendations to improve mental health and reduce anxiety. 
        Based on this ${checkin.paragraph}, suggest evidence-based lifestyle adjustments, relaxation techniques, mindfulness practices, and any necessary improvements to sleep and stress management.
`;
        try {
          const response = await fetch("http://localhost:7000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: prompt }),
          });

          const data = await response.json();
          console.log(data);
          setRecommendations(data.text || "No recommendations available.");
        } catch (err) {
          console.error("Error fetching recommendations:", err);
          setRecommendations("Failed to fetch recommendations.");
        }
      };

      fetchRecommendations();
    }
  }, [checkin]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link
        to="/admin/users1"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-8"
      >
        <span>&larr;</span> Back to Users
      </Link>

      {user && (
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
            {user.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
        </div>
      )}

      {checkin && (
        <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Weekly Reflection
            </h2>
          </div>

          <p className="text-gray-700 dark:text-gray-300 text-center">
            {checkin.paragraph}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-indigo-100 dark:bg-indigo-900">
              <h3 className="font-medium text-indigo-700 dark:text-indigo-200">
                Average Mood
              </h3>
              <p className="text-2xl font-bold">
                {(checkin.totalMood ?? 0).toFixed(1)} / 5
              </p>
            </div>

            <div className="p-4 rounded-lg bg-purple-100 dark:bg-purple-900">
              <h3 className="font-medium text-purple-700 dark:text-purple-200">
                Sleep Quality
              </h3>
              <p className="text-2xl font-bold">
                {(checkin.totalSleepQuality ?? 0).toFixed(1)} / 5
              </p>
            </div>

            <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900">
              <h3 className="font-medium text-red-700 dark:text-red-200">
                Stress Level
              </h3>
              <p className="text-2xl font-bold">
                {(checkin.totalAnxiety ?? 0).toFixed(1)} / 5
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Top Activities
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {checkin.activityCount || "No activities logged this week."}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Recommendations
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {recommendations || "Loading recommendations..."}
            </p>
          </div>
        </div>
      )}
      <Link
        to={`/admin/users/graph/${userId}`}
        className="mt-6 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md"
      >
        View Graph
      </Link>
    </div>
  );
};
