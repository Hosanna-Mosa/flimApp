import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CommunityType } from '@/types';
import CommunityTypeSelector from '@/components/communities/CommunityTypeSelector';

interface CommunityFormProps {
  name: string;
  description: string;
  type: CommunityType;
  industry: string;
  onChangeName: (v: string) => void;
  onChangeDescription: (v: string) => void;
  onChangeType: (t: CommunityType) => void;
  onChangeIndustry: (v: string) => void;
}

/**
 * Create-community fields: name, description, type chips and (for industry
 * communities) the industry input.
 */
export default function CommunityForm({
  name,
  description,
  type,
  industry,
  onChangeName,
  onChangeDescription,
  onChangeType,
  onChangeIndustry,
}: CommunityFormProps) {
  const { colors } = useTheme();
  const inputTheme = { backgroundColor: colors.card, color: colors.text, borderColor: colors.border };

  return (
    <>
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Community Name</Text>
        <TextInput
          style={[styles.input, inputTheme]}
          placeholder="e.g. Bollywood Directors"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={onChangeName}
          maxLength={50}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, inputTheme]}
          placeholder="What is this community about?"
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={onChangeDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </View>

      <CommunityTypeSelector value={type} onChange={onChangeType} />

      {type === 'industry' && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Industry</Text>
          <TextInput
            style={[styles.input, inputTheme]}
            placeholder="e.g. Bollywood, Tollywood"
            placeholderTextColor={colors.textSecondary}
            value={industry}
            onChangeText={onChangeIndustry}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});
