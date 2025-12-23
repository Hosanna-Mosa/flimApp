import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Users } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Button';

export default function CommunityScreen() {
  const { name } = useLocalSearchParams<{ id: string; name: string }>();
  const { colors } = useTheme();
  const [isMember, setIsMember] = React.useState(true);

  const handleJoinLeave = () => {
    if (isMember) {
      Alert.alert(
        'Leave Community',
        'Are you sure you want to leave this community?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => setIsMember(false),
          },
        ]
      );
    } else {
      setIsMember(true);
      Alert.alert('Success', 'You have joined the community!');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: name || 'Community',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
          }}
          style={styles.coverImage}
          contentFit="cover"
        />

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={[styles.title, { color: colors.text }]}>{name}</Text>
              <View style={styles.memberInfo}>
                <Users size={18} color={colors.textSecondary} />
                <Text
                  style={[styles.memberCount, { color: colors.textSecondary }]}
                >
                  1,234 members
                </Text>
              </View>
            </View>
            <Button
              title={isMember ? 'Leave' : 'Join'}
              onPress={handleJoinLeave}
              variant={isMember ? 'outline' : 'primary'}
              size="small"
            />
          </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            A vibrant community for film professionals to connect, share, and
            collaborate on amazing projects.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Posts
          </Text>
          <View
            style={[styles.emptyState, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No posts yet. Be the first to post!
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberCount: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
