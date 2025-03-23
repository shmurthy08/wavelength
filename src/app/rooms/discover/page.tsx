'use client';

import NavigationLayout from '@/components/Layout/NavigationLayout';
import RoomsList from '@/components/Room/RoomsList';

export default function DiscoverPage() {
  return (
    <NavigationLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">Discover</h1>
        <RoomsList type="discover" />
      </div>
    </NavigationLayout>
  );
}