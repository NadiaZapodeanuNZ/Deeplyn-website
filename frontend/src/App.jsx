import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, TherapistRoute } from './components/routing/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import RegisterClient from './pages/Auth/RegisterClient';
import RegisterChoice from './pages/Auth/RegisterChoice';
import RegisterTherapist from './pages/Auth/RegisterTherapist';
import VerifyEmail from './pages/Auth/VerifyEmail';
import LoginPage from './pages/Auth/LoginPage';
import ForgotPassword from './pages/Auth/ForgotPassword';
import StatusPage from './pages/Auth/StatusForTherapist';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register/client" element={<RegisterClient />} />
      <Route path="/choice" element={<RegisterChoice />} />
      <Route path="/register/therapist" element={<RegisterTherapist />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/application-status" element={
        <ProtectedRoute>
          <StatusPage />
        </ProtectedRoute>
      } />


      <Route path="/dashboard" element={
        <TherapistRoute>
          <LandingPage />
        </TherapistRoute>
      } />
    </Routes>
  );
}

export default App;