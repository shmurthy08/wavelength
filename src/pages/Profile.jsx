import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useProfile, useUserWavelengths } from '../hooks/useWavelengthQueries';
import WavelengthCard from '../components/wavelength/WavelengthCard';

export default function Profile() {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  const { isLoading: profileLoading } = useProfile(user?.id, {
    onSuccess: (data) => {
      setUsername(data?.username || '');
      setBio(data?.bio || '');
      setAvatarUrl(data?.avatar_url || '');
    }
  });

  const { data: activeWavelengths, isLoading: wavelengthsLoading } = useUserWavelengths(user?.id);
  const userWavelengthHistory = [];

  const updateProfile = async () => {
    if (!user) return;
    
    setUpdating(true);
    try {
      // Update avatar if a new file was selected
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        newAvatarUrl = data.publicUrl;
      }
      
      // Update the profile record
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          bio,
          avatar_url: newAvatarUrl,
          updated_at: new Date(),
        });
        
      if (error) throw error;
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setAvatarFile(event.target.files[0]);
      setAvatarUrl(URL.createObjectURL(event.target.files[0]));
    }
  };

  if (profileLoading || wavelengthsLoading) {
    return <div className="flex justify-center items-center h-screen">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8 text-white">
          <h1 className="text-3xl font-bold">Your Profile</h1>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Edit Section */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 mr-4">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium cursor-pointer">
                    Change Avatar
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <button
                onClick={updateProfile}
                disabled={updating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {updating ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
            
            {/* Active Wavelengths Section */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-4">Your Active Wavelengths</h2>
              
              {activeWavelengths.length > 0 ? (
                <div className="space-y-4">
                  {activeWavelengths.map(wavelength => (
                    <div 
                      key={wavelength.id}
                      className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white p-4 rounded-lg"
                    >
                      <h3 className="font-bold">{wavelength.name}</h3>
                      <p className="text-sm opacity-90">{wavelength.description}</p>
                      <div className="flex justify-between mt-2 text-xs opacity-80">
                        <span>{wavelength.active_users_count} tuned in</span>
                        <span>Category: {wavelength.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  You're not currently tuned into any wavelengths.
                </p>
              )}
              
              <h2 className="text-xl font-semibold mt-8 mb-4">Wavelength History</h2>
              {userWavelengthHistory.length > 0 ? (
                <div className="space-y-2">
                  {userWavelengthHistory.map((item, index) => (
                    <div 
                      key={`${item.wavelength_id}-${index}`}
                      className="border border-gray-200 p-3 rounded-md"
                    >
                      <h3 className="font-medium">{item.wavelengths.name}</h3>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>{new Date(item.tuned_in_at).toLocaleDateString()}</span>
                        <span className={item.active ? 'text-green-600' : 'text-gray-500'}>
                          {item.active ? 'Active' : 'Past'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No wavelength history found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}