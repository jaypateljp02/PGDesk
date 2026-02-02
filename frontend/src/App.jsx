import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import Residents from './pages/Residents';
import AddResident from './pages/AddResident';
import ResidentProfile from './pages/ResidentProfile';
import Rent from './pages/Rent';
import Food from './pages/Food';
import Settings from './pages/Settings';
import More from './pages/More';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Auth Route wrapper (redirect if already logged in)
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout with Bottom Nav & Sidebar
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Sidebar />
      <div className="lg:pl-64 min-h-screen transition-all duration-200">
        {children}
        <BottomNav />
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Rooms />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/rooms/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RoomDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/residents"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Residents />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/residents/add"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AddResident />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/residents/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ResidentProfile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/rent"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Rent />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/food"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Food />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/more"
        element={
          <ProtectedRoute>
            <AppLayout>
              <More />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
