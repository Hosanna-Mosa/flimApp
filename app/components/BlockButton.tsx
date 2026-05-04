import React from 'react';
import { TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

interface BlockButtonProps {
  userId: string;
}

export const BlockButton: React.FC<BlockButtonProps> = ({ userId }) => {
  const { blockUser, blockedUsers } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const isBlocked = blockedUsers.includes(userId);

  if (isBlocked) return null;

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You will no longer see their content.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(userId);
              Alert.alert('User Blocked', 'You will no longer see content from this user.');
              router.back();
            } catch (error) {
              console.log('Block failed:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity 
      onPress={handleBlock} 
      style={[styles.button, { backgroundColor: colors.error + '20', borderColor: colors.error }]}
    >
      <Text style={[styles.text, { color: colors.error }]}>Block User</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    width: '100%',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
