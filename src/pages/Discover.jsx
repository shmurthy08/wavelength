import { useState } from 'react';
import { Coffee, Code, Globe } from 'lucide-react';
import WavelengthCard from '../components/wavelength/WavelengthCard';
import { useWavelength } from '../hooks/useWavelength';
import { useQuery } from '@tanstack/react-query';

export default function Discover() {
  const [activeFilter, setActiveFilter] = useState('trending');
  const { fetchTrendingWavelengths, fetchWavelengthsByCategory } = useWavelength();

  const { data: wavelengths = [], isLoading } = useQuery({
    queryKey: ['wavelengths', activeFilter],
    queryFn: () => activeFilter === 'trending' 
      ? fetchTrendingWavelengths()
      : fetchWavelengthsByCategory(activeFilter),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Left sidebar - My Wavelengths */}
      <div className="hidden md:block md:col-span-3">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">My Wavelengths</h3>
          <ul className="space-y-2">
            <li className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Coffee className="text-orange-500 mr-2" size={18} />
              <span className="text-gray-700">Morning Coffee</span>
            </li>
            <li className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Code className="text-blue-500 mr-2" size={18} />
              <span className="text-gray-700">Coding Projects</span>
            </li>
            <li className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Globe className="text-green-500 mr-2" size={18} />
              <span className="text-gray-700">Weekend Hiking</span>
            </li>
          </ul>
          
          <div className="mt-4 pt-4 border-t">
            <button className="w-full p-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center justify-center">
              <span className="mr-2">+</span>
              Create Wavelength
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="col-span-1 md:col-span-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Discover Wavelengths</h1>
          <p className="text-gray-500">Find experiences happening right now</p>
        </div>

        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveFilter('trending')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeFilter === 'trending' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Trending
          </button>
          <button 
            onClick={() => setActiveFilter('for-you')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeFilter === 'for-you' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            For You
          </button>
          <button 
            onClick={() => setActiveFilter('creative')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeFilter === 'creative' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Creative
          </button>
          <button 
            onClick={() => setActiveFilter('outdoors')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeFilter === 'outdoors' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Outdoors
          </button>
          <button 
            onClick={() => setActiveFilter('tech')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeFilter === 'tech' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Tech
          </button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : wavelengths?.length > 0 ? (
            wavelengths.map(wavelength => (
              <WavelengthCard 
                key={wavelength.id} 
                wavelength={wavelength}
                showTuneInButton={true}
              />
            ))
          ) : (
            <div className="text-center py-8 bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-semibold text-gray-700">No wavelengths found</h3>
              <p className="text-gray-500 mt-2">
                Try a different category or check back later!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar - Suggestions */}
      <div className="hidden md:block md:col-span-3">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Suggested For You</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center justify-center text-center">
              <Coffee className="text-orange-400 mb-2" />
              <p className="font-medium text-sm">Early Birds</p>
              <p className="text-xs text-gray-500">156 people</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center justify-center text-center">
              <Code className="text-blue-500 mb-2" />
              <p className="font-medium text-sm">Weekend Projects</p>
              <p className="text-xs text-gray-500">89 people</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-semibold text-gray-700 mb-3">Trending Topics</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">#CoffeeTime</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">#TechTalk</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">#WFHLife</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">#CodeReview</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">#WeekendVibes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}