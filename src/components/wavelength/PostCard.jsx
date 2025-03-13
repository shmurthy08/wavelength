import { Heart, MessageCircle, Share2 } from 'lucide-react';

export default function PostCard({ post }) {
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  // The Supabase query returns profiles nested as post.profiles
  const username = post.profiles?.username || 'Anonymous';
  const avatarInitial = username.charAt(0).toUpperCase() || 'A';

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-start">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm mr-3">
          {avatarInitial}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-medium">{username}</h3>
            <span className="text-xs text-gray-400">{formatTimeAgo(post.created_at)}</span>
          </div>
          <p className="text-gray-700 mb-3">{post.content}</p>
          
          <div className="flex items-center text-gray-500">
            <button className="flex items-center mr-6 hover:text-indigo-600">
              <Heart size={18} className="mr-1" />
              <span>{post.likes_count || 0}</span>
            </button>
            <button className="flex items-center mr-6 hover:text-indigo-600">
              <MessageCircle size={18} className="mr-1" />
              <span>{post.comments_count || 0}</span>
            </button>
            <button className="flex items-center hover:text-indigo-600">
              <Share2 size={18} className="mr-1" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}