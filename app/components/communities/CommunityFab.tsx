import React from 'react';
import Fab from '@/components/ui/Fab';

interface CommunityFabProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

/** Community-sized wrapper over the shared Fab (admins: create group). */
export default function CommunityFab({ onPress, accessibilityLabel = 'Create group' }: CommunityFabProps) {
  return <Fab onPress={onPress} size={56} iconSize={24} accessibilityLabel={accessibilityLabel} />;
}
