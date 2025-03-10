import { useState } from 'react';
import { useWavelengths } from '../hooks/useSupabaseQuery';
import { useWavelength } from '../context/WavelengthContext';
import WavelengthCard from '../components/wavelength/WavelengthCard';

export default function Discover() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { tuneIn } = useWavelength();
  
  const { data: wavelengths, isLoading } = useWavelengths(
    selectedCategory === 'all' ? { limit: 20 } : { category: selectedCategory, limit: 20 }
  );
  
  const { data: categories = [] } = useWavelengths(
    {},
    {
      select: (data) => [...new Set(data.map(w => w.category))].sort(),
      staleTime: 1000 * 60 * 60, // Cache categories for 1 hour
    }
  );
  
  const handleTuneIn = async (wavelengthId) => {
    const { error } = await tuneIn(wavelengthId);
    if (error) {
      console.error('Error tuning in:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Discover Wavelengths</h1>
      
      {/* Category filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button 
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            selectedCategory === 'all' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-200 text-gray-800'
          }`}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </button>
        
        {categories.map(category => (
          <button
            key={category}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedCategory === category
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <p>Loading wavelengths...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wavelengths?.map(wavelength => (
            <WavelengthCard 
              key={wavelength.id} 
              wavelength={wavelength} 
              onTuneIn={handleTuneIn} 
            />
          ))}
        </div>
      )}
      
      {!isLoading && (!wavelengths || wavelengths.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">No wavelengths found for this category.</p>
        </div>
      )}
    </div>
  );
}