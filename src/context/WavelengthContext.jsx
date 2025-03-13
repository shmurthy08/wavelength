import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { WavelengthContext } from './wavelengthContext.base';

export function WavelengthProvider({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [wavelength, setWavelength] = useState(null);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to user's wavelength changes
    const wavelengthsSubscription = supabase
      .channel('wavelengths_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wavelengths',
      }, () => {
        queryClient.invalidateQueries(['wavelengths']);
        queryClient.invalidateQueries(['wavelength']);
      })
      .subscribe();

    // Subscribe to user's tuned-in status changes
    const userWavelengthsSubscription = supabase
      .channel('user_wavelengths_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_wavelengths',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries(['userWavelengths', user.id]);
        queryClient.invalidateQueries(['wavelength']);
        queryClient.invalidateQueries(['wavelengths']);
      })
      .subscribe();

    // Subscribe to posts changes
    const postsSubscription = supabase
      .channel('posts_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
      }, (payload) => {
        queryClient.invalidateQueries(['posts', payload.new?.wavelength_id]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(wavelengthsSubscription);
      supabase.removeChannel(userWavelengthsSubscription);
      supabase.removeChannel(postsSubscription);
    };
  }, [user, queryClient]);

  const fetchUserWavelengths = async () => {
    if (!user) return [];
    
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
          active_users_count,
          icon_type,
          color
        )
      `)
      .eq('user_id', user.id)
      .eq('active', true);
      
    if (error) throw error;
    return data?.map(item => ({
      ...item.wavelengths,
      is_tuned_in: true
    })) || [];
  };

  const fetchWavelength = async (id) => {
    // First get the wavelength data
    const { data: wavelength, error: wavelengthError } = await supabase
      .from('wavelengths')
      .select('*')
      .eq('id', id)
      .single();
      
    if (wavelengthError) throw wavelengthError;

    // If user is logged in, check if they're tuned in
    if (user) {
      const { data: userWavelength, error: userWavelengthError } = await supabase
        .from('user_wavelengths')
        .select('active')
        .eq('wavelength_id', id)
        .eq('user_id', user.id)
        .single();
        
      if (!userWavelengthError) {
        wavelength.is_tuned_in = userWavelength?.active || false;
      }
    }

    return wavelength;
  };

  const fetchTrendingWavelengths = async () => {
    const { data: wavelengths, error } = await supabase
      .from('wavelengths')
      .select('*')
      .order('active_users_count', { ascending: false })
      .limit(20);
      
    if (error) throw error;

    // If user is logged in, fetch their tuned-in status for these wavelengths
    if (user) {
      const { data: userWavelengths, error: userWavelengthError } = await supabase
        .from('user_wavelengths')
        .select('wavelength_id, active')
        .eq('user_id', user.id)
        .in('wavelength_id', wavelengths.map(w => w.id));

      if (!userWavelengthError && userWavelengths) {
        const tunedInMap = userWavelengths.reduce((acc, uw) => {
          acc[uw.wavelength_id] = uw.active;
          return acc;
        }, {});

        wavelengths = wavelengths.map(w => ({
          ...w,
          is_tuned_in: tunedInMap[w.id] || false
        }));
      }
    }

    return wavelengths;
  };

  const { data: activeWavelengths = [], isLoading: loadingUserWavelengths } = useQuery({
    queryKey: ['userWavelengths', user?.id],
    queryFn: fetchUserWavelengths,
    enabled: !!user,
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
  });

  const { data: wavelengthData, isLoading: loadingWavelength } = useQuery({
    queryKey: ['wavelength', wavelength?.id],
    queryFn: () => fetchWavelength(wavelength?.id),
    enabled: !!wavelength?.id,
    onSuccess: (data) => setWavelength(data),
    staleTime: 1000 * 30,
  });

  const tuneIn = useMutation({
    mutationFn: async (wavelengthId) => {
      if (!user) throw new Error('User not authenticated');
      
      // Check if wavelength exists and hasn't expired
      const { data: wavelength, error: wavelengthError } = await supabase
        .from('wavelengths')
        .select('expires_at')
        .eq('id', wavelengthId)
        .single();
        
      if (wavelengthError) throw wavelengthError;
      if (!wavelength) throw new Error('Wavelength not found');
      if (new Date(wavelength.expires_at) <= new Date()) {
        throw new Error('This wavelength has expired');
      }
      
      const { data: existing, error: existingError } = await supabase
        .from('user_wavelengths')
        .select('*')
        .eq('user_id', user.id)
        .eq('wavelength_id', wavelengthId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existing) {
        const { error } = await supabase
          .from('user_wavelengths')
          .update({ active: true, tuned_in_at: new Date().toISOString() })
          .eq('id', existing.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_wavelengths')
          .insert({
            user_id: user.id,
            wavelength_id: wavelengthId,
            active: true,
            tuned_in_at: new Date().toISOString(),
          });
          
        if (error) throw error;
      }

      await supabase.rpc('increment_active_users_count', { wavelength_id: wavelengthId });
    },
    onSuccess: (_, wavelengthId) => {
      queryClient.invalidateQueries(['userWavelengths', user?.id]);
      queryClient.invalidateQueries(['wavelength', wavelengthId]);
      queryClient.invalidateQueries(['wavelengths']);
    },
    onError: (error) => {
      console.error('Error tuning in:', error);
      throw error;
    }
  });

  const tuneOut = useMutation({
    mutationFn: async (wavelengthId) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('user_wavelengths')
        .update({ active: false })
        .eq('user_id', user.id)
        .eq('wavelength_id', wavelengthId);
        
      if (error) throw error;

      await supabase.rpc('decrement_active_users_count', { wavelength_id: wavelengthId });
    },
    onSuccess: (_, wavelengthId) => {
      queryClient.invalidateQueries(['userWavelengths', user?.id]);
      queryClient.invalidateQueries(['wavelength', wavelengthId]);
      queryClient.invalidateQueries(['wavelengths']);
    },
    onError: (error) => {
      console.error('Error tuning out:', error);
      throw error;
    }
  });

  const createPost = useMutation({
    mutationFn: async ({ wavelengthId, content }) => {
      if (!user) throw new Error('User not authenticated');
      if (!content.trim()) throw new Error('Post content is required');
      
      // Verify user is tuned into this wavelength
      const { data: userWavelength, error: userWavelengthError } = await supabase
        .from('user_wavelengths')
        .select('active')
        .eq('user_id', user.id)
        .eq('wavelength_id', wavelengthId)
        .single();
        
      if (userWavelengthError) throw new Error('You must be tuned in to post');
      if (!userWavelength?.active) throw new Error('You must be tuned in to post');
      
      const { data, error } = await supabase
        .from('posts')
        .insert({
          wavelength_id: wavelengthId,
          user_id: user.id,
          content: content.trim(),
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['posts', data.wavelength_id]);
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      throw error;
    }
  });

  const value = {
    activeWavelengths,
    wavelength: wavelengthData,
    loading: loadingUserWavelengths || loadingWavelength,
    fetchTrendingWavelengths,
    tuneIn,
    tuneOut,
    createPost,
    setActiveWavelength: (id) => setWavelength({ id }),
  };

  return (
    <WavelengthContext.Provider value={value}>
      {children}
    </WavelengthContext.Provider>
  );
}