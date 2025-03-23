'use client';

import { useAuth } from '@/context/AuthContext';
import AuthComponent from '@/components/Auth/AuthComponent';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthComponent />;
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Welcome to Wavelength</h1>
        {/* Room components will be added here */}
      </div>
    </main>
  );
}
