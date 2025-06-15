import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { GratitudeJournal } from "./components/gratitude/GratitudeJournal";
import { DailyCheckin } from "./components/DailyCheckin";
import { UserList } from "./components/admin/UserList";
import { UserCheckIns } from "./components/admin/UserCheckIns";
import { UserManagement } from "./components/admin/UserManagement";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { PhotoCapture } from "./components/PhotoCapture";
import { AiChat } from "./components/AiChat";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProfessionalChat } from "./components/chat/ProfessionalChat";
import { HiddenCapture } from "./components/HiddenCapture";
import { EmotionAnalysis } from "./components/emotion-analysis/EmotionAnalysis";
import MCQ from "./components/MCQ";
import ScoreGraph from "./components/ScoreGraph";
import VoiceEmotionRecognition from "./components/audio/VoiceEmotionRecognition";
import UserScoreGraph from "./components/UserScoreGraph";
import { UserGraphList } from "./components/UserGraphList";

const PrivateRoute = ({
  children,
  requiresProfessional = false,
}: {
  children: React.ReactNode;
  requiresProfessional?: boolean;
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiresProfessional && user?.role !== "professional") {
    return <Navigate to="/" />;
  }

  return children;
};

function AppContent() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {isAuthenticated && <Navbar />}
      <div className={isAuthenticated ? "pt-16" : ""}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/gratitude"
            element={
              <PrivateRoute>
                <GratitudeJournal />
              </PrivateRoute>
            }
          />
          <Route
            path="/voice"
            element={
              <PrivateRoute>
                <VoiceEmotionRecognition />
              </PrivateRoute>
            }
          />

          <Route
            path="/checkin"
            element={
              <PrivateRoute>
                <DailyCheckin />
              </PrivateRoute>
            }
          />

          <Route
            path="/photo"
            element={
              <PrivateRoute>
                <PhotoCapture />
              </PrivateRoute>
            }
          />

          <Route
            path="/ai-chat"
            element={
              <PrivateRoute>
                <AiChat />
              </PrivateRoute>
            }
          />

          <Route
            path="/Pchat"
            element={
              <PrivateRoute>
                <ProfessionalChat />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <PrivateRoute requiresProfessional>
                <UserManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/hidden"
            element={
              <PrivateRoute>
                <HiddenCapture />
              </PrivateRoute>
            }
          />
          <Route
            path="/emo"
            element={
              <PrivateRoute>
                <EmotionAnalysis />
              </PrivateRoute>
            }
          />
          <Route
            path="/mcq"
            element={
              <PrivateRoute>
                <MCQ />
              </PrivateRoute>
            }
          />
          <Route
            path="/graph"
            element={
              <PrivateRoute>
                <ScoreGraph />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users1"
            element={
              <PrivateRoute requiresProfessional>
                <UserList />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users2"
            element={
              <PrivateRoute requiresProfessional>
                <UserGraphList />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users/weekly-checkins/:userId"
            element={
              <PrivateRoute requiresProfessional>
                <UserCheckIns />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users/graph/:userId"
            element={
              <PrivateRoute requiresProfessional>
                <UserScoreGraph />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
