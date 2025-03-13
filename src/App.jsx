import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Discover from './pages/Discover';
import WavelengthView from './pages/WavelengthView';
import MyWavelengths from './pages/MyWavelengths';
import CreateWavelength from './pages/CreateWavelength';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Home from './pages/Home';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthContext';
import { WavelengthProvider } from './context/WavelengthContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      cacheTime: 1000 * 60 * 30, // Cache is kept for 30 minutes
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WavelengthProvider>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/wavelength/:wavelengthId" element={<WavelengthView />} />
              <Route path="/my-wavelengths" element={<MyWavelengths />} />
              <Route path="/create-wavelength" element={<CreateWavelength />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Router>
        </WavelengthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
