import React from 'react';
import { TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

interface BlockButtonProps {
  userId: string;
}

export const BlockButton: React.FC<BlockButtonProps> = ({ userId }) => {
  const { blockUser, unblockUser, blockedUsers } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const isBlocked = blockedUsers.some((id) => String(id) === String(userId));

  const handleBlockToggle = () => {
    Alert.alert(
      isBlocked ? 'Unblock User' : 'Block User',
      isBlocked
        ? 'Do you want to unblock this user? You can interact again after unblocking.'
        : 'Are you sure you want to block this user? You will no longer be able to interact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlocked ? 'Unblock' : 'Block',
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              if (isBlocked) {
                await unblockUser(userId);
                Alert.alert('User Unblocked', 'You can now interact with this user again.');
              } else {
                await blockUser(userId);
                Alert.alert('User Blocked', 'You can no longer interact with this user.');
                router.back();
              }
            } catch (error) {
              console.log('Block/unblock failed:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity 
      onPress={handleBlockToggle}
      style={[
        styles.button,
        isBlocked
          ? { backgroundColor: colors.primary + '20', borderColor: colors.primary }
          : { backgroundColor: colors.error + '20', borderColor: colors.error },
      ]}
    >
      <Text style={[styles.text, { color: isBlocked ? colors.primary : colors.error }]}>
        {isBlocked ? 'Unblock User' : 'Block User'}
      </Text>
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
