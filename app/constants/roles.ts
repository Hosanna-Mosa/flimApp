import { UserRole } from '@/types';

export interface RoleData {
  id: UserRole;
  label: string;
  icon: string;
}

export const ROLES: RoleData[] = [
  { id: 'actor', label: 'Actor', icon: '🎭' },
  { id: 'director', label: 'Director', icon: '🎬' },
  { id: 'producer', label: 'Producer', icon: '🎥' },
  { id: 'writer', label: 'Writer', icon: '✍️' },
  { id: 'dop', label: 'DOP', icon: '📹' },
  { id: 'editor', label: 'Editor', icon: '✂️' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'vfx', label: 'VFX', icon: '✨' },
  { id: 'sound', label: 'Sound', icon: '🔊' },
  { id: 'makeup', label: 'Makeup', icon: '💄' },
  { id: 'costume', label: 'Costume', icon: '👗' },
];
