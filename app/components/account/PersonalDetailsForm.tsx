import React from 'react';
import { StyleSheet } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import Input from '@/components/Input';
import Button from '@/components/Button';
import SettingsRow from '@/components/ui/SettingsRow';
import { PersonalDetailsValues } from '@/hooks/usePersonalDetails';

interface PersonalDetailsFormProps {
  values: PersonalDetailsValues;
  onChange: <K extends keyof PersonalDetailsValues>(field: K, value: PersonalDetailsValues[K]) => void;
  onManagePortfolio: () => void;
  onSave: () => void;
  saving: boolean;
}

/** Email / phone / location / experience / bio fields, the portfolio link row, and Save. */
export default function PersonalDetailsForm({
  values,
  onChange,
  onManagePortfolio,
  onSave,
  saving,
}: PersonalDetailsFormProps) {
  return (
    <>
      <Input
        label="Email"
        placeholder="your.email@example.com"
        value={values.email}
        onChangeText={(text) => onChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Phone Number"
        placeholder="+91 98765 43210"
        value={values.phone}
        onChangeText={(text) => onChange('phone', text)}
        keyboardType="phone-pad"
      />

      <Input
        label="Location"
        placeholder="City, Country"
        value={values.location}
        onChangeText={(text) => onChange('location', text)}
      />

      <Input
        label="Years of Experience"
        placeholder="0"
        value={values.experience}
        onChangeText={(text) => onChange('experience', text)}
        keyboardType="numeric"
      />

      <Input
        label="Bio"
        placeholder="Tell us about yourself"
        value={values.bio}
        onChangeText={(text) => onChange('bio', text)}
        multiline
        numberOfLines={4}
        style={styles.bioInput}
      />

      <SettingsRow
        icon={Briefcase}
        label="Manage Portfolio"
        description="Configure and showcase your project links"
        onPress={onManagePortfolio}
        style={styles.portfolioRow}
      />

      <Button title="Save Changes" onPress={onSave} size="large" loading={saving} style={styles.saveButton} />
    </>
  );
}

const styles = StyleSheet.create({
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  portfolioRow: {
    marginTop: 16,
    marginBottom: 24,
  },
  saveButton: {
    marginTop: 8,
  },
});
