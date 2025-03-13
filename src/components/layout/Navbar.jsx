import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Globe, Search, User, PlusCircle, MessageCircle, Home } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <>
      <nav className="bg-white shadow-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo and brand name */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Globe className="text-indigo-600" size={24} />
                <span className="font-bold text-xl text-indigo-600">Wavelength</span>
              </Link>
              
              <div className="hidden md:flex space-x-4 ml-4">
                <Link to="/discover" className="px-3 py-2 text-gray-600 hover:text-indigo-600 font-medium">
                  Discover
                </Link>
                <Link to="/" className="px-3 py-2 text-gray-600 hover:text-indigo-600">
                  My Wavelengths
                </Link>
                <Link to="/notifications" className="px-3 py-2 text-gray-600 hover:text-indigo-600">
                  Notifications
                </Link>
              </div>
            </div>

            {/* Search and User section */}
            <div className="flex items-center">
              <div className="relative mr-4 hidden md:block">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search wavelengths..."
                  className="w-64 p-2 pl-10 rounded-full bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {user ? (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link to="/signin" className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    Sign In
                  </Link>
                  <Link to="/signup" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile navigation footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around p-3 z-50">
        <Link
          to="/"
          className={`p-2 rounded-full ${isActive('/') ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <Home size={24} />
        </Link>
        
        <Link
          to="/discover"
          className={`p-2 rounded-full ${isActive('/discover') ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <Globe size={24} />
        </Link>
        
        <Link 
          to="/create"
          className="p-3 rounded-full bg-indigo-600 text-white shadow-lg"
        >
          <PlusCircle size={24} />
        </Link>
        
        <Link
          to="/messages"
          className={`p-2 rounded-full ${isActive('/messages') ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <MessageCircle size={24} />
        </Link>
        
        <Link
          to="/profile"
          className={`p-2 rounded-full ${isActive('/profile') ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <User size={24} />
        </Link>
      </div>
    </>
  );
}