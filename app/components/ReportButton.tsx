import React from 'react';
import { TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface ReportButtonProps {
  type: 'post' | 'user' | 'comment';
  id: string;
  color?: string;
  size?: number;
}

export const ReportButton: React.FC<ReportButtonProps> = ({ type, id, color, size = 24 }) => {
  const { reportContent, blockUser, unblockUser, blockedUsers } = useAuth();
  const { colors } = useTheme();

  const isBlocked = blockedUsers.includes(id);

  const handleAction = () => {
    if (type === 'user') {
      Alert.alert(
        'User Actions',
        'Choose an action',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Report User',
            style: 'destructive',
            onPress: () => confirmReport(),
          },
          {
            text: isBlocked ? 'Unblock User' : 'Block User',
            style: isBlocked ? 'default' : 'destructive',
            onPress: () => isBlocked ? confirmUnblock() : confirmBlock(),
          },
        ]
      );
    } else {
      confirmReport();
    }
  };

  const confirmReport = () => {
    Alert.alert(
      'Report Content',
      `Are you sure you want to report this ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportContent(type, id);
              Alert.alert('Thank you', 'Your report has been submitted for review.');
            } catch (error) {
              console.log('Report failed:', error);
            }
          },
        },
      ]
    );
  };

  const confirmBlock = () => {
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
              await blockUser(id);
              Alert.alert('User Blocked', 'You will no longer see content from this user.');
            } catch (error) {
              console.log('Block failed:', error);
            }
          },
        },
      ]
    );
  };

  const confirmUnblock = () => {
    Alert.alert(
      'Unblock User',
      'Are you sure you want to unblock this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await unblockUser(id);
              Alert.alert('User Unblocked', 'You can now see content from this user.');
            } catch (error) {
              console.log('Unblock failed:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={handleAction} style={styles.button}>
      <MoreVertical size={size} color={color || colors.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
