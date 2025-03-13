import { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const WavelengthContext = createContext();

export function WavelengthProvider({ children }) {
  const { user } = useAuth();
  const [activeWavelengths, setActiveWavelengths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wavelength, setWavelength] = useState(null);
  const [posts, setPosts] = useState([]);

  // Fetch wavelengths the user is tuned into
  const fetchUserWavelengths = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_wavelengths')
        .select(`
          wavelength_id,
          active,
          wavelengths (
            id,
            name,
            description,
            category,
            created_at,
            expires_at,
            intensity,
            active_users_count
          )
        `)
        .eq('user_id', user.id)
        .eq('active', true);

      if (error) throw error;
      
      setActiveWavelengths(data?.map(item => item.wavelengths) || []);
    } catch (err) {
      console.error('Error fetching user wavelengths:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single wavelength by ID
  const fetchWavelength = async (id) => {
    setLoading(true);
    try {
      // Fetch the wavelength data
      const { data: wavelengthData, error: wavelengthError } = await supabase
        .from('wavelengths')
        .select('*')
        .eq('id', id)
        .single();
      
      if (wavelengthError) throw wavelengthError;
      
      // Calculate relative time for expiry
      const expiry = new Date(wavelengthData.expires_at);
      const now = new Date();
      const diff = expiry - now;
      
      let timeRemaining = 'Expired';
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days > 0) {
          timeRemaining = `Ends in ${days}d`;
        } else {
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          if (hours > 0) {
            timeRemaining = `${hours}h left`;
          } else {
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            timeRemaining = `${minutes}m left`;
          }
        }
      }
      
      // Add the timeRemaining property to wavelength object
      wavelengthData.timeRemaining = timeRemaining;
      
      // Check if user is tuned in
      if (user) {
        const { data: userWavelength } = await supabase
          .from('user_wavelengths')
          .select('active')
          .eq('user_id', user.id)
          .eq('wavelength_id', id)
          .single();
        
        wavelengthData.is_tuned_in = !!userWavelength?.active;
      }
      
      setWavelength(wavelengthData);
      
      // Fetch posts for this wavelength
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, profiles:user_id(username, avatar_url)')
        .eq('wavelength_id', id)
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;
      setPosts(postsData || []);
      
      return { wavelength: wavelengthData, posts: postsData };
    } catch (err) {
      console.error('Error fetching wavelength:', err);
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Tune into a wavelength
  const tuneIn = async (wavelengthId) => {
    if (!user) return { error: 'User not authenticated' };
    
    try {
      // Check if user is already tuned in
      const { data: existing } = await supabase
        .from('user_wavelengths')
        .select('*')
        .eq('user_id', user.id)
        .eq('wavelength_id', wavelengthId)
        .single();

      if (existing) {
        // Update existing record to active
        const { error } = await supabase
          .from('user_wavelengths')
          .update({ active: true, tuned_in_at: new Date() })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_wavelengths')
          .insert({
            user_id: user.id,
            wavelength_id: wavelengthId,
            active: true,
            tuned_in_at: new Date()
          });
        
        if (error) throw error;
      }

      // Update active users count
      await supabase.rpc('increment_active_users_count', { wavelength_id: wavelengthId });
      
      // Refresh user wavelengths
      await fetchUserWavelengths();
      
      return { success: true };
    } catch (err) {
      console.error('Error tuning into wavelength:', err);
      return { error: err.message };
    }
  };

  // Tune out of a wavelength
  const tuneOut = async (wavelengthId) => {
    if (!user) return { error: 'User not authenticated' };
    
    try {
      const { error } = await supabase
        .from('user_wavelengths')
        .update({ active: false })
        .eq('user_id', user.id)
        .eq('wavelength_id', wavelengthId);
      
      if (error) throw error;

      // Update active users count
      await supabase.rpc('decrement_active_users_count', { wavelength_id: wavelengthId });
      
      // Refresh user wavelengths
      await fetchUserWavelengths();
      
      return { success: true };
    } catch (err) {
      console.error('Error tuning out of wavelength:', err);
      return { error: err.message };
    }
  };
  
  // Fetch trending wavelengths
  const fetchTrendingWavelengths = async (limit = 10) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wavelengths')
        .select('*')
        .order('active_users_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching trending wavelengths:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create a new wavelength
  const createWavelength = async (wavelengthData) => {
    // Ensure user and user.id exist
    if (!user || !user.id) return { error: 'User not authenticated' };
    
    try {
      const { data, error } = await supabase
        .from('wavelengths')
        .insert({
          ...wavelengthData,
          creator_id: user.id,
          active_users_count: 1
        })
        .select()
        .single();

      if (error) throw error;
      
      // Automatically tune in the creator
      await supabase
        .from('user_wavelengths')
        .insert({
          user_id: user.id,
          wavelength_id: data.id,
          active: true,
          tuned_in_at: new Date()
        });

      // Refresh user wavelengths
      await fetchUserWavelengths();
      
      return { data };
    } catch (err) {
      console.error('Error creating wavelength:', err);
      return { error: err.message };
    }
  };

  // Create a new post in a wavelength
  const createPost = async (wavelengthId, content) => {
    if (!user) return { error: 'User not authenticated' };
    if (!wavelengthId) return { error: 'Wavelength ID is required' };
    if (!content || content.trim() === '') return { error: 'Post content is required' };
    
    setLoading(true);
    try {
      // First check if user is tuned into this wavelength
      const { data: userWavelength } = await supabase
        .from('user_wavelengths')
        .select('active')
        .eq('user_id', user.id)
        .eq('wavelength_id', wavelengthId)
        .single();
      
      if (!userWavelength?.active) {
        return { error: 'You must be tuned into this wavelength to post' };
      }
      
      // Create the post
      const { data, error } = await supabase
        .from('posts')
        .insert({
          wavelength_id: wavelengthId,
          user_id: user.id,
          content,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Fetch the post with user details
      const { data: postWithUser, error: fetchError } = await supabase
        .from('posts')
        .select('*, profiles:user_id(username, avatar_url)')
        .eq('id', data.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update the posts state
      setPosts(prevPosts => [postWithUser, ...prevPosts]);
      
      return { success: true, post: postWithUser };
    } catch (err) {
      console.error('Error creating post:', err);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    activeWavelengths,
    wavelength,
    posts,
    loading,
    error,
    fetchUserWavelengths,
    fetchWavelength,
    tuneIn,
    tuneOut,
    fetchTrendingWavelengths,
    createWavelength,
    createPost,
  };

  return <WavelengthContext.Provider value={value}>{children}</WavelengthContext.Provider>;
}

export const useWavelength = () => {
  const context = useContext(WavelengthContext);
  if (context === undefined) {
    throw new Error('useWavelength must be used within a WavelengthProvider');
  }
  return context;
};