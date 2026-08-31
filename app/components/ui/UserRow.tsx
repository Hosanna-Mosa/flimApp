import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import Avatar from '@/components/ui/Avatar';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

export interface UserRowUser {
  id: string;
  name: string;
  avatar?: string | null;
  isVerified?: boolean;
}

interface UserRowProps {
  user: UserRowUser;
  avatarSize?: number;
  /** Text or element under the name (roles, bio, last message…). */
  subtitle?: React.ReactNode;
  /** Small text/element on the right of the name line (e.g. a time). */
  meta?: React.ReactNode;
  /** Text appended right after the name (e.g. "(Admin)"). */
  nameSuffix?: React.ReactNode;
  /** Right-side element (buttons, badge, menu). */
  trailing?: React.ReactNode;
  /** Tap handler; defaults to opening the user's profile. */
  onPress?: () => void;
  /** 'card' = rounded card (lists on a page); 'list' = flat row with a bottom divider. */
  variant?: 'card' | 'list';
  /** Emphasise the subtitle (e.g. unread conversation). */
  emphasized?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * One row representing a person — search results, followers, members, join
 * requests, and conversations all render through this, differing only by
 * the slots they fill.
 */
export default function UserRow({
  user,
  avatarSize = 48,
  subtitle,
  meta,
  nameSuffix,
  trailing,
  onPress,
  variant = 'list',
  emphasized,
  style,
}: UserRowProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress =
    onPress ?? (() => router.push({ pathname: '/user/[id]', params: { id: user.id } }));

  return (
    <TouchableOpacity
      style={[
        styles.row,
        variant === 'card'
          ? [styles.card, { backgroundColor: colors.card, borderColor: colors.border }]
          : [styles.list, { borderBottomColor: colors.border }],
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Avatar uri={user.avatar} userId={user.id} name={user.name} size={avatarSize} />
      <View style={styles.body}>
        <View style={styles.nameLine}>
          <View style={styles.nameGroup}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {user.name}
              {nameSuffix}
            </Text>
            <VerifiedBadge visible={user.isVerified} size={14} style={styles.badge} />
          </View>
          {meta !== undefined && (
            typeof meta === 'string' ? (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{meta}</Text>
            ) : (
              meta
            )
          )}
        </View>
        {subtitle !== undefined &&
          (typeof subtitle === 'string' ? (
            <Text
              style={[
                styles.subtitle,
                { color: emphasized ? colors.text : colors.textSecondary },
                emphasized && styles.subtitleEmphasized,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : (
            subtitle
          ))}
      </View>
      {trailing}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  list: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  card: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  badge: {
    marginLeft: 4,
  },
  meta: {
    fontSize: 12,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  subtitleEmphasized: {
    fontWeight: '700',
  },
});
