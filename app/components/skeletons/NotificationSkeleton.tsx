import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '@/contexts/ThemeContext';

export const NotificationSkeleton = () => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { borderBottomColor: colors.border }]}>
            <Skeleton width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
                <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
                <Skeleton width="40%" height={12} />
            </View>
            <Skeleton width={40} height={40} borderRadius={4} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
    }
});
