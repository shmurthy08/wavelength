import { useState, useEffect } from 'react';
import { API } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import RoomCard from './RoomCard';

interface Room {
  id: string;
  title: string;
  description: string;
  interests: string[];
  expiresAt: string;
  participants: string[];
}

type RoomsListType = 'for-you' | 'discover' | 'saved';

interface RoomsListProps {
  type: RoomsListType;
  userInterests?: string[];
}

export default function RoomsList({ type, userInterests }: RoomsListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, [type, userInterests]);

  async function fetchRooms() {
    try {
      setLoading(true);
      let query = '';
      let variables = {};

      switch (type) {
        case 'for-you':
          query = /* GraphQL */ `
            query GetRoomsByInterests($interests: [String!]!, $limit: Int) {
              getRoomsByInterests(interests: $interests, limit: $limit) {
                id
                title
                description
                interests
                expiresAt
                participants
              }
            }
          `;
          variables = { interests: userInterests, limit: 20 };
          break;

        case 'discover':
          query = /* GraphQL */ `
            query GetActiveRooms($limit: Int) {
              getActiveRooms(limit: $limit) {
                id
                title
                description
                interests
                expiresAt
                participants
              }
            }
          `;
          variables = { limit: 20 };
          break;

        case 'saved':
          // TODO: Implement saved rooms query
          break;
      }

      if (query) {
        const response = await API.graphql<GraphQLQuery<any>>({
          query,
          variables,
        });

        const data = type === 'for-you' ? response.data.getRoomsByInterests : response.data.getActiveRooms;
        setRooms(data);
      }
    } catch (err) {
      setError('Failed to fetch rooms');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchRooms}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Try again
        </button>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No rooms found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          id={room.id}
          title={room.title}
          description={room.description}
          interests={room.interests}
          expiresAt={room.expiresAt}
          participantCount={room.participants.length}
        />
      ))}
    </div>
  );
}