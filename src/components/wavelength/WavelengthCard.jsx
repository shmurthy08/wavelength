import { Link } from 'react-router-dom';
import { useWavelength } from '../../context/WavelengthContext';
import { useAuth } from '../../context/AuthContext';

export default function WavelengthCard({ wavelength, showTuneInButton = true }) {
  const { tuneIn, tuneOut } = useWavelength();
  const { user } = useAuth();
  
  const formatExpiryTime = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diff = expiry - now;
    
    // If expired
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h left`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m left`;
    }
  };

  const handleTuneIn = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    const { error } = await tuneIn(wavelength.id);
    if (error) {
      console.error('Error tuning in:', error);
    }
  };
  
  const handleTuneOut = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    const { error } = await tuneOut(wavelength.id);
    if (error) {
      console.error('Error tuning out:', error);
    }
  };

  return (
    <Link 
      to={`/wavelength/${wavelength.id}`}
      className="block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
    >
      <div 
        className="h-2" 
        style={{ 
          background: `linear-gradient(90deg, rgba(99,102,241,${wavelength.intensity}) 0%, rgba(168,85,247,${wavelength.intensity}) 100%)` 
        }}
      ></div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold">{wavelength.name}</h3>
          <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
            {wavelength.category}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{wavelength.description}</p>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{wavelength.active_users_count} tuned in</span>
          <span>{formatExpiryTime(wavelength.expires_at)}</span>
        </div>
        
        {showTuneInButton && user && (
          <button 
            className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition"
            onClick={wavelength.is_tuned_in ? handleTuneOut : handleTuneIn}
          >
            {wavelength.is_tuned_in ? 'Tune Out' : 'Tune In'}
          </button>
        )}
      </div>
    </Link>
  );
}