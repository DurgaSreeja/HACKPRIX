import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const ScoreGraph = () => {
  const [scoreHistory, setScoreHistory] = useState([]);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/scores", {
          headers: { Authorization: token },
        });
        setScoreHistory(response.data);
      } catch (error) {
        console.error("Error fetching scores:", error);
        alert("Failed to fetch scores");
      }
    };

    fetchScores();
  }, []);

  // Prepare data for the chart
  const chartData = {
    labels: scoreHistory.map((entry) =>
      new Date(entry.timestamp).toLocaleDateString()
    ), // x-axis labels: dates
    datasets: [
      {
        label: "Mental Health Scores Over Time",
        data: scoreHistory.map((entry) => entry.score), // y-axis values: scores
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        tension: 0.4, // smooth curve
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: "Your Mental Health Scores History",
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `Score: ${tooltipItem.raw}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        title: {
          display: true,
          text: "Score",
        },
        min: 0,
        max: 100, // Assuming 150 is the maximum score
      },
    },
  };

  return (
    <div style={{ width: "80%", margin: "20px auto" }}>
      <h2>Mental Health Progress</h2>
      {scoreHistory.length > 0 ? (
        <Line data={chartData} options={chartOptions} />
      ) : (
        <p>No scores available to display. Please complete the assessment.</p>
      )}
    </div>
  );
};

export default ScoreGraph;
