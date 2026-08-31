import {
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  FileText,
  Type,
  LucideIcon,
} from 'lucide-react-native';
import { ContentType } from '@/types';

export interface UploadOption {
  type: ContentType;
  icon: LucideIcon;
  label: string;
  /** Accent colour for the tile icon (tinted at 15% for the circle behind it). */
  color: string;
}

/**
 * The one list of content types a user can create. The Create Post tile
 * grid and the Crowd Fund format selector are both driven from here.
 */
export const UPLOAD_OPTIONS: UploadOption[] = [
  { type: 'image', icon: ImageIcon, label: 'Image', color: '#4CAF50' },
  { type: 'video', icon: VideoIcon, label: 'Video', color: '#E91E63' },
  { type: 'audio', icon: Music, label: 'Audio', color: '#2196F3' },
  { type: 'script', icon: FileText, label: 'Script', color: '#FF9800' },
  { type: 'text', icon: Type, label: 'Text', color: '#9C27B0' },
];

/** Formats a Crowd Fund request may use, in selector order. */
export const DONATION_UPLOAD_TYPES: ContentType[] = ['text', 'image', 'video', 'audio'];

export const DONATION_UPLOAD_OPTIONS: UploadOption[] = DONATION_UPLOAD_TYPES.map(
  (type) => UPLOAD_OPTIONS.find((o) => o.type === type)!
);

/** "image" → "Image" (used for "New Image", "Upload Image", …). */
export const capitalizeType = (type: ContentType): string =>
  type.charAt(0).toUpperCase() + type.slice(1);
