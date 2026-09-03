import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AuthScreen from '@/components/auth/AuthScreen';
import OnboardingStepHeader, { ONBOARDING_STEP_COUNT } from '@/components/onboarding/OnboardingStepHeader';
import AvatarStep from '@/components/onboarding/AvatarStep';
import LanguageStep from '@/components/onboarding/LanguageStep';
import RolesStep from '@/components/onboarding/RolesStep';
import IndustriesStep from '@/components/onboarding/IndustriesStep';
import OnboardingFooter from '@/components/onboarding/OnboardingFooter';
import { useOnboardingSubmit } from '@/hooks/useOnboardingSubmit';
import { PresetAvatar } from '@/constants/avatars';
import { track } from '@/utils/analytics';

const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

/** Names rather than bare numbers, so the funnel stays readable if the order
 *  of the steps ever changes. */
const STEP_NAMES = ['avatar', 'language', 'roles', 'industries'] as const;

export default function OnboardingScreen() {
  const { submit, loading } = useOnboardingSubmit();

  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState<string | null>(DEFAULT_AVATAR);
  const [presetAvatar, setPresetAvatar] = useState<PresetAvatar | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  // Fires on arrival at each step, not on leaving it — including step 1 on
  // mount. Measuring completions would count only the people who got through,
  // which is the opposite of what a drop-off needs: the step someone abandons
  // is the last one they reached, and it has no completion to record.
  useEffect(() => {
    track('onboarding_step', { step, name: STEP_NAMES[step - 1] });
  }, [step]);

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your media library to choose an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
      setPresetAvatar(null);
    }
  };

  const handlePickPreset = (preset: PresetAvatar) => {
    setPresetAvatar(preset);
    setAvatar(null);
  };

  const handleContinue = () => {
    if (step === 1) {
      if (!avatar && !presetAvatar) {
        Alert.alert('Avatar Required', 'Please choose a profile picture to continue.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedLanguage) return;
      setStep(3);
    } else if (step === 3) {
      if (selectedRoles.length === 0) return;
      setStep(4);
    } else {
      track('onboarding_complete', {
        roles: selectedRoles.length,
        industries: selectedIndustries.length,
        usedPresetAvatar: !!presetAvatar,
      });
      submit({ avatar, presetAvatar, selectedLanguage, selectedRoles, selectedIndustries });
    }
  };

  const nextDisabled =
    (step === 1 && !avatar && !presetAvatar) ||
    (step === 2 && !selectedLanguage) ||
    (step === 3 && selectedRoles.length === 0) ||
    (step === 4 && selectedIndustries.length === 0);

  return (
    <AuthScreen
      keyboard={false}
      bottomPadding={120}
      footer={
        <OnboardingFooter
          step={step}
          totalSteps={ONBOARDING_STEP_COUNT}
          onNext={handleContinue}
          onBack={() => setStep(step - 1)}
          loading={loading}
          disabled={nextDisabled}
        />
      }
    >
      <OnboardingStepHeader step={step} />

      <View style={{ gap: 12 }}>
        {step === 1 ? (
          <AvatarStep
            avatar={avatar}
            presetAvatar={presetAvatar}
            onPickImage={handlePickImage}
            onPickPreset={handlePickPreset}
            disabled={loading}
          />
        ) : step === 2 ? (
          <LanguageStep selected={selectedLanguage} onSelect={setSelectedLanguage} />
        ) : step === 3 ? (
          <RolesStep
            selected={selectedRoles}
            onToggle={(id) => setSelectedRoles(toggle(selectedRoles, id))}
          />
        ) : (
          <IndustriesStep
            selected={selectedIndustries}
            onToggle={(id) => setSelectedIndustries(toggle(selectedIndustries, id))}
          />
        )}
      </View>
    </AuthScreen>
  );
}
