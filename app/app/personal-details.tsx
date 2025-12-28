import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import api from '@/utils/api';

interface PortfolioItem {
  title: string;
  type: string;
  url: string;
}

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateProfile, token } = useAuth();
  
  // Initialize email, but show empty if it's a placeholder email
  const initialEmail = (user as any)?.email || '';
  const isPlaceholderEmail = initialEmail.includes('@placeholder.com') || initialEmail.includes('@film.app');
  const [email, setEmail] = useState<string>(isPlaceholderEmail ? '' : initialEmail);
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [location, setLocation] = useState<string>(user?.location || '');
  const [experience, setExperience] = useState<string>(
    (user?.experience?.toString() || '0')
  );
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(
    (user as any)?.portfolio || []
  );
  const [saving, setSaving] = useState<boolean>(false);

  const [newPortfolioItem, setNewPortfolioItem] = useState<PortfolioItem>({
    title: '',
    type: '',
    url: '',
  });
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);

  const addPortfolioItem = () => {
    if (!newPortfolioItem.title || !newPortfolioItem.url) {
      Alert.alert('Error', 'Please fill in title and URL');
      return;
    }
    setPortfolio([...portfolio, { ...newPortfolioItem }]);
    setNewPortfolioItem({ title: '', type: '', url: '' });
    setShowPortfolioForm(false);
  };

  const removePortfolioItem = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate email format (if provided)
      if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        Alert.alert('Error', 'Please enter a valid email address');
        setSaving(false);
        return;
      }

      // Validate phone format (basic)
      if (phone && phone.trim().length < 10) {
        Alert.alert('Error', 'Please enter a valid phone number (at least 10 digits)');
        setSaving(false);
        return;
      }

      // Prepare update payload
      const updates: any = {
        location: location.trim(),
        experience: parseInt(experience) || 0,
        bio: bio.trim(),
        portfolio,
      };

      // Only include email if it's provided and different
      if (email && email.trim()) {
        const trimmedEmail = email.toLowerCase().trim();
        if (trimmedEmail !== (user as any)?.email) {
          updates.email = trimmedEmail;
        }
      }
      
      // Only include phone if it's provided and different
      if (phone && phone.trim()) {
        const trimmedPhone = phone.trim();
        if (trimmedPhone !== user?.phone) {
          updates.phone = trimmedPhone;
        }
      }

      // console.log('[PersonalDetails] Saving updates:', updates);

      // Call updateProfile which calls the backend
      await updateProfile(updates);

      Alert.alert('Success', 'Personal details updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      // console.error('[PersonalDetails] Error saving:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to update personal details. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Personal Details',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Input
            label="Email"
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label="Location"
            placeholder="City, Country"
            value={location}
            onChangeText={setLocation}
          />

          <Input
            label="Years of Experience"
            placeholder="0"
            value={experience}
            onChangeText={setExperience}
            keyboardType="numeric"
          />

          <Input
            label="Bio"
            placeholder="Tell us about yourself"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            style={styles.bioInput}
          />

          <View style={styles.portfolioSection}>
            <View style={styles.portfolioHeader}>
              <Text style={[styles.portfolioTitle, { color: colors.text }]}>
                Portfolio
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowPortfolioForm(!showPortfolioForm)}
              >
                <Plus size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            {showPortfolioForm && (
              <View
                style={[
                  styles.portfolioForm,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Input
                  label="Title"
                  placeholder="Project title"
                  value={newPortfolioItem.title}
                  onChangeText={(text) =>
                    setNewPortfolioItem({ ...newPortfolioItem, title: text })
                  }
                />
                <Input
                  label="Type"
                  placeholder="e.g., Film, TV Show, Music"
                  value={newPortfolioItem.type}
                  onChangeText={(text) =>
                    setNewPortfolioItem({ ...newPortfolioItem, type: text })
                  }
                />
                <Input
                  label="URL"
                  placeholder="https://example.com"
                  value={newPortfolioItem.url}
                  onChangeText={(text) =>
                    setNewPortfolioItem({ ...newPortfolioItem, url: text })
                  }
                  keyboardType="url"
                  autoCapitalize="none"
                />
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      setShowPortfolioForm(false);
                      setNewPortfolioItem({ title: '', type: '', url: '' });
                    }}
                  >
                    <Text style={[styles.buttonText, { color: colors.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addItemButton, { backgroundColor: colors.primary }]}
                    onPress={addPortfolioItem}
                  >
                    <Text style={[styles.buttonText, { color: '#000000' }]}>
                      Add
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {portfolio.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.portfolioItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.portfolioItemContent}>
                  <Text style={[styles.portfolioItemTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  {item.type && (
                    <Text style={[styles.portfolioItemType, { color: colors.textSecondary }]}>
                      {item.type}
                    </Text>
                  )}
                  {item.url && (
                    <Text
                      style={[styles.portfolioItemUrl, { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      {item.url}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => removePortfolioItem(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color={colors.error || '#FF3B30'} />
                </TouchableOpacity>
              </View>
            ))}

            {portfolio.length === 0 && !showPortfolioForm && (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No portfolio items yet. Tap + to add one.
              </Text>
            )}
          </View>

          <Button
            title="Save Changes"
            onPress={handleSave}
            size="large"
            loading={saving}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  portfolioSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  portfolioTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioForm: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  addItemButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  portfolioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  portfolioItemContent: {
    flex: 1,
    marginRight: 12,
  },
  portfolioItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  portfolioItemType: {
    fontSize: 12,
    marginBottom: 4,
  },
  portfolioItemUrl: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  saveButton: {
    marginTop: 8,
  },
});

