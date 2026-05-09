import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import { useAuth } from './context/AuthContext';
import { BroadcastProvider } from './context/BroadcastContext';
import { ActiveJobProvider } from './context/ActiveJobContext';
import ActiveJobFloat from './components/ActiveJobFloat';
import RatingPrompt from './components/RatingPrompt';
import RegisterPage from './pages/RegisterPage';
import MechanicRegisterPage from './pages/MechanicRegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import MechanicDashboardPage from './pages/MechanicDashboardPage';
import HistoryPage from './pages/HistoryPage';
import AdminDashboardPage from "./pages/AdminDashboardPage";
import VehicleOnboardingPage from "./pages/VehicleOnboardingPage";
import ProblemsOnboardingPage from "./pages/ProblemsOnboardingPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import SOSWizardPage from './pages/SOSWizardPage';
import ProfilePage from './pages/ProfilePage';
import MechanicHistoryPage from './pages/MechanicHistoryPage';


function RootRedirect() {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'MECHANIC') return <Navigate to="/mechanic/dashboard" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <BroadcastProvider>
      <ActiveJobProvider>
      <ActiveJobFloat />
      <RatingPrompt />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/mechanic" element={<MechanicRegisterPage />} />

        {/* USER only */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['USER']}>
            <DashboardPage />
          </ProtectedRoute>
        } />

        {/* USER only */}
        <Route path="/history" element={
          <ProtectedRoute allowedRoles={['USER']}>
            <HistoryPage />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['USER']}>
            <ProfilePage />
          </ProtectedRoute>
        } />

        <Route path="/sos" element={
          <ProtectedRoute allowedRoles={['USER']}>
            <SOSWizardPage />
          </ProtectedRoute>
        } />

        {/* MECHANIC only */}
        <Route path="/mechanic/dashboard" element={
          <ProtectedRoute allowedRoles={['MECHANIC']}>
            <MechanicDashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/mechanic/profile" element={
          <ProtectedRoute allowedRoles={['MECHANIC']}>
            <ProfilePage />
          </ProtectedRoute>
        } />

        <Route path="/mechanic/history" element={
          <ProtectedRoute allowedRoles={['MECHANIC']}>
            <MechanicHistoryPage />
          </ProtectedRoute>
        } />

        <Route path="/mechanic/onboarding/vehicles" element={
          <ProtectedRoute allowedRoles={["MECHANIC"]}>
            <VehicleOnboardingPage />
          </ProtectedRoute>
        } />

        <Route path="/mechanic/onboarding/problems" element={
          <ProtectedRoute allowedRoles={["MECHANIC"]}>
            <ProblemsOnboardingPage />
          </ProtectedRoute>
        } />

        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/unauthorized" element={
          <div style={{ padding: '2rem' }}>
            <h2>Access Denied</h2>
            <p>You don't have permission to view this page</p>
            <a href="/dashboard">Go back</a>
          </div>
        } />

        <Route path="/" element={<RootRedirect />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Routes>
      </ActiveJobProvider>
      </BroadcastProvider>
    </BrowserRouter>
  )
}

export default App;