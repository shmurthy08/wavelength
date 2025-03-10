import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWavelength } from '../context/WavelengthContext';
import { useAuth } from '../context/AuthContext';

export default function CreateWavelength() {
  const navigate = useNavigate();
  const { createWavelength } = useWavelength();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('day');
  const [intensity, setIntensity] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const durationOptions = [
    { value: 'hour', label: '1 Hour', hours: 1 },
    { value: 'hours', label: '6 Hours', hours: 6 },
    { value: 'day', label: '1 Day', hours: 24 },
    { value: 'days', label: '3 Days', hours: 72 },
    { value: 'week', label: '1 Week', hours: 168 },
  ];
  
  const categoryOptions = [
    'Creative', 'Learning', 'Wellness', 'Entertainment', 
    'Productivity', 'Travel', 'Food', 'Tech', 'Music',
    'Reading', 'Sports', 'Gaming', 'Mindfulness', 'Social',
    'Nature', 'Professional', 'Events'
  ].sort();

  const calculateExpiryDate = (durationValue) => {
    const option = durationOptions.find(opt => opt.value === durationValue);
    const hours = option?.hours || 24;
    
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);
    
    return expiry;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/signin');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const expiresAt = calculateExpiryDate(duration);
      
      const wavelengthData = {
        name,
        description,
        category,
        expires_at: expiresAt.toISOString(),
        intensity: parseFloat(intensity),
      };
      
      const { data, error } = await createWavelength(wavelengthData);
      
      if (error || !data || !data.id) {
        throw new Error(error || 'Failed to create wavelength.');
      }
      
      // Navigate to the newly created wavelength
      navigate(`/wavelength/${data.id}`);
    } catch (err) {
      console.error('Error creating wavelength:', err);
      setError(err.message || 'Failed to create wavelength. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-white">
          <h1 className="text-3xl font-bold">Create a New Wavelength</h1>
          <p className="mt-2 opacity-90">
            Start a new experience channel for others to tune into
          </p>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Wavelength Name*
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Morning Coffee, Weekend Hiking"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description*
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe what this wavelength is about..."
              />
              <p className="mt-1 text-sm text-gray-500">
                {description.length}/200 characters
              </p>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category*
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Select a category</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration*
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                This wavelength will expire after this time period
              </p>
            </div>
            
            <div>
              <label htmlFor="intensity" className="block text-sm font-medium text-gray-700 mb-1">
                Intensity: {intensity}
              </label>
              <input
                type="range"
                id="intensity"
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                min="0.1"
                max="1"
                step="0.1"
                className="w-full dark:bg-gray-800 dark:text-white"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Subtle</span>
                <span>Moderate</span>
                <span>Vibrant</span>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-md hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Wavelength'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}