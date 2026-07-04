import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface StatusBadgeProps {
    status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const { colors } = useTheme();
    let color = colors.status.submitted;

    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'pending') color = colors.status.pending;
    else if (lowerStatus === 'in-progress' || lowerStatus === 'in progress') color = colors.status.inProgress;
    else if (lowerStatus === 'resolved') color = colors.status.resolved;
    else if (lowerStatus === 'rejected') color = '#EF4444';
    else if (lowerStatus === 'unresponsive') color = '#F97316';

    return (
        <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>{status}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});
