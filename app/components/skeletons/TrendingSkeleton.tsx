import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '@/contexts/ThemeContext';

export const TrendingSkeleton = () => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { borderBottomColor: colors.border }]}>
            <Skeleton width={100} height={100} borderRadius={12} />
            <View style={styles.info}>
                <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
                <Skeleton width="70%" height={16} style={{ marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                   <Skeleton width={20} height={20} borderRadius={4} />
                   <Skeleton width={60} height={16} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 8,
    },
    info: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center'
    }
});
