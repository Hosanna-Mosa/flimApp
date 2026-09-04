import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MapPin, Briefcase, Zap } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Avatar from '@/components/ui/Avatar';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import RoleChipList from '@/components/profile/RoleChipList';
import BoostBadge from '@/components/profile/BoostBadge';

/** The subset of a user both the own and public profile headers can supply. */
export interface ProfileHeaderUser {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  avatar?: string | null;
  bio?: string;
  roles?: string[];
  location?: string;
  experience?: number;
  isBadgeVerified?: boolean;
}

interface ProfileHeaderInfoProps {
  user: ProfileHeaderUser;
  /** Show the boost icon + pill (own profile only; gated to non-iOS inside). */
  boosted?: boolean;
  /**
   * Fill empty name/bio with "Your Name" / "Add a bio…" copy — the own
   * profile invites editing; a public one just omits what is missing.
   */
  placeholders?: boolean;
  /** Private account we do not follow: only avatar, name and handle are shown. */
  limited?: boolean;
  /** When given, renders the "View Portfolio" link in the info block. */
  onPressPortfolio?: () => void;
  /** Item count appended to the portfolio link label. */
  portfolioCount?: number;
}

/**
 * Top of every profile: avatar, name + badges, @handle, roles, bio and the
 * location / experience rows. Purely presentational — pass a user shape.
 */
export default function ProfileHeaderInfo({
  user,
  boosted,
  placeholders = false,
  limited = false,
  onPressPortfolio,
  portfolioCount,
}: ProfileHeaderInfoProps) {
  const { colors } = useTheme();
  const showBoost = !!boosted && Platform.OS !== 'ios';
  const roles = user.roles || [];
  const bio = user.bio || (placeholders ? 'Add a bio to tell others about yourself' : '');
  const experience = user.experience || 0;

  return (
    <View style={styles.header}>
      <Avatar
        uri={user.avatar}
        userId={user._id || user.id}
        name={user.name}
        size={100}
        style={styles.avatar}
      />
      <View style={styles.nameContainer}>
        <Text style={[styles.name, { color: colors.text }]}>
          {user.name || (placeholders ? 'Your Name' : '')}
        </Text>
        <VerifiedBadge visible={user.isBadgeVerified} size={24} />
        {showBoost && <Zap size={22} color="#000" fill="#FFD700" style={styles.boostIcon} />}
      </View>
      <BoostBadge visible={showBoost} />
      <Text style={[styles.username, { color: colors.textSecondary }]}>
        @{user.username || 'username'}
      </Text>

      {!limited && (
        <>
          {(roles.length > 0 || placeholders) && (
            <View style={styles.rolesContainer}>
              <RoleChipList roles={roles} />
            </View>
          )}
          {!!bio && <Text style={[styles.bio, { color: colors.textSecondary }]}>{bio}</Text>}

          <View style={styles.info}>
            {!!user.location && (
              <View style={styles.infoRow}>
                <MapPin size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>{user.location}</Text>
              </View>
            )}
            {experience > 0 && (
              <View style={styles.infoRow}>
                <Briefcase size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  {experience} years experience
                </Text>
              </View>
            )}
            {onPressPortfolio && (
              <TouchableOpacity
                style={[
                  styles.portfolioLink,
                  { borderColor: `${colors.link}4D`, backgroundColor: `${colors.link}0D` },
                ]}
                onPress={onPressPortfolio}
              >
                <Briefcase size={16} color={colors.primary} />
                <Text style={[styles.portfolioLinkText, { color: colors.primary }]}>
                  View Portfolio {portfolioCount ? `(${portfolioCount})` : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  boostIcon: {
    marginLeft: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  rolesContainer: {
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  info: {
    gap: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
  },
  portfolioLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  portfolioLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
