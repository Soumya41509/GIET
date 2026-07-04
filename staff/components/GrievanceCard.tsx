import { useTheme } from '@/contexts/ThemeContext';
import { AlertCircle, Calendar, MapPin } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './ui/AnimatedPressable';

export type GrievanceStatus = 'Pending' | 'pending' | 'Submitted' | 'submitted' | 'In-progress' | 'In Progress' | 'in-progress' | 'Resolved' | 'resolved' | 'Rejected' | 'rejected' | 'Unresponsive' | 'unresponsive';

export interface Grievance {
    id: string;
    title: string;
    category: string;
    priority: 'Low' | 'Medium' | 'High';
    hostel: string;
    status: GrievanceStatus;
    created_at: string;
    assigned_staff_id?: string;
    resolved_by_staff_id?: string;
    current_step?: number;
    escalation_deadline?: string;
    unresponsive_staff_ids?: string[];
}

interface GrievanceCardProps {
    grievance: Grievance;
    onPress: () => void;
}

// Memoized component to prevent unnecessary re-renders in large lists
const GrievanceCardComponent: React.FC<GrievanceCardProps> = ({ grievance, onPress }) => {
    const { colors } = useTheme();

    const getStatusColor = (status: GrievanceStatus) => {
        switch (status) {
            case 'Pending':
            case 'pending': return colors.status.pending;
            case 'Submitted':
            case 'submitted': return colors.status.submitted;
            case 'In-progress':
            case 'In Progress':
            case 'in-progress': return colors.status.inProgress;
            case 'Resolved':
            case 'resolved': return colors.status.resolved;
            case 'Rejected':
            case 'rejected': return '#EF4444';
            case 'Unresponsive':
            case 'unresponsive': return '#F97316';
            default: return colors.text;
        }
    };

    const statusColor = getStatusColor(grievance.status);

    return (
        <AnimatedPressable
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={onPress}
        >
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={[styles.category, { color: colors.primary }]}>{grievance.category}</Text>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{grievance.title}</Text>
                </View>
                {grievance.priority === 'High' && (
                    <View style={[styles.highPriorityBadge, { backgroundColor: colors.status.highPriority }]}>
                        <AlertCircle size={12} color="#fff" />
                        <Text style={styles.highPriorityText}>High</Text>
                    </View>
                )}
            </View>

            <View style={styles.details}>
                <View style={styles.detailItem}>
                    <MapPin size={14} color={colors.icon} />
                    <Text style={[styles.detailText, { color: colors.icon }]}>{grievance.hostel}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Calendar size={14} color={colors.icon} />
                    <Text style={[styles.detailText, { color: colors.icon }]}>{new Date(grievance.created_at).toLocaleDateString()}</Text>
                </View>
            </View>
            <View style={styles.footer}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{grievance.status}</Text>
                </View>
            </View>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 3,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    titleContainer: {
        flex: 1,
        marginRight: 8,
    },
    category: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    highPriorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    highPriorityText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    details: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

// Export memoized version with custom comparison
// Only re-render if grievance data actually changed
export const GrievanceCard = React.memo(
    GrievanceCardComponent,
    (prevProps, nextProps) => {
        // Return true if props are equal (skip re-render)
        // Return false if props changed (do re-render)
        return (
            prevProps.grievance.id === nextProps.grievance.id &&
            prevProps.grievance.status === nextProps.grievance.status &&
            prevProps.grievance.title === nextProps.grievance.title &&
            prevProps.grievance.priority === nextProps.grievance.priority
        );
    }
);
