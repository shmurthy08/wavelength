import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const isPostAuthor = user?.id === post.user_id;

  const handleDelete = async () => {
    if (onDelete && isPostAuthor) {
      await onDelete(post.id);
    }
    closeMenu();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start">
        <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
          {post.profiles?.avatar_url ? (
            <img 
              src={post.profiles.avatar_url} 
              alt={post.profiles.username || 'User'} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
              {post.profiles?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="font-medium mr-2">{post.profiles?.username || 'Anonymous'}</span>
              <span className="text-gray-500 text-sm">{formatTimeAgo(post.created_at)}</span>
            </div>
            
            {isPostAuthor && (
              <div className="relative">
                <button 
                  onClick={toggleMenu}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                      <button
                        onClick={handleDelete}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Delete post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <p className="text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
          
          {post.media_url && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img 
                src={post.media_url} 
                alt="Post media" 
                className="w-full h-auto" 
              />
            </div>
          )}
          
          <div className="mt-3 flex items-center space-x-4 text-gray-500">
            <button className="flex items-center hover:text-indigo-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">Like</span>
            </button>
            
            <button className="flex items-center hover:text-indigo-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">Reply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}