'use client';

import { useState, useEffect, useRef } from 'react';
import { API } from 'aws-amplify';
import { useAuth } from '@/context/AuthContext';
import NavigationLayout from '@/components/Layout/NavigationLayout';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
}

interface Room {
  id: string;
  title: string;
  description: string;
  interests: string[];
  expiresAt: string;
  participants: string[];
  messages: Message[];
}

export default function RoomPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRoom();
    setupSubscription();
  }, [params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function fetchRoom() {
    try {
      const query = /* GraphQL */ `
        query GetRoom($id: ID!) {
          getRoom(id: $id) {
            id
            title
            description
            interests
            expiresAt
            participants
            messages {
              items {
                id
                content
                createdAt
                userId
                userName
              }
            }
          }
        }
      `;

      const response = await API.graphql({
        query,
        variables: { id: params.id },
      });

      const roomData = response.data.getRoom;
      setRoom(roomData);
      setMessages(roomData.messages.items);
      setLoading(false);
    } catch (err) {
      setError('Failed to load room');
      setLoading(false);
      console.error('Error fetching room:', err);
    }
  }

  function setupSubscription() {
    const subscription = /* GraphQL */ `
      subscription OnCreateMessage($roomId: ID!) {
        onCreateMessage(roomId: $roomId) {
          id
          content
          createdAt
          userId
          userName
        }
      }
    `;

    const sub = API.graphql({
      query: subscription,
      variables: { roomId: params.id },
    }).subscribe({
      next: ({ value }: any) => {
        const message = value.data.onCreateMessage;
        setMessages((prev) => [...prev, message]);
      },
      error: (error) => console.error('Subscription error:', error),
    });

    return () => sub.unsubscribe();
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const mutation = /* GraphQL */ `
        mutation CreateMessage(
          $content: String!
          $roomId: ID!
          $userId: String!
          $userName: String!
        ) {
          createMessage(
            input: {
              content: $content
              roomId: $roomId
              userId: $userId
              userName: $userName
            }
          ) {
            id
            content
            createdAt
            userId
            userName
          }
        }
      `;

      await API.graphql({
        query: mutation,
        variables: {
          content: newMessage,
          roomId: params.id,
          userId: user.username,
          userName: user.attributes.email,
        },
      });

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }

  if (loading) {
    return (
      <NavigationLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </NavigationLayout>
    );
  }

  if (error || !room) {
    return (
      <NavigationLayout>
        <div className="text-center py-12">
          <p className="text-red-500">{error || 'Room not found'}</p>
          <button
            onClick={fetchRoom}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            Try again
          </button>
        </div>
      </NavigationLayout>
    );
  }

  const timeLeft = formatDistanceToNow(new Date(room.expiresAt), { addSuffix: true });

  return (
    <NavigationLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{room.title}</h1>
              <p className="mt-1 text-gray-500">{room.description}</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Expires {timeLeft}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {room.interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg">
          <div className="h-96 overflow-y-auto p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${
                  message.userId === user.username ? 'flex flex-row-reverse' : 'flex'
                }`}
              >
                <div
                  className={`max-w-xs sm:max-w-sm md:max-w-md rounded-lg px-4 py-2 ${
                    message.userId === user.username
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-xs font-medium mb-1">
                    {message.userId === user.username ? 'You' : message.userName}
                  </p>
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </NavigationLayout>
  );
}