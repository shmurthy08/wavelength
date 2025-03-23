'use client';

import { useAuth } from '@/context/AuthContext';
import NavigationLayout from '@/components/Layout/NavigationLayout';
import RoomsList from '@/components/Room/RoomsList';

export default function ForYouPage() {
  const { user } = useAuth();
  // TODO: Get user interests from profile
  const userInterests = ['technology', 'programming']; // Placeholder

  return (
    <NavigationLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">For You</h1>
        <RoomsList type="for-you" userInterests={userInterests} />
      </div>
    </NavigationLayout>
  );
}