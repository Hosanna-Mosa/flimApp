import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '@/components/AppText';

export interface OnboardingStepConfig {
  title: string;
  subtitle: string;
}

/** Copy for each onboarding step, indexed by step - 1. */
export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  { title: 'Choose Your Avatar', subtitle: 'Select a profile picture to represent you' },
  {
    title: 'Select Your Language',
    subtitle: 'Pick your primary profile language (you can change this later)',
  },
  { title: 'Select Your Roles', subtitle: 'Choose all that apply (you can change this later)' },
  { title: 'Select Industries', subtitle: 'Which film industries are you interested in?' },
];

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEPS.length;

interface OnboardingStepHeaderProps {
  /** 1-based step number. */
  step: number;
}

/** Title + subtitle for the current onboarding step. */
export default function OnboardingStepHeader({ step }: OnboardingStepHeaderProps) {
  const config = ONBOARDING_STEPS[step - 1] ?? ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1];
  return (
    <View style={styles.header}>
      <AppText variant="h2" style={styles.title}>
        {config.title}
      </AppText>
      <AppText variant="bodyLarge" secondary>
        {config.subtitle}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    marginBottom: 8,
  },
});
