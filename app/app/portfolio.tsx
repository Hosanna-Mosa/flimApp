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
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Plus, X, Briefcase } from 'lucide-react-native';
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

export default function PortfolioScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateProfile, token } = useAuth();
  const { userId, name } = useLocalSearchParams<{ userId?: string; name?: string }>();

  const isOwnPortfolio = !userId;

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(
    isOwnPortfolio ? ((user as any)?.portfolio || []) : []
  );
  const [loading, setLoading] = useState<boolean>(!isOwnPortfolio);
  const [saving, setSaving] = useState<boolean>(false);

  const [newPortfolioItem, setNewPortfolioItem] = useState<PortfolioItem>({
    title: '',
    type: '',
    url: '',
  });
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);

  useEffect(() => {
    if (!isOwnPortfolio && userId) {
      loadOtherUserPortfolio();
    }
  }, [userId]);

  const loadOtherUserPortfolio = async () => {
    try {
      setLoading(true);
      const otherUser = await api.user(userId, token || undefined);
      setPortfolio((otherUser as any)?.portfolio || []);
    } catch (err) {
      console.error('Failed to load other user portfolio:', err);
      Alert.alert('Error', 'Failed to load portfolio links');
    } finally {
      setLoading(false);
    }
  };

  const addPortfolioItem = () => {
    if (!newPortfolioItem.title || !newPortfolioItem.url) {
      Alert.alert('Error', 'Please fill in title and URL');
      return;
    }
    if (!newPortfolioItem.url.startsWith('http://') && !newPortfolioItem.url.startsWith('https://')) {
      Alert.alert('Error', 'URL must start with http:// or https://');
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
      await updateProfile({ portfolio } as any);
      Alert.alert('Success', 'Portfolio updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('[Portfolio] Save error:', error);
      Alert.alert('Error', error.message || 'Failed to save portfolio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: name ? `${name}'s Portfolio` : 'Portfolio',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: isOwnPortfolio ? 'Manage Portfolio' : `${name || 'User'}'s Portfolio`,
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <Briefcase size={40} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text style={[styles.title, { color: colors.text }]}>
              {isOwnPortfolio ? 'Showcase Your Work' : `${name || 'User'}'s Portfolio`}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isOwnPortfolio 
                ? 'Add links to your videos, articles, websites, or social profile pages.'
                : `Check out projects, reels, and works shared by ${name || 'them'}.`
              }
            </Text>
          </View>

          <View style={styles.portfolioSection}>
            <View style={styles.portfolioHeader}>
              <Text style={[styles.portfolioTitle, { color: colors.text }]}>
                Project Links ({portfolio.length})
              </Text>
              {isOwnPortfolio && !showPortfolioForm && (
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowPortfolioForm(true)}
                >
                  <Plus size={20} color="#000000" />
                </TouchableOpacity>
              )}
            </View>

            {isOwnPortfolio && showPortfolioForm && (
              <View
                style={[
                  styles.portfolioForm,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Input
                  label="Project Title"
                  placeholder="e.g., Short Film, Commercial"
                  value={newPortfolioItem.title}
                  onChangeText={(text) =>
                    setNewPortfolioItem({ ...newPortfolioItem, title: text })
                  }
                />
                <Input
                  label="Category / Role"
                  placeholder="e.g., Actor, Director, Editor"
                  value={newPortfolioItem.type}
                  onChangeText={(text) =>
                    setNewPortfolioItem({ ...newPortfolioItem, type: text })
                  }
                  containerStyle={{ marginTop: 12 }}
                />
                <Input
                  label="URL Link"
                  placeholder="https://youtube.com/..."
                  value={newPortfolioItem.url}
                  onChangeText={(text) =>
                    setNewPortfolioItem({ ...newPortfolioItem, url: text })
                  }
                  keyboardType="url"
                  autoCapitalize="none"
                  containerStyle={{ marginTop: 12 }}
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
                      Add Item
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
                  { backgroundColor: colors.card, borderColor: colors.border },
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
                {isOwnPortfolio && (
                  <TouchableOpacity
                    onPress={() => removePortfolioItem(index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={20} color={colors.error || '#FF3B30'} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {portfolio.length === 0 && !showPortfolioForm && (
              <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {isOwnPortfolio 
                    ? 'No portfolio links added yet.'
                    : 'No portfolio links shared yet.'
                  }
                </Text>
              </View>
            )}
          </View>

          {isOwnPortfolio && (
            <Button
              title="Save Portfolio"
              onPress={handleSave}
              size="large"
              loading={saving}
              style={styles.saveButton}
            />
          )}
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  portfolioSection: {
    marginTop: 10,
    marginBottom: 24,
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  portfolioTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioForm: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  addItemButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
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
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  portfolioItemContent: {
    flex: 1,
    marginRight: 16,
  },
  portfolioItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  portfolioItemType: {
    fontSize: 12,
    marginTop: 2,
  },
  portfolioItemUrl: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  saveButton: {
    marginTop: 10,
  },
});
