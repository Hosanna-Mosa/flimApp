import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '@/contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const ProfileSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
           <Skeleton width={80} height={80} borderRadius={40} />
        </View>
        <View style={styles.info}>
           <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
           <Skeleton width="40%" height={16} style={{ marginBottom: 4 }} />
           <Skeleton width="50%" height={16} />
        </View>
      </View>

       {/* Stats */}
       <View style={styles.stats}>
          <Skeleton width={60} height={40} />
          <Skeleton width={60} height={40} />
          <Skeleton width={60} height={40} />
       </View>

        {/* Bio */}
        <View style={styles.bio}>
           <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
           <Skeleton width="80%" height={14} />
        </View>

        {/* Tabs/Filter */}
        <View style={styles.tabs}>
           <Skeleton width={80} height={30} borderRadius={15} />
           <Skeleton width={80} height={30} borderRadius={15} />
           <Skeleton width={80} height={30} borderRadius={15} />
        </View>

        {/* Grid Content */}
        <View style={styles.grid}>
             {[1, 2, 3, 4, 5, 6].map(i => (
                 <View key={i} style={styles.gridItem}>
                    <Skeleton width="100%" height="100%" borderRadius={0} />
                 </View>
             ))}
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 20,
  },
  info: {
    flex: 1,
  },
  stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 24,
  },
  bio: {
      marginBottom: 24,
  },
  tabs: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
  },
  grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 2,
  },
  gridItem: {
      width: (SCREEN_WIDTH - 36) / 3,
      height: (SCREEN_WIDTH - 36) / 3,
      marginBottom: 2,
  }
});
