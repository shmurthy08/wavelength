'use client';

import NavigationLayout from '@/components/Layout/NavigationLayout';
import RoomsList from '@/components/Room/RoomsList';

export default function SavedPage() {
  return (
    <NavigationLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">Saved Rooms</h1>
        <RoomsList type="saved" />
      </div>
    </NavigationLayout>
  );
}