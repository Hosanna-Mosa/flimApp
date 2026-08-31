import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

/** Header-left back arrow for the post detail screen. */
export default function PostBackButton() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => router.back()}>
      <ArrowLeft size={24} color={colors.text} />
    </TouchableOpacity>
  );
}
