import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import './App.css';

// Components
import Navbar from './components/Navbar';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import SearchDashboard from './pages/client/SearchDashboard';
import FactoryDashboard from './pages/factory/FactoryDashboard';
import FactoryProfileSetup from './pages/factory/FactoryProfileSetup';
import AdminDashboard from './pages/admin/AdminDashboard'; // Import new Admin Dashboard
import Messages from './pages/chat/Messages';
import WorkOrders from './pages/orders/WorkOrders';

// Private Route Handlers
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

function AppRoutes() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          {/* Client Routes */}
          <Route
            path="/client/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CLIENT', 'FACTORY']}>
                <SearchDashboard />
              </ProtectedRoute>
            }
          />

          {/* Chat Routes */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute allowedRoles={['CLIENT', 'FACTORY', 'ADMIN']}>
                <Messages />
              </ProtectedRoute>
            }
          />

          {/* Work Orders Routes */}
          <Route
            path="/work-orders"
            element={
              <ProtectedRoute allowedRoles={['CLIENT', 'FACTORY']}>
                <WorkOrders />
              </ProtectedRoute>
            }
          />

          {/* Factory Routes */}
          <Route
            path="/factory/dashboard"
            element={
              <ProtectedRoute allowedRoles={['FACTORY']}>
                <FactoryDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/factory/setup"
            element={
              <ProtectedRoute allowedRoles={['FACTORY']}>
                <FactoryProfileSetup />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
