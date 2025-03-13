import { useWavelength } from '../hooks/useWavelength';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Coffee, Code, Globe } from 'lucide-react';
import PostCard from '../components/wavelength/PostCard';
import { useAuth } from '../context/AuthContext';

export default function WavelengthView() {
  const { wavelengthId } = useParams(); // Changed from 'id' to match route parameter
  const { wavelength, posts, loading, fetchWavelength, tuneIn, tuneOut, createPost } = useWavelength();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isTuningIn, setIsTuningIn] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState(null);

  useEffect(() => {
    if (wavelengthId) {
      fetchWavelength(wavelengthId);
    }
  }, [wavelengthId, fetchWavelength]);

  const handleTuneToggle = async () => {
    if (!user) {
      // Redirect to sign in or show sign in modal
      return;
    }

    setIsTuningIn(true);
    try {
      if (wavelength?.is_tuned_in) {
        await tuneOut(wavelengthId);
      } else {
        await tuneIn(wavelengthId);
      }
      // Refresh wavelength data to update UI state
      await fetchWavelength(wavelengthId);
    } catch (error) {
      console.error('Error toggling tune status:', error);
    } finally {
      setIsTuningIn(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user) return;
    if (!postContent.trim()) return;
    
    setIsPosting(true);
    setPostError(null);
    
    try {
      const { error } = await createPost(wavelengthId, postContent);
      
      if (error) {
        setPostError(error);
        return;
      }
      
      // Clear the form
      setPostContent('');
    } catch (err) {
      console.error('Error creating post:', err);
      setPostError('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Left sidebar */}
      <div className="hidden md:block md:col-span-3">
        <div className="bg-white rounded-xl shadow p-4 sticky top-6">
          <Link 
            to="/discover"
            className="flex items-center text-gray-600 hover:text-indigo-600 mb-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Back to discover</span>
          </Link>
          
          <div className="border-t pt-4">
            <div className="flex items-center mb-2">
              <Globe className="text-indigo-600 mr-2" size={20} />
              <h3 className="font-semibold text-lg">{wavelength?.name}</h3>
            </div>
            <p className="text-gray-500 mb-3">{wavelength?.active_users_count} people tuned in</p>
            <p className="text-gray-500 mb-4">{wavelength?.timeRemaining}</p>
            
            <button 
              onClick={handleTuneToggle}
              disabled={isTuningIn || loading}
              className={`w-full p-2 ${wavelength?.is_tuned_in 
                ? 'bg-gray-600 hover:bg-gray-700' 
                : 'bg-indigo-600 hover:bg-indigo-700'} 
                text-white rounded-lg font-medium disabled:opacity-50 transition`}
            >
              {isTuningIn ? 'Processing...' : wavelength?.is_tuned_in ? 'Tune Out' : 'Tune In'}
            </button>
          </div>
          
          <div className="border-t mt-4 pt-4">
            <h4 className="font-medium text-gray-700 mb-2">About this wavelength</h4>
            <p className="text-gray-500 text-sm">
              {wavelength?.description || 'Join others in this wavelength to share experiences and connect.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="col-span-1 md:col-span-6">
        {/* Mobile back button */}
        <Link 
          to="/discover"
          className="md:hidden flex items-center text-gray-600 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back</span>
        </Link>

        {/* Post creation form */}
        <div className="bg-white rounded-xl shadow p-4 mb-4">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-3">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <input 
              type="text" 
              placeholder="Share your experience in this wavelength..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              disabled={!user || !wavelength?.is_tuned_in || isPosting}
              className="flex-1 bg-gray-100 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
            />
          </div>
          
          {postError && (
            <div className="mb-3 text-sm text-red-600">
              {postError}
            </div>
          )}
          
          <div className="flex justify-end">
            <button 
              onClick={handleCreatePost}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition"
              disabled={!postContent.trim() || !user || !wavelength?.is_tuned_in || isPosting}
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
          
          {!user && (
            <p className="text-sm text-gray-500 mt-2">You must be signed in to post</p>
          )}
          {user && !wavelength?.is_tuned_in && (
            <p className="text-sm text-gray-500 mt-2">You need to tune in to this wavelength to post</p>
          )}
        </div>
        
        <div className="flex space-x-3 mb-4 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeFilter === 'all' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            All Posts
          </button>
          <button 
            onClick={() => setActiveFilter('trending')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeFilter === 'trending' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Trending
          </button>
          <button 
            onClick={() => setActiveFilter('questions')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeFilter === 'questions' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Questions
          </button>
          <button 
            onClick={() => setActiveFilter('media')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeFilter === 'media' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Media
          </button>
        </div>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : posts?.length > 0 ? (
            posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-8 bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-semibold text-gray-700">No posts yet</h3>
              <p className="text-gray-500 mt-2">
                Be the first to share in this wavelength!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="hidden md:block md:col-span-3">
        <div className="bg-white rounded-xl shadow p-4 sticky top-6">
          <h3 className="font-semibold text-gray-700 mb-3">Active Members</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm mr-2">
                A
              </div>
              <span className="text-gray-700">Alex</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-sm mr-2">
                J
              </div>
              <span className="text-gray-700">Jordan</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm mr-2">
                T
              </div>
              <span className="text-gray-700">Taylor</span>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <button className="text-indigo-600 text-sm">
              See all members
            </button>
          </div>
          
          <div className="border-t mt-4 pt-4">
            <h4 className="font-medium text-gray-700 mb-2">Related Wavelengths</h4>
            <div className="space-y-2">
              <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Coffee className="text-orange-500 mr-2" size={16} />
                <span className="text-gray-700 text-sm">Coffee Club</span>
              </div>
              <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Coffee className="text-orange-500 mr-2" size={16} />
                <span className="text-gray-700 text-sm">Breakfast Ideas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}