import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Paperclip, Eye, Camera, ImageIcon, Trash2, Upload } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';

interface AttachmentSectionProps {
    grievance: any;
    onViewAttachment: () => void;
    onUploadProof: () => void;
    onViewProof: (path: string) => void;
    onDeleteProof: (path: string) => void;
    uploadingImage: boolean;
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
    grievance,
    onViewAttachment,
    onUploadProof,
    onViewProof,
    onDeleteProof,
    uploadingImage
}) => {
    const { colors, theme } = useTheme();

    return (
        <View style={styles.section}>
            {/* Student Attachment */}
            {grievance.attachment_count > 0 && (
                <View style={styles.attachmentGroup}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Student Attachment</Text>
                    <AnimatedPressable
                        onPress={onViewAttachment}
                        style={styles.attachmentsContainer}
                    >
                        <View style={[styles.attachmentBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
                            <View style={styles.row}>
                                <Paperclip size={14} color={colors.primary} />
                                <Text style={[styles.attachmentText, { color: colors.primary }]}>View Student Proof</Text>
                            </View>
                            <Eye size={14} color={colors.primary} />
                        </View>
                    </AnimatedPressable>
                </View>
            )}

            {/* Staff Proof Images */}
            <View style={styles.attachmentGroup}>
                <View style={styles.rowBetween}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Action Proof Images</Text>
                    <Text style={[styles.imageLimit, { color: colors.icon }]}>
                        {grievance.image_paths?.length || 0}/2
                    </Text>
                </View>

                <View style={styles.imageGrid}>
                    {(grievance.image_paths || []).map((path: string, idx: number) => (
                        <View key={idx} style={[styles.imageCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                            <Image
                                source={{ uri: `https://rfgvinaslrmofqkeixxu.supabase.co/storage/v1/object/public/grievances/${path}` }}
                                style={styles.proofImage}
                                contentFit="cover"
                            />
                            <View style={styles.imageActions}>
                                <TouchableOpacity
                                    style={[styles.miniAction, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                                    onPress={() => onViewProof(path)}
                                >
                                    <Eye size={16} color="#FFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.miniAction, { backgroundColor: 'rgba(239, 68, 68, 0.8)' }]}
                                    onPress={() => onDeleteProof(path)}
                                >
                                    <Trash2 size={16} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {(!grievance.image_paths || grievance.image_paths.length < 2) && grievance.status === 'Resolved' && (
                        <TouchableOpacity
                            style={[styles.uploadPlaceholder, { borderColor: colors.primary, borderStyle: 'dashed' }]}
                            onPress={onUploadProof}
                            disabled={uploadingImage}
                        >
                            {uploadingImage ? (
                                <Text style={{ color: colors.primary }}>...</Text>
                            ) : (
                                <>
                                    <Upload size={24} color={colors.primary} />
                                    <Text style={[styles.uploadText, { color: colors.primary }]}>Add Proof</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {grievance.status !== 'Resolved' && (
                    <Text style={[styles.helperText, { color: colors.icon }]}>
                        You can upload proof images once the grievance is Resolved.
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 20,
    },
    attachmentGroup: {
        marginBottom: 20,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attachmentsContainer: {
        marginTop: 4,
    },
    attachmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    attachmentText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    imageLimit: {
        fontSize: 12,
        fontWeight: '600',
    },
    imageGrid: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    imageCard: {
        width: 100,
        height: 100,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        position: 'relative',
    },
    proofImage: {
        width: '100%',
        height: '100%',
    },
    imageActions: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        opacity: 0, // Should probably show on press or hover in a real app, but for mobile we can always show or use an overlay
    },
    miniAction: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    uploadText: {
        fontSize: 12,
        fontWeight: '700',
    },
    helperText: {
        fontSize: 12,
        marginTop: 8,
        fontStyle: 'italic',
    }
});
