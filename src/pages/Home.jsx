import { useAuth } from '../context/AuthContext';
import { useWavelengths, useUserWavelengths } from '../hooks/useSupabaseQuery';
import WavelengthCard from '../components/wavelength/WavelengthCard';

export default function Home() {
  const { user } = useAuth();
  
  const { data: activeWavelengths, isLoading: userWavelengthsLoading } = useUserWavelengths(
    user?.id,
    { enabled: !!user }
  );
  
  const { data: trendingWavelengths, isLoading: trendingLoading } = useWavelengths(
    { limit: 5 },
    {
      select: (data) => data.sort((a, b) => b.active_users_count - a.active_users_count),
      staleTime: 1000 * 60 * 2, // Cache trending wavelengths for 2 minutes
    }
  );

  const isLoading = userWavelengthsLoading || trendingLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to Wavelength</h1>
      
      {/* User's active wavelengths */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Wavelengths</h2>
        {user ? (
          activeWavelengths?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeWavelengths.map((wavelength) => (
                <WavelengthCard 
                  key={wavelength.id} 
                  wavelength={wavelength}
                  showTuneInButton={false}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              You're not tuned into any wavelengths yet. Explore trending wavelengths below!
            </p>
          )
        ) : (
          <p className="text-gray-600">
            Sign in to tune into wavelengths and connect with others.
          </p>
        )}
      </div>
      
      {/* Trending wavelengths */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Trending Wavelengths</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingWavelengths?.map((wavelength) => (
            <WavelengthCard 
              key={wavelength.id} 
              wavelength={wavelength}
            />
          ))}
        </div>
      </div>
    </div>
  );
}