import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function useWavelengthPosts(wavelengthId) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setPosts(data || []);
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

  // Set up real-time subscription
  useEffect(() => {
    if (!wavelengthId) return;
    
    fetchPosts();
    
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
  }, [wavelengthId]);

  return {
    posts,
    loading,
    error,
    fetchPosts,
    addPost,
    deletePost
  };
}