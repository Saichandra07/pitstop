import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path = "/register" element={<RegisterPage/>}/>

        {/* Any logged-in user */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage/>
            </ProtectedRoute>
        }/>
        
        {/* Catch-all for unauthorized access */}
        <Route path="/unauthorized" element={
          <div style={{padding: '2rem'}}>
            <h2>Access Denied</h2>
            <p>You don't have permission to view this page</p>
            <a href="/dashboard">Go back</a>
          </div>
        }/>

      {/* Redirect root to dashboard */}
      <Route path="/" element={<LoginPage />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App;