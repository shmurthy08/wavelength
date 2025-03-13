import { useEffect } from 'react';
import { useWavelength } from '../hooks/useWavelength';
import WavelengthCard from '../components/wavelength/WavelengthCard';

export default function MyWavelengths() {
  const { activeWavelengths, fetchUserWavelengths, loading } = useWavelength();

  useEffect(() => {
    fetchUserWavelengths();
  }, [fetchUserWavelengths]);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">My Wavelengths</h1>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-4">
          {activeWavelengths.length > 0 ? (
            activeWavelengths.map(wavelength => (
              <WavelengthCard key={wavelength.id} wavelength={wavelength} showTuneInButton={false} />
            ))
          ) : (
            <div className="text-center py-8 bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-semibold text-gray-700">No wavelengths tuned in</h3>
              <p className="text-gray-500 mt-2">Tune into some wavelengths to see them here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
