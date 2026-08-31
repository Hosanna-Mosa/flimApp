import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Community } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Section from '@/components/layout/Section';
import CommunityJoinButton from '@/components/communities/CommunityJoinButton';

interface CommunityHeaderProps {
  community: Community | null;
  onJoin: () => void;
}

/**
 * Top of the community detail list: avatar, name + verified shield, member
 * count, description, the join CTA and the "Groups" section label.
 */
export default function CommunityHeader({ community, onJoin }: CommunityHeaderProps) {
  const { colors } = useTheme();

  if (!community) return null;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.content}>
        <Avatar
          uri={community.avatar}
          name={community.name}
          size={64}
          style={[styles.avatar, { borderColor: colors.border }]}
        />

        <View style={styles.titleColumn}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: colors.text }]}>{community.name}</Text>
            {community.isVerified && (
              <ShieldCheck size={16} color={colors.primary} style={styles.verified} />
            )}
          </View>
          <Text style={[styles.stats, { color: colors.textSecondary }]}>
            {community.memberCount} members
          </Text>
        </View>
      </View>

      {community.description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {community.description}
        </Text>
      ) : null}

      <CommunityJoinButton
        isMember={community.isMember}
        isPending={community.isPending}
        onJoin={onJoin}
      />

      <Section title="Groups" style={styles.groupsHeader}>
        {null}
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 16,
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  verified: {
    marginLeft: 6,
  },
  stats: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  groupsHeader: {
    marginBottom: 0,
  },
});
