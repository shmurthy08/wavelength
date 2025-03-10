import { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const WavelengthContext = createContext();

export function WavelengthProvider({ children }) {
  const { user } = useAuth();
  const [activeWavelengths, setActiveWavelengths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const value = {
    activeWavelengths,
    loading,
    error,
    fetchUserWavelengths,
    tuneIn,
    tuneOut,
    fetchTrendingWavelengths,
    createWavelength,
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