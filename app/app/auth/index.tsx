import React from 'react';
import { useRouter } from 'expo-router';
import AuthScreen from '@/components/auth/AuthScreen';
import LandingContent from '@/components/auth/LandingContent';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <AuthScreen scroll={false} keyboard={false} centered>
      <LandingContent
        onSignIn={() => router.push('/auth/signin')}
        onSignUp={() => router.push('/auth/signup')}
      />
    </AuthScreen>
  );
}
