import React from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { XCircle, CheckCircle, ChevronDown, Loader2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const REJECTION_TEMPLATES = [
    { id: 'out_of_scope', label: 'Out of Institutional Scope', reason: 'This grievance does not fall under institutional jurisdiction. Please contact the relevant external department for assistance.' },
    { id: 'insufficient_info', label: 'Insufficient Information', reason: 'The grievance lacks sufficient details for us to take action. Please submit a new grievance with complete information including dates, locations, and specific incidents.' },
    { id: 'duplicate', label: 'Duplicate Submission', reason: 'This grievance is a duplicate of a previously submitted case. Please refer to your original submission for updates.' },
    { id: 'inappropriate', label: 'Inappropriate Content', reason: 'This grievance contains inappropriate or offensive content that violates institutional guidelines. Please submit a new grievance with professional language.' },
    { id: 'resolved_already', label: 'Already Resolved', reason: 'This issue has already been resolved through other channels. If you believe this is incorrect, please contact the grievance office directly.' },
    { id: 'custom', label: 'Custom Reason', reason: '' },
];

interface RejectModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (reason: string, template: string) => void;
    rejecting: boolean;
}

export const RejectModal: React.FC<RejectModalProps> = ({ visible, onClose, onConfirm, rejecting }) => {
    const { colors, theme } = useTheme();
    const [rejectReason, setRejectReason] = React.useState('');
    const [selectedRejectTemplate, setSelectedRejectTemplate] = React.useState('custom');

    const handleSelectTemplate = (template: any) => {
        setSelectedRejectTemplate(template.id);
        setRejectReason(template.reason);
    };

    const handleConfirm = () => {
        onConfirm(rejectReason, selectedRejectTemplate);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <XCircle size={24} color="#EF4444" style={{ marginRight: 10 }} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Reject Grievance</Text>
                        <TouchableOpacity onPress={onClose} disabled={rejecting}>
                            <XCircle size={24} color={colors.icon} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                        <Text style={[styles.modalLabel, { color: colors.icon }]}>Select Rejection Template</Text>
                        <View style={styles.templateContainer}>
                            {REJECTION_TEMPLATES.map((t) => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[
                                        styles.templateItem,
                                        { borderColor: colors.border },
                                        selectedRejectTemplate === t.id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                                    ]}
                                    onPress={() => handleSelectTemplate(t)}
                                >
                                    <Text style={[styles.templateLabel, { color: selectedRejectTemplate === t.id ? colors.primary : colors.text }]}>{t.label}</Text>
                                    {selectedRejectTemplate === t.id && <CheckCircle size={16} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.modalLabel, { color: colors.icon, marginTop: 20 }]}>Reason For Rejection (Min 10 words)</Text>
                        <TextInput
                            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }]}
                            placeholder="Provide a detailed reason..."
                            placeholderTextColor={colors.icon}
                            multiline
                            numberOfLines={6}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                        />
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={onClose} disabled={rejecting}>
                            <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
                            onPress={handleConfirm}
                            disabled={rejecting}
                        >
                            <Text style={[styles.modalButtonText, { color: '#FFF' }]}>{rejecting ? 'Rejecting...' : 'Confirm Rejection'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 24,
        maxHeight: '80%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'space-between',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    modalBody: {
        padding: 20,
    },
    modalLabel: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    templateContainer: {
        gap: 10,
    },
    templateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    templateLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    textInput: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        textAlignVertical: 'top',
        height: 120,
        fontSize: 14,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
