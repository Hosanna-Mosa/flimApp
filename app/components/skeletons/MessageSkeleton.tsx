import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '@/contexts/ThemeContext';

export const MessageSkeleton = () => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { borderBottomColor: colors.border }]}>
            <Skeleton width={50} height={50} borderRadius={25} style={{ marginRight: 15 }} />
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Skeleton width="40%" height={16} />
                    <Skeleton width={40} height={12} />
                </View>
                <Skeleton width="60%" height={14} />
            </View>
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
