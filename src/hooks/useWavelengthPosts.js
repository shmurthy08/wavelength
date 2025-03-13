import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function useWavelengthPosts(wavelengthId) {
  const [posts, setPosts] = useState([]);
  const [wavelengths, setWavelengths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch wavelengths for discover page
  const fetchWavelengths = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wavelengths')
        .select('*')
        .order('active_users_count', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Add mock data for testing if no wavelengths exist
      if (!data || data.length === 0) {
        const mockData = [
          {
            id: 1,
            name: "Morning Coffee",
            description: "For early birds sharing their morning routines",
            icon_type: "coffee", 
            color: "#E6A756",
            active_users_count: 342,
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
          },
          {
            id: 2,
            name: "Coding Projects",
            description: "Share your coding journey and get feedback",
            icon_type: "code",
            color: "#56A7E6",
            active_users_count: 189,
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString()
          },
          {
            id: 3,
            name: "Weekend Hiking",
            description: "For outdoor enthusiasts planning their next adventure",
            icon_type: "globe",
            color: "#56E68A",
            active_users_count: 427,
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString()
          }
        ];
        setWavelengths(mockData);
      } else {
        setWavelengths(data);
      }
    } catch (err) {
      console.error('Error fetching wavelengths:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts for the specified wavelength
  const fetchPosts = async () => {
    if (!wavelengthId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:user_id(username, avatar_url)')
        .eq('wavelength_id', wavelengthId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;

      // Add mock data for testing if no posts exist
      if (!data || data.length === 0) {
        const mockPosts = [
          {
            id: 1,
            content: "Working on my React project with my cat curled up next to me. Perfect morning!",
            created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            user: { name: "Alex" },
            likes_count: 24,
            comments_count: 3
          },
          {
            id: 2,
            content: "Debugging a nasty issue with async functions. Anyone dealt with Promise.all timeouts before?",
            created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
            user: { name: "Jordan" },
            likes_count: 18,
            comments_count: 8
          },
          {
            id: 3,
            content: "Just pushed my first open-source PR. So excited to contribute to the community!",
            created_at: new Date(Date.now() - 1000 * 60 * 27).toISOString(),
            user: { name: "Taylor" },
            likes_count: 56,
            comments_count: 12
          }
        ];
        setPosts(mockPosts);
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a new post
  const addPost = async (content, mediaUrl = null) => {
    if (!wavelengthId) return { error: 'Wavelength ID is required' };
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          wavelength_id: wavelengthId,
          content,
          media_url: mediaUrl,
          created_at: new Date()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Fetch the post with the profile information
      const { data: postWithProfile, error: profileError } = await supabase
        .from('posts')
        .select('*, profiles:user_id(username, avatar_url)')
        .eq('id', data.id)
        .single();
      
      if (profileError) throw profileError;
      
      // Add the new post to the state
      if (postWithProfile) {
        setPosts(prev => [postWithProfile, ...prev]);
      }
      
      return { data: postWithProfile };
    } catch (err) {
      console.error('Error adding post:', err);
      return { error: err.message };
    }
  };

  // Delete a post
  const deletePost = async (postId) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
      
      // Remove the deleted post from state
      setPosts(prev => prev.filter(post => post.id !== postId));
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting post:', err);
      return { error: err.message };
    }
  };

  // Set up fetch based on what's needed
  useEffect(() => {
    if (wavelengthId) {
      // If wavelengthId is provided, fetch posts for that wavelength
      fetchPosts();
      
      // Set up real-time subscription for posts
      const subscription = supabase
        .channel(`wavelength_posts_${wavelengthId}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'posts',
            filter: `wavelength_id=eq.${wavelengthId}`
          }, 
          async (payload) => {
            try {
              // Fetch the complete post with profile info
              const { data, error } = await supabase
                .from('posts')
                .select('*, profiles:user_id(username, avatar_url)')
                .eq('id', payload.new.id)
                .single();
              
              if (error) throw error;
              
              if (data) {
                setPosts(prev => {
                  // Avoid duplicate posts
                  const exists = prev.some(post => post.id === data.id);
                  if (exists) return prev;
                  return [data, ...prev];
                });
              }
            } catch (err) {
              console.error('Error processing real-time post:', err);
            }
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(subscription);
      };
    } else {
      // No wavelengthId means we're on the discover page, so fetch wavelengths
      fetchWavelengths();
    }
  }, [wavelengthId]);

  return {
    posts,
    wavelengths,
    loading,
    isLoading: loading, // Alias for compatibility
    error,
    fetchPosts,
    fetchWavelengths,
    addPost,
    deletePost
  };
}