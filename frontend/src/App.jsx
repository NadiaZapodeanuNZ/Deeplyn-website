import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, TherapistRoute, ClientRoute } from './components/routing/ProtectedRoute';

import RoleRedirect from './components/routing/RoleRedirect';
import LandingPage from './pages/LandingPage';
import RegisterClient from './pages/Auth/RegisterClient';
import RegisterChoice from './pages/Auth/RegisterChoice';
import RegisterTherapist from './pages/Auth/RegisterTherapist';
import VerifyEmail from './pages/Auth/VerifyEmail';
import LoginPage from './pages/Auth/LoginPage';
import ForgotPassword from './pages/Auth/ForgotPassword';
import StatusPage from './pages/Auth/StatusForTherapist';
import TherapistProfile from './pages/Dashboard/Client/TherapistProfile'
import TherapistsList from './pages/Dashboard/Client/TherapistsList'

import TherapistLayout from './components/dashboard/Therapist/DashboardLayout';
import TherapistDashboard from './pages/Dashboard/Therapist/Dashboard';
import LoginWithLink from './pages/Auth/LoginWithLink';

import ClientLayout from './components/dashboard/Client/DashboardLayout';
import ClientDashboard from './pages/Dashboard/Client/Dashboard';
import JournalPage from './pages/Dashboard/Client/Journal';
import ResetPassword from './pages/Auth/ResetPassword';
import MyTherapistPage from './pages/Dashboard/Client/MyTherapist';
import DailyQuizPage from './pages/Dashboard/Client/DailyQuiz';

import MyClients from "./pages/Dashboard/Therapist/MyClients";
import ClientsPendingList from "./pages/Dashboard/Therapist/ClientsPendingList";
import ClientsJournal from "./pages/Dashboard/Therapist/ClientsJournal";
import DailyQuizClients from "./pages/Dashboard/Therapist/DailyQuizClients";
import Exercises from "./pages/Dashboard/Therapist/Exercises";
import ProgressClients from "./pages/Dashboard/Therapist/ProgressClients";

import NewDailyQuiz from "./pages/Dashboard/Therapist/NewDailyQuiz";
import SessionWithClient from "./pages/Dashboard/Therapist/SessionsWithClients";
import QuizManagement from "./pages/Dashboard/Therapist/QuizManagement";
import ClientsJournalList from "./pages/Dashboard/Therapist/ClientsJournalList";
import SettingsPage from './pages/Dashboard/Client/Settings';
import SettingsPage2 from './pages/Dashboard/Therapist/Settings';
import ClientExercises from './pages/Dashboard/Client/Exercises';
import ClientExerciseDetail from './pages/Dashboard/Client/ExerciseDetail';
import TherapistExercisesDashboard from './pages/Dashboard/Therapist/ExercisesDashboard';
import ClientProgress from './pages/Dashboard/Client/Progress';
function App() 
{
  return (
    <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/register/client" element={<RegisterClient />} />
    <Route path="/choice" element={<RegisterChoice />} />
    <Route path="/register/therapist" element={<RegisterTherapist />} />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/users/login/with-link" element={<LoginWithLink />} />
    <Route path="/users/reset-password" element={<ResetPassword />} />

    <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
    <Route path="/application-status" element={<ProtectedRoute><StatusPage /></ProtectedRoute>} />

    <Route path="/client/dashboard" element={<ClientRoute><ClientLayout><ClientDashboard /></ClientLayout></ClientRoute>} />
    <Route path="/client/journal" element={<ClientRoute><ClientLayout><JournalPage /></ClientLayout></ClientRoute>} />
    <Route path="/client/therapist" element={<ClientRoute><ClientLayout><TherapistsList /></ClientLayout></ClientRoute>} />
    <Route path="/client/daily-quiz" element={<ClientRoute><ClientLayout><DailyQuizPage /></ClientLayout></ClientRoute>} />
    <Route path="/client/exercises" element={<ClientRoute><ClientLayout><ClientExercises /></ClientLayout></ClientRoute>} />
    <Route path="/client/exercises/:id" element={<ClientRoute><ClientLayout><ClientExerciseDetail /></ClientLayout></ClientRoute>} />
    <Route path="/client/progress" element={<ClientRoute><ClientLayout><ClientProgress /></ClientLayout></ClientRoute>} />
    <Route path="/client/therapist/:id" element={<ClientRoute><ClientLayout><TherapistProfile /></ClientLayout></ClientRoute>} />
    <Route path="/client/my-therapist" element={<ClientRoute><ClientLayout><MyTherapistPage /></ClientLayout></ClientRoute>} />
    <Route path="/client/profile" element={<ClientRoute><ClientLayout><SettingsPage /></ClientLayout></ClientRoute>} />

    <Route path="/therapist/dashboard" element={<TherapistRoute><TherapistLayout><TherapistDashboard /></TherapistLayout></TherapistRoute>} />
    <Route path="/therapist/clients" element={<TherapistRoute><TherapistLayout><MyClients /></TherapistLayout></TherapistRoute>} />
    <Route path="/therapist/clients/pending" element={<TherapistRoute><TherapistLayout><ClientsPendingList /></TherapistLayout></TherapistRoute>} />
    <Route path="/therapist/clients/:clientId/journal" element={<TherapistRoute><TherapistLayout><ClientsJournal /></TherapistLayout></TherapistRoute>} />
    <Route path="/therapist/clients/:clientId/quiz" element={<TherapistRoute><TherapistLayout><DailyQuizClients /></TherapistLayout></TherapistRoute>} />
    <Route path="/therapist/exercises" element={<TherapistRoute><TherapistLayout><TherapistExercisesDashboard /></TherapistLayout></TherapistRoute>} />
    <Route path="/therapist/progress" element={<TherapistRoute><TherapistLayout><ProgressClients /></TherapistLayout></TherapistRoute>} />
    <Route path="/therapist/daily-quiz/new" element={<TherapistRoute><TherapistLayout><NewDailyQuiz /></TherapistLayout></TherapistRoute>} />
    <Route path="/therapist/sessions" element={<TherapistRoute><TherapistLayout><SessionWithClient /></TherapistLayout></TherapistRoute>} />
    <Route path="/therapist/quizzes" element={<TherapistRoute><TherapistLayout><QuizManagement /></TherapistLayout></TherapistRoute>} />
    <Route path="/therapist/journals" element={<TherapistRoute><TherapistLayout><ClientsJournalList /></TherapistLayout></TherapistRoute>} />
    <Route path="/therapist/profile" element={<TherapistRoute><TherapistLayout><SettingsPage2 /></TherapistLayout></TherapistRoute>} />
    
    <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
  );
}

export default App;