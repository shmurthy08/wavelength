import { useSupabaseQuery } from './useSupabaseQuery';
import { supabase } from '../lib/supabase';

export const useWavelengths = (filters = {}, options = {}) => {
  return useSupabaseQuery(
    ['wavelengths', filters],
    async () => {
      let query = supabase.from('wavelengths').select('*');
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    {
      staleTime: 1000 * 60 * 2, // 2 minutes
      ...options,
    }
  );
};

export const useUserWavelengths = (userId, options = {}) => {
  return useSupabaseQuery(
    ['user-wavelengths', userId],
    async () => {
      const { data, error } = await supabase
        .from('user_wavelengths')
        .select(`
          wavelength_id,
          active,
          wavelengths (*)
        `)
        .eq('user_id', userId)
        .eq('active', true);
        
      if (error) throw error;
      return data?.map(item => item.wavelengths) || [];
    },
    {
      enabled: !!userId,
      staleTime: 1000 * 60 * 1, // 1 minute
      ...options,
    }
  );
};

export const useWavelengthPosts = (wavelengthId, options = {}) => {
  return useSupabaseQuery(
    ['wavelength-posts', wavelengthId],
    async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:user_id(username, avatar_url)')
        .eq('wavelength_id', wavelengthId)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!wavelengthId,
      staleTime: 1000 * 30, // 30 seconds
      ...options,
    }
  );
};

export const useProfile = (userId, options = {}) => {
  return useSupabaseQuery(
    ['profile', userId],
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      return data;
    },
    {
      enabled: !!userId,
      staleTime: 1000 * 60 * 5, // 5 minutes
      ...options,
    }
  );
};