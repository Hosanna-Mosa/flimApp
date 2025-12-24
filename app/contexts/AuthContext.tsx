import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { User, UserRole, Industry } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
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
      const token = await AsyncStorage.getItem('token');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const onboardingComplete = await AsyncStorage.getItem(
        'onboarding_complete'
      );

      if (userJson && token) {
        const user = JSON.parse(userJson);
        setAuthState({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          hasCompletedOnboarding: onboardingComplete === 'true',
        });
      } else {
        setAuthState({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          hasCompletedOnboarding: false,
        });
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      setAuthState({
        user: null,
        token: null,
        refreshToken: null,
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
      isPrivate: false,
    };

    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setAuthState({
      user: newUser,
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
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

  const setAuth = async (data: {
    user: User;
    token: string;
    refreshToken: string;
  }) => {
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
    if (data.user.roles.length > 0 && data.user.industries.length > 0) {
       await AsyncStorage.setItem('onboarding_complete', 'true');
    }

    setAuthState({
      user: data.user,
      token: data.token,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding:
        data.user.roles.length > 0 && data.user.industries.length > 0,
    });
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('onboarding_complete');
    setAuthState({
      user: null,
      token: null,
      refreshToken: null,
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
    setAuth,
  };
});
