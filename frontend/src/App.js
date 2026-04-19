import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ResourcesPage from './pages/ResourcesPage';
import PatientsPage from './pages/PatientsPage';
import AllocationsPage from './pages/AllocationsPage';
import SurgeriesPage from './pages/SurgeriesPage';
import EquipmentPage from './pages/EquipmentPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import PredictionsPage from './pages/PredictionsPage';
import FloorPlanPage from './pages/FloorPlanPage';
import './index.css';

// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Layout wrapper with sidebar
const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <main className="main-content">
      {children}
    </main>
  </div>
);

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/resources" element={
        <ProtectedRoute>
          <AppLayout><ResourcesPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/patients" element={
        <ProtectedRoute>
          <AppLayout><PatientsPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/allocations" element={
        <ProtectedRoute allowedRoles={['admin', 'reception']}>
          <AppLayout><AllocationsPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/surgeries" element={
        <ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse']}>
          <AppLayout><SurgeriesPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/equipment" element={
        <ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse']}>
          <AppLayout><EquipmentPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AppLayout><ReportsPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AppLayout><UsersPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/ai-predictions" element={
        <ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'reception']}>
          <AppLayout><PredictionsPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/floor-plan" element={
        <ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'reception']}>
          <AppLayout><FloorPlanPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  React.useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    
    socket.on('emergency_alert', (data) => {
      toast.error(`🚨 CODE BLUE: ${data.message}`, {
        position: "top-right",
        autoClose: false,
        theme: "colored",
      });
    });

    return () => socket.disconnect();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ToastContainer />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
