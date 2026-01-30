import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  borderRadius?: number;
}

export const Skeleton = ({ width, height, style, borderRadius = 4, backgroundColor }: SkeletonProps & { backgroundColor?: string }) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: backgroundColor || colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};
