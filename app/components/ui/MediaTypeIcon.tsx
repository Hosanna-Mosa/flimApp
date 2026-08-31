import React from 'react';
import { Play, Music, FileText, Type, Film } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface MediaTypeIconProps {
  type?: string;
  size?: number;
  color?: string;
}

/** Icon for a post's content type — video / audio / script / text / image. */
export default function MediaTypeIcon({ type, size = 20, color }: MediaTypeIconProps) {
  const { colors } = useTheme();
  const props = { size, color: color ?? colors.primary };
  switch (type) {
    case 'video':
      return <Play {...props} />;
    case 'audio':
      return <Music {...props} />;
    case 'script':
      return <FileText {...props} />;
    case 'text':
      return <Type {...props} />;
    default:
      return <Film {...props} />;
  }
}
