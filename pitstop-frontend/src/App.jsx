import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MechanicRegisterPage from './pages/MechanicRegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import MechanicDashboardPage from './pages/MechanicDashboardPage';
import HistoryPage from './pages/HistoryPage';
import AdminDashboardPage from "./pages/AdminDashboardPage";

function App() {
  return (
    <BrowserRouter>
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

        {/* MECHANIC only */}
        <Route path="/mechanic/dashboard" element={
          <ProtectedRoute allowedRoles={['MECHANIC']}>
            <MechanicDashboardPage />
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

        <Route path="/" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;