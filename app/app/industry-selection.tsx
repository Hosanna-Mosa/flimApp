import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { INDUSTRIES } from '@/constants/industries';
import { Industry } from '@/types';
import SelectableCard from '@/components/SelectableCard';
import Button from '@/components/Button';

export default function IndustrySelectionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { updateUserIndustries } = useAuth();
  const [selectedIndustries, setSelectedIndustries] = useState<Industry[]>([]);

  const handleToggleIndustry = (industryId: string) => {
    const industry = industryId as Industry;
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(selectedIndustries.filter((i) => i !== industry));
    } else {
      setSelectedIndustries([...selectedIndustries, industry]);
    }
  };

  const handleContinue = async () => {
    await updateUserIndustries(selectedIndustries);
    router.replace('/home');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Select Industries
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Which film industries are you interested in?
          </Text>
        </View>

        <View style={styles.industriesContainer}>
          {INDUSTRIES.map((industry) => (
            <SelectableCard
              key={industry.id}
              id={industry.id}
              label={industry.label}
              description={industry.description}
              selected={selectedIndustries.includes(industry.id)}
              onToggle={handleToggleIndustry}
              color={industry.color}
            />
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Button
          title="Get Started"
          onPress={handleContinue}
          size="large"
          disabled={selectedIndustries.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  industriesContainer: {
    gap: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
});
