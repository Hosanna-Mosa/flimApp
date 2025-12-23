import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { User, UserRole, Industry } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    hasCompletedOnboarding: false,
  });

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const onboardingComplete = await AsyncStorage.getItem(
        'onboarding_complete'
      );

      if (userJson) {
        const user = JSON.parse(userJson);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          hasCompletedOnboarding: onboardingComplete === 'true',
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          hasCompletedOnboarding: false,
        });
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        hasCompletedOnboarding: false,
      });
    }
  };

  const login = async (phone: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      name: '',
      email: '',
      phone,
      avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${phone}`,
      bio: '',
      roles: [],
      industries: [],
      experience: 0,
      location: '',
      isOnline: true,
    };

    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setAuthState({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: false,
    });
  };

  const updateUserRoles = async (roles: UserRole[]) => {
    if (!authState.user) return;

    const updatedUser = { ...authState.user, roles };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  };

  const updateUserIndustries = async (industries: Industry[]) => {
    if (!authState.user) return;

    const updatedUser = { ...authState.user, industries };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    await AsyncStorage.setItem('onboarding_complete', 'true');
    setAuthState((prev) => ({
      ...prev,
      user: updatedUser,
      hasCompletedOnboarding: true,
    }));
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!authState.user) return;

    const updatedUser = { ...authState.user, ...updates };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('onboarding_complete');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasCompletedOnboarding: false,
    });
  };

  return {
    ...authState,
    login,
    logout,
    updateUserRoles,
    updateUserIndustries,
    updateProfile,
  };
});
