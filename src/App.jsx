import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WavelengthProvider } from './context/WavelengthContext';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import WavelengthView from './pages/WavelengthView';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import CreateWavelength from './pages/CreateWavelength';
import './App.css';

// Create React Query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disable automatic refetch when window regains focus
      retry: 1, // Only retry failed requests once
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes by default
      cacheTime: 1000 * 60 * 30, // Cache data for 30 minutes
    },
  },
});

// Protected route component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/signin" />;
  }
  
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WavelengthProvider>
          <Router>
            <Routes>
              <Route element={<MainLayout />}>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/wavelength/:wavelengthId" element={<WavelengthView />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/create" 
                  element={
                    <ProtectedRoute>
                      <CreateWavelength />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" />} />
              </Route>
            </Routes>
          </Router>
        </WavelengthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
