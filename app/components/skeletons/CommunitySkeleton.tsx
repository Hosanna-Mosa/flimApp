import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';

export const CommunitySkeleton = () => {
    return (
        <View style={styles.container}>
            <Skeleton width="100%" height={120} borderRadius={12} />
            <View style={{ marginTop: 12 }}>
                <Skeleton width="70%" height={18} style={{ marginBottom: 6 }} />
                <Skeleton width="40%" height={14} />
            </View>
            <View style={styles.footer}>
                 <Skeleton width={80} height={24} borderRadius={12} />
                 <Skeleton width={80} height={24} borderRadius={12} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12
    }
});
