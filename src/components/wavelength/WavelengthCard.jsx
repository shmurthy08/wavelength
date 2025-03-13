import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useWavelength } from '../../hooks/useWavelength';
import { useAuth } from '../../context/AuthContext';
import { Coffee, Code, Globe } from 'lucide-react';

const ICONS = {
  coffee: Coffee,
  code: Code,
  globe: Globe
};

export default function WavelengthCard({ wavelength, showTuneInButton = true }) {
  const { tuneIn, tuneOut, canTuneIn } = useWavelength();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const formatExpiryTime = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `Ends in ${days}d`;
    if (hours > 0) return `${hours}h left`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m left`;
  };

  const handleTuneToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!canTuneIn(wavelength.id)) {
      setError('This wavelength has expired');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (wavelength.is_tuned_in) {
        await tuneOut(wavelength.id);
      } else {
        await tuneIn(wavelength.id);
      }
    } catch (err) {
      console.error('Error tuning in/out:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (e) => {
    // Only navigate if the click wasn't on the tune button
    if (!e.defaultPrevented) {
      navigate(`/wavelength/${wavelength.id}`);
    }
  };

  const IconComponent = ICONS[wavelength.icon_type?.toLowerCase()] || Globe;

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-center">
        <div 
          className="p-4 rounded-full mr-4" 
          style={{ 
            backgroundColor: `${wavelength.color || '#6366f1'}20`, 
            color: wavelength.color || '#6366f1'
          }}
        >
          <IconComponent size={24} />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{wavelength.name}</h3>
          <p className="text-gray-500">
            {wavelength.active_users_count} people tuned in • {formatExpiryTime(wavelength.expires_at)}
          </p>
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>
        
        {showTuneInButton && user && (
          <button
            onClick={handleTuneToggle}
            disabled={isLoading}
            className={`px-4 py-2 font-medium rounded-full text-sm transition-colors
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              ${wavelength.is_tuned_in 
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
              }`}
          >
            {isLoading ? 'Processing...' : wavelength.is_tuned_in ? 'Tune Out' : 'Tune In'}
          </button>
        )}
      </div>
    </div>
  );
}