import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface RoomCardProps {
  id: string;
  title: string;
  description: string;
  interests: string[];
  expiresAt: string;
  participantCount: number;
}

export default function RoomCard({
  id,
  title,
  description,
  interests,
  expiresAt,
  participantCount,
}: RoomCardProps) {
  const timeLeft = useMemo(() => {
    const expiryDate = new Date(expiresAt);
    return formatDistanceToNow(expiryDate, { addSuffix: true });
  }, [expiresAt]);

  const getStatusColor = () => {
    const hoursLeft = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft <= 6) return 'bg-red-100 text-red-800'; // Expiring soon
    if (hoursLeft <= 24) return 'bg-yellow-100 text-yellow-800'; // Active
    return 'bg-green-100 text-green-800'; // Fresh
  };

  return (
    <Link href={`/rooms/${id}`} className="block">
      <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {timeLeft}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {interests.map((interest) => (
            <span
              key={interest}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              {interest}
            </span>
          ))}
        </div>
        
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <svg
            className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </div>
      </div>
    </Link>
  );
}