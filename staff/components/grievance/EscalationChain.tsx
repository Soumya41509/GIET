import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Layers, Check, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface EscalationChainProps {
    grievance: any;
    escalationSteps: any[];
    staff: any;
    isDeadlinePassed: boolean;
    updating: boolean;
    onManualEscalate: () => void;
}

export const EscalationChain: React.FC<EscalationChainProps> = ({
    grievance,
    escalationSteps,
    staff,
    isDeadlinePassed,
    updating,
    onManualEscalate
}) => {
    const { colors } = useTheme();

    if (!escalationSteps || escalationSteps.length === 0) return null;

    const wasEscalatedAway = (isDeadlinePassed || (grievance.assigned_staff_id && grievance.assigned_staff_id !== staff?.id))
        && grievance.status !== 'Resolved' && grievance.status !== 'Rejected';

    return (
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
            <View style={styles.row}>
                <Layers size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Escalation Chain</Text>
            </View>
            <View style={[styles.chainContainer, { marginTop: 20 }]}>
                {escalationSteps.map((step, idx) => {
                    const isActive = grievance.current_step === step.step_order;
                    const isPast = grievance.current_step > step.step_order;
                    const isCurrentButEscalated = isActive && wasEscalatedAway;

                    return (
                        <View key={idx} style={styles.chainItem}>
                            <View style={[styles.chainCircle,
                            isCurrentButEscalated ? { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' } :
                                isActive ? { backgroundColor: colors.primary, borderColor: colors.primary } :
                                    isPast ? { backgroundColor: colors.primary + '20', borderColor: colors.primary } :
                                        { backgroundColor: 'transparent', borderColor: colors.border }
                            ]}>
                                {isPast ? <Check size={12} color={colors.primary} /> :
                                    isCurrentButEscalated ? <AlertCircle size={12} color="#F59E0B" /> :
                                        <Text style={[styles.chainText, isActive && { color: '#FFF' }]}>{step.step_order}</Text>}
                            </View>
                            <View style={styles.chainContent}>
                                <Text style={[styles.chainLabel, { color: isActive ? colors.text : colors.icon }]}>
                                    Level {step.step_order}{' '}
                                    {isCurrentButEscalated ? '⚠️ (Auto-escalated to higher authority)' :
                                        isActive ? '(Currently with you)' : ''}
                                </Text>
                            </View>
                            {idx < escalationSteps.length - 1 && (
                                <View style={[styles.chainLine, { backgroundColor: colors.border }]} />
                            )}
                        </View>
                    );
                })}
            </View>

            {wasEscalatedAway && (
                <View style={[styles.statusLockedMsg, { backgroundColor: '#F59E0B15', marginTop: 16 }]}>
                    <AlertCircle size={16} color="#F59E0B" />
                    <Text style={[styles.statusLockedText, { color: '#F59E0B' }]}>
                        Deadline passed. This grievance was auto-escalated to the next authority.
                    </Text>
                </View>
            )}

            {!wasEscalatedAway &&
                grievance.status !== 'Resolved' && grievance.status !== 'Rejected' &&
                grievance.assigned_staff_id === staff?.id &&
                escalationSteps.some(s => s.step_order > (grievance.current_step || 1)) && (
                    <Animated.View entering={FadeInDown.delay(200)}>
                        <TouchableOpacity
                            style={[styles.manualEscalateButton, { borderColor: colors.primary, backgroundColor: colors.primary + '05' }]}
                            onPress={onManualEscalate}
                            disabled={updating}
                        >
                            <Layers size={16} color={colors.primary} />
                            <Text style={[styles.manualEscalateText, { color: colors.primary }]}>
                                {updating ? 'Processing...' : 'Escalate to Next Level'}
                            </Text>
                        </TouchableOpacity>
                        <Text style={[styles.helperText, { color: colors.icon }]}>
                            Use this if you are unable to resolve this issue yourself.
                        </Text>
                    </Animated.View>
                )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    chainContainer: {
        marginBottom: 10,
    },
    chainItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    chainCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    chainText: {
        fontSize: 12,
        fontWeight: '700',
    },
    chainContent: {
        marginLeft: 12,
        flex: 1,
    },
    chainLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    chainLine: {
        position: 'absolute',
        top: 30,
        left: 14,
        width: 2,
        height: 16,
        zIndex: 1,
    },
    statusLockedMsg: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    statusLockedText: {
        fontSize: 13,
        flex: 1,
    },
    manualEscalateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 20,
        gap: 10,
    },
    manualEscalateText: {
        fontSize: 15,
        fontWeight: '700',
    },
    helperText: {
        fontSize: 12,
        marginTop: 10,
        textAlign: 'center',
        opacity: 0.8,
    },
});
