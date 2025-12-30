import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '@/contexts/ThemeContext';

export const FeedSkeleton = () => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.header}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={{ marginLeft: 12, flex: 1, gap: 4 }}>
                   <Skeleton width="40%" height={16} />
                   <Skeleton width="25%" height={12} />
                </View>
                <Skeleton width={80} height={28} borderRadius={20} />
            </View>

            {/* Media */}
            <Skeleton width="100%" height={250} borderRadius={0} />

            {/* Content Text */}
            <View style={styles.content}>
               <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
               <Skeleton width="60%" height={14} />
               <Skeleton width="20%" height={12} style={{ marginTop: 8 }} />
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <Skeleton width={60} height={24} />
                <Skeleton width={60} height={24} />
                <Skeleton width={24} height={24} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        borderBottomWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    content: {
        padding: 12,
    },
    actions: {
        flexDirection: 'row',
        padding: 12,
        gap: 24
    }
});
