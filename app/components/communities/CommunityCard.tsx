import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { Community } from '@/types';
import { Users, Lock, ChevronRight, ShieldCheck, Globe } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface CommunityCardProps {
  community: Community;
  onPress: () => void;
  onJoin?: () => void;
  joining?: boolean;
}

export default function CommunityCard({ community, onPress, onJoin, joining }: CommunityCardProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  const handleJoin = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onJoin && !joining) {
      onJoin();
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image
        source={community.avatar || community.coverImage || 'https://via.placeholder.com/80'}
        style={[styles.avatar, { backgroundColor: colors.background }]}
        contentFit="cover"
        transition={200}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {community.name}
          </Text>
          {community.isVerified && (
            <ShieldCheck size={14} color={colors.primary} style={styles.verified} />
          )}
        </View>
        
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {community.description || `${community.type} community for ${community.industry || 'all'}`}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.badge}>
            <Users size={12} color={colors.textSecondary} />
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {community.memberCount} members
            </Text>
          </View>
          
          <View style={styles.badge}>
            {community.privacy === 'public' ? (
              <Globe size={12} color={colors.textSecondary} />
            ) : (
              <Lock size={12} color={colors.textSecondary} />
            )}
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {community.privacy}
            </Text>
          </View>

          {community.industry && (
            <View style={[styles.industryBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.industryText, { color: colors.primary }]}>
                {community.industry}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.action}>
        {community.isMember ? (
          <View style={[styles.memberBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.memberText, { 
              color: ['owner', 'admin'].includes(community.memberRole as string) ? colors.primary : colors.textSecondary 
            }]}>
              {community.memberRole === 'owner' ? 'Owner' : 
               community.memberRole === 'admin' ? 'Admin' : 'Member'}
            </Text>
          </View>
        ) : community.isPending ? (
          <View style={[styles.joinButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}>
             <Text style={[styles.joinText, { color: colors.textSecondary }]}>Requested</Text>
          </View>
        ) : onJoin ? (
          <TouchableOpacity 
            style={[styles.joinButton, { backgroundColor: colors.primary, opacity: joining ? 0.7 : 1 }]}
            onPress={handleJoin}
            disabled={joining}
          >
            <Text style={styles.joinText}>
              {joining ? '...' : (community.privacy === 'public' ? 'Join' : 'Request')}
            </Text>
          </TouchableOpacity>
        ) : (
          <ChevronRight size={20} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  verified: {
    marginLeft: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
  },
  action: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  memberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  industryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  industryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  }
});
