import { Link } from 'react-router-dom';
import { useWavelength } from '../../context/WavelengthContext';
import { useAuth } from '../../context/AuthContext';
import { Coffee, Code, Globe } from 'lucide-react';

const ICONS = {
  coffee: Coffee,
  code: Code,
  globe: Globe
};

export default function WavelengthCard({ wavelength, showTuneInButton = true }) {
  const { tuneIn, tuneOut } = useWavelength();
  const { user } = useAuth();
  
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

  const handleTuneIn = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    const { error } = await tuneIn(wavelength.id);
    if (error) console.error('Error tuning in:', error);
  };
  
  const handleTuneOut = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    const { error } = await tuneOut(wavelength.id);
    if (error) console.error('Error tuning out:', error);
  };

  const IconComponent = ICONS[wavelength.icon_type?.toLowerCase()] || Globe;

  return (
    <div 
      onClick={() => !showTuneInButton && handleTuneIn()}
      className="bg-white rounded-xl shadow-md p-5 flex items-center cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div 
        className="p-4 rounded-full mr-4" 
        style={{ 
          backgroundColor: `${wavelength.color}20`, 
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
      </div>
      
      {showTuneInButton && user && (
        <button
          onClick={wavelength.is_tuned_in ? handleTuneOut : handleTuneIn}
          className="px-4 py-2 bg-indigo-100 text-indigo-600 font-medium rounded-full text-sm hover:bg-indigo-200"
        >
          {wavelength.is_tuned_in ? 'Tune Out' : 'Tune In'}
        </button>
      )}
    </div>
  );
}