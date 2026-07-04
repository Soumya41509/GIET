import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { StatusBadge } from './StatusBadge';

interface GrievanceInfoCardProps {
    grievance: any;
}

export const GrievanceInfoCard: React.FC<GrievanceInfoCardProps> = ({ grievance }) => {
    const { colors, theme } = useTheme();

    return (
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)' }]}>
            <BlurView intensity={20} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.cardGlass}>
                <LinearGradient
                    colors={theme === 'dark' ?
                        ['rgba(30, 30, 30, 0.7)', 'rgba(30, 30, 30, 0.3)'] :
                        ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.4)']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardContent}>
                    <View style={styles.rowBetween}>
                        <StatusBadge status={grievance.status} />
                        <Text style={[styles.date, { color: colors.icon }]}>
                            {new Date(grievance.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </Text>
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>{grievance.title}</Text>
                    <Text style={[styles.description, { color: theme === 'dark' ? '#CBD5E1' : '#475569' }]}>
                        {grievance.description}
                    </Text>

                    {grievance.rejection_reason && grievance.status === 'Rejected' && (
                        <View style={[styles.rejectionBox, { backgroundColor: '#EF4444' + '10', borderColor: '#EF4444' + '40' }]}>
                            <Text style={[styles.rejectionTitle, { color: '#EF4444' }]}>REJECTION REASON</Text>
                            <Text style={[styles.rejectionText, { color: colors.text }]}>{grievance.rejection_reason}</Text>
                        </View>
                    )}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 20,
    },
    cardGlass: {
        width: '100%',
    },
    cardContent: {
        padding: 20,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    date: {
        fontSize: 12,
        fontWeight: '600',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 8,
    },
    rejectionBox: {
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    rejectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 8,
    },
    rejectionText: {
        fontSize: 14,
        lineHeight: 20,
    }
});
