import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';

type Theme = 'light' | 'dark' | 'auto';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme as Theme);
      }
    } catch (error) {
      // console.error('Error loading theme:', error);
    }
  };

  const changeTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const currentScheme = theme === 'auto' ? systemColorScheme || 'dark' : theme;

  return {
    theme,
    changeTheme,
    colors: colors[currentScheme],
    isDark: currentScheme === 'dark',
  };
});
