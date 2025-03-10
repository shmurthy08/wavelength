import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useWavelength } from '../context/WavelengthContext';
import { useWavelengthPosts } from '../hooks/useSupabaseQuery';
import { supabase } from '../lib/supabase';
import PostCard from '../components/wavelength/PostCard';

export default function WavelengthView() {
  const { wavelengthId } = useParams();
  const { user } = useAuth();
  const { tuneIn, tuneOut } = useWavelength();
  const queryClient = useQueryClient();
  
  const [wavelength, setWavelength] = useState(null);
  const [users, setUsers] = useState([]);
  const [isTunedIn, setIsTunedIn] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postingContent, setPostingContent] = useState(false);

  // Use cached posts query
  const { 
    data: posts, 
    isLoading: postsLoading,
    refetch: refetchPosts 
  } = useWavelengthPosts(wavelengthId);
  
  useEffect(() => {
    fetchWavelengthData();
    checkIfTunedIn();
    
    // Set up real-time subscriptions
    const wavelengthSubscription = supabase
      .channel('wavelength_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'wavelengths',
          filter: `id=eq.${wavelengthId}`
        }, 
        () => {
          fetchWavelengthData();
        }
      )
      .subscribe();

    const usersSubscription = supabase
      .channel('wavelength_users')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_wavelengths',
          filter: `wavelength_id=eq.${wavelengthId}`
        }, 
        () => {
          fetchActiveUsers();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(wavelengthSubscription);
      supabase.removeChannel(usersSubscription);
    };
  }, [wavelengthId, user]);

  const fetchWavelengthData = async () => {
    try {
      const { data, error } = await supabase
        .from('wavelengths')
        .select('*')
        .eq('id', wavelengthId)
        .single();
        
      if (error) throw error;
      setWavelength(data);
      
      await fetchActiveUsers();
    } catch (error) {
      console.error('Error fetching wavelength:', error);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_wavelengths')
        .select('profiles:user_id(id, username, avatar_url)')
        .eq('wavelength_id', wavelengthId)
        .eq('active', true)
        .limit(50);
        
      if (error) throw error;
      setUsers(data?.map(item => item.profiles) || []);
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  const checkIfTunedIn = async () => {
    if (!user) {
      setIsTunedIn(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_wavelengths')
        .select('active')
        .eq('user_id', user.id)
        .eq('wavelength_id', wavelengthId)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      setIsTunedIn(data?.active || false);
    } catch (error) {
      console.error('Error checking tune status:', error);
    }
  };

  const handleTuneToggle = async () => {
    if (!user) return;
    
    try {
      if (isTunedIn) {
        await tuneOut(wavelengthId);
        setIsTunedIn(false);
      } else {
        await tuneIn(wavelengthId);
        setIsTunedIn(true);
      }
      
      // Refresh wavelength data to get updated user count
      fetchWavelengthData();
    } catch (error) {
      console.error('Error toggling tune status:', error);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !newPostContent.trim()) return;
    
    setPostingContent(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          wavelength_id: wavelengthId,
          content: newPostContent.trim(),
          created_at: new Date()
        });
        
      if (error) throw error;
      
      // Clear input and refetch posts
      setNewPostContent('');
      refetchPosts();
    } catch (error) {
      console.error('Error posting content:', error);
    } finally {
      setPostingContent(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
        
      if (error) throw error;
      
      // Remove the deleted post from the cache
      queryClient.setQueryData(['wavelength-posts', wavelengthId], (old) => 
        old?.filter(post => post.id !== postId) || []
      );
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (postsLoading) {
    return <div className="flex justify-center items-center h-screen">Loading wavelength...</div>;
  }

  if (!wavelength) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold">Wavelength not found</h2>
        <p className="text-gray-600 mt-2">This wavelength may have expired or doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Wavelength header */}
      <div 
        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-6 mb-8 text-white"
        style={{ 
          backgroundImage: `linear-gradient(135deg, rgba(99,102,241,${wavelength.intensity + 0.1}) 0%, rgba(168,85,247,${wavelength.intensity + 0.2}) 50%, rgba(236,72,153,${wavelength.intensity}) 100%)` 
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h1 className="text-3xl font-bold mb-2 md:mb-0">{wavelength.name}</h1>
          
          {user && (
            <button 
              onClick={handleTuneToggle}
              className={`px-5 py-2 rounded-full text-sm font-medium ${
                isTunedIn 
                  ? 'bg-white text-indigo-700' 
                  : 'bg-black bg-opacity-30 text-white hover:bg-opacity-40'
              }`}
            >
              {isTunedIn ? 'Tuned In ✓' : 'Tune In'}
            </button>
          )}
        </div>
        
        <p className="text-white text-opacity-90 mb-4">{wavelength.description}</p>
        
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
            Category: {wavelength.category}
          </div>
          <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
            {wavelength.active_users_count} tuned in
          </div>
          <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
            Expires: {new Date(wavelength.expires_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content area - posts */}
        <div className="lg:w-2/3">
          {user && isTunedIn && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <form onSubmit={handlePostSubmit}>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's happening on this wavelength?"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  disabled={postingContent}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={postingContent || !newPostContent.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50"
                  >
                    {postingContent ? 'Posting...' : 'Share on Wavelength'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <h2 className="text-xl font-semibold mb-4">Experience Capsules</h2>
          
          {!user && (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-6">
              <p>Sign in to participate in this wavelength and share your experiences.</p>
            </div>
          )}
          
          {user && !isTunedIn && (
            <div className="bg-indigo-50 text-indigo-700 p-4 rounded-lg mb-6">
              <p>Tune in to this wavelength to post your experiences.</p>
            </div>
          )}
          
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                      {post.profiles.avatar_url ? (
                        <img 
                          src={post.profiles.avatar_url} 
                          alt="User" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                          {post.profiles.username?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="font-medium mr-2">{post.profiles.username || 'Anonymous'}</span>
                        <span className="text-gray-500 text-sm">{formatTimeAgo(post.created_at)}</span>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                      
                      {post.media_url && (
                        <div className="mt-3 rounded-lg overflow-hidden">
                          <img 
                            src={post.media_url} 
                            alt="Post media" 
                            className="w-full h-auto" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">
                No experiences shared on this wavelength yet. 
                {user && isTunedIn ? " Be the first to post!" : ""}
              </p>
            </div>
          )}
        </div>
        
        {/* Sidebar - Active Users */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
            <h3 className="font-semibold mb-4">People on this wavelength</h3>
            
            {users.length > 0 ? (
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="flex items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt="User" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                          {user.username?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <span>{user.username || 'Anonymous'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No one is currently tuned in to this wavelength.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}