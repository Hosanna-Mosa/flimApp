import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/constants/roles';
import { INDUSTRIES } from '@/constants/industries';
import SelectableCard from '@/components/SelectableCard';
import Button from '@/components/Button';
import { api } from '@/utils/api';

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { setAuth } = useAuth();
  
  const [step, setStep] = useState(1);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleToggleRole = (id: string) => {
    if (selectedRoles.includes(id)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== id));
    } else {
      setSelectedRoles([...selectedRoles, id]);
    }
  };

  const handleToggleIndustry = (id: string) => {
    if (selectedIndustries.includes(id)) {
      setSelectedIndustries(selectedIndustries.filter((i) => i !== id));
    } else {
      setSelectedIndustries([...selectedIndustries, id]);
    }
  };

  const handleContinue = async () => {
    if (step === 1) {
      if (selectedRoles.length === 0) return;
      setStep(2);
    } else {
      // Register
      setLoading(true);
      try {
        const { name, phone, password } = params;
        const payload = {
            name: name as string,
            phone: phone as string,
            password: password as string,
            roles: selectedRoles,
            industries: selectedIndustries
        };

        const response = await api.register(payload);
        setAuth({
          token: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user as any,
        });
        
        router.replace('/home');
      } catch (err: any) {
        Alert.alert('Registration Failed', err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {step === 1 ? 'Select Your Roles' : 'Select Industries'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {step === 1 
              ? 'Choose all that apply (you can change this later)'
              : 'Which film industries are you interested in?'}
          </Text>
        </View>

        <View style={styles.listContainer}>
          {step === 1 ? (
             ROLES.map((role) => (
                <SelectableCard
                  key={role.id}
                  id={role.id}
                  label={role.label}
                  icon={role.icon}
                  selected={selectedRoles.includes(role.id)}
                  onToggle={handleToggleRole}
                />
             ))
          ) : (
             INDUSTRIES.map((industry) => (
                <SelectableCard
                  key={industry.id}
                  id={industry.id}
                  label={industry.label}
                  description={industry.description}
                  selected={selectedIndustries.includes(industry.id)}
                  onToggle={handleToggleIndustry}
                  color={industry.color}
                />
             ))
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Button
          title={step === 1 ? "Next" : "Complete Setup"}
          onPress={handleContinue}
          size="large"
          loading={loading}
          disabled={(step === 1 && selectedRoles.length === 0) || (step === 2 && selectedIndustries.length === 0)}
        />
        {step === 2 && (
            <Button
                title="Back"
                onPress={() => setStep(1)}
                variant="outline"
                style={{ marginTop: 10 }}
            />
        )}
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
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
    marginTop: 20
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  listContainer: {
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
