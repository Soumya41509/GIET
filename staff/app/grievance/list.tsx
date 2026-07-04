import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Grievance, GrievanceCard, GrievanceStatus } from '@/components/GrievanceCard';
import { SwipeableGrievanceRow } from '@/components/grievance/SwipeableGrievanceRow';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { globalCache } from '@/lib/cache';
import { studentSupabase } from '@/lib/supabase';

export default function GrievanceListPage() {
    const { filter } = useLocalSearchParams<{ filter: string }>();
    const { colors, theme } = useTheme();
    const { staff } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Confirmation Modal State
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState<{ id: string, status: string } | null>(null);

    const normalizeStatus = (status?: string) => {
        const s = (status || '').trim().toLowerCase();
        if (s === 'in progress') return 'in-progress';
        return s;
    };

    const fetchGrievances = async (isRefresh = false) => {
        try {
            if (!staff) return;
            if (!isRefresh) setLoading(true);
            setError(null);

            const statusFilter = filter as string;
            let query = studentSupabase
                .from('grievances')
                .select('*')
                .order('created_at', { ascending: false });

            if (statusFilter.toLowerCase() === 'all') {
                // No status constraint for "Total Grievances"
            } else if (statusFilter.toLowerCase() === 'unresponsive') {
                // Special case for unresponsive
                query = query.or(`status.ilike.unresponsive,unresponsive_staff_ids.cs.{${staff.id}}`);
            } else if (statusFilter.toLowerCase() === 'submitted') {
                // Submitted card should include pending queue items as well.
                query = query.or('status.ilike.submitted,status.ilike.pending');
            } else if (statusFilter.toLowerCase() === 'in-progress') {
                query = query.or('status.ilike.in-progress,status.ilike.in progress');
            } else {
                query = query.ilike('status', statusFilter);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Apply filters based on staff role (hostel or department)
            let filtered = data || [];

            const staffHostel = staff.hostel_assigned?.trim().toLowerCase() || '';

            filtered = filtered.filter(g => {
                const isAssignedToMe = g.assigned_staff_id === staff.id;
                const isResolvedByMe = g.resolved_by_staff_id === staff.id;
                const isMissedByMe = Array.isArray(g.unresponsive_staff_ids) && g.unresponsive_staff_ids.includes(staff.id);

                // 1. If explicitly tied to this staff, always show
                if (isAssignedToMe || isResolvedByMe || isMissedByMe) return true;

                // 2. ASSIGNMENT PRIVACY: If assigned to someone else, hide it immediately
                if (g.assigned_staff_id && g.assigned_staff_id !== staff.id) return false;

                // 3. STATUS PRIVACY: If it's NOT unassigned/unresponsive, hide it from others
                const normalizedStatus = (g.status || '').trim().toLowerCase();
                const isPubliclyVisible = normalizedStatus === 'submitted' || normalizedStatus === 'pending' || normalizedStatus === 'unresponsive';
                if (!isPubliclyVisible) return false;

                const grievanceHostel = g.hostel?.trim().toLowerCase() || '';

                // 4. Hostel Filter (Strict Isolation)
                if (staffHostel) {
                    if (grievanceHostel) {
                        const sDigit = staffHostel.match(/\d+/)?.[0];
                        const gDigit = grievanceHostel.match(/\d+/)?.[0];

                        // Mismatching building number -> block
                        if (sDigit && gDigit && sDigit !== gDigit) return false;

                        const isMatch = grievanceHostel.includes(staffHostel) ||
                            staffHostel.includes(grievanceHostel) ||
                            (staffHostel.replace(/\s/g, '').includes(grievanceHostel.replace(/\s/g, ''))) ||
                            (grievanceHostel.replace(/\s/g, '').includes(staffHostel.replace(/\s/g, '')));

                        if (!isMatch) return false;
                    } else {
                        // No hostel specified on grievance. 
                        // Only show if it's a 'Hostel' category or matches their department
                        const isHostelCategory = g.category?.toLowerCase() === 'hostel';
                        const isDeptMatch = staff.department && g.category &&
                            staff.department.toLowerCase() === g.category.toLowerCase();

                        if (!isHostelCategory && !isDeptMatch) return false;
                    }
                    return true;
                }

                // 4. Department Filter (for non-hostel staff)
                const isDepartmentMatch = staff.department && g.category &&
                    staff.department.toLowerCase() === g.category.toLowerCase();

                return isDepartmentMatch;
            });

            setGrievances(filtered as Grievance[]);
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to load grievances');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchGrievances();
    }, [filter, staff]);

    const handleStatusUpdate = useCallback((id: string, newStatus: string) => {
        setConfirmTarget({ id, status: newStatus });
        setConfirmVisible(true);
    }, []);

    const processStatusUpdate = async () => {
        if (!confirmTarget || !staff) return;
        const { id, status } = confirmTarget;

        setConfirmVisible(false);
        const currentGrievance = grievances.find(g => g.id === id);
        if (!currentGrievance) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Optimistic Update
        const oldGrievances = [...grievances];
        setGrievances(prev => prev.map(g => g.id === id ? { ...g, status: status as GrievanceStatus } : g));

        try {
            const currentStatus = normalizeStatus(currentGrievance.status);
            if ((currentStatus === 'submitted' || currentStatus === 'pending') && status === 'Resolved') {
                await studentSupabase.from('grievances').update({ status: 'In-progress' }).eq('id', id);
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const updateData: any = { status: status };
            if (status === 'Resolved' || status === 'In-progress') {
                updateData.assigned_staff_id = staff.id;
            }
            if (status === 'Resolved') {
                updateData.resolved_by_staff_id = staff.id;
            }

            const { error: updateError } = await studentSupabase.from('grievances').update(updateData).eq('id', id);
            if (updateError) throw updateError;

            // If the status no longer matches the filter, remove it from list
            const normalizedFilter = normalizeStatus(filter);
            const normalizedUpdatedStatus = normalizeStatus(status);
            const submittedBucket = normalizedFilter === 'submitted' && (normalizedUpdatedStatus === 'submitted' || normalizedUpdatedStatus === 'pending');
            const inProgressBucket = normalizedFilter === 'in-progress' && normalizedUpdatedStatus === 'in-progress';
            const sameBucket = normalizedFilter === 'all' || submittedBucket || inProgressBucket || normalizedUpdatedStatus === normalizedFilter;

            if (!sameBucket) {
                setGrievances(prev => prev.filter(g => g.id !== id));
            }
        } catch (e) {
            console.error("Failed to update status", e);
            Alert.alert("Update Failed", "Could not update status. Reverting.");
            setGrievances(oldGrievances);
        } finally {
            setConfirmTarget(null);
        }
    };

    const handleGrievancePress = (id: string) => {
        const item = grievances.find(g => g.id === id);
        if (item) {
            globalCache.grievances[String(id)] = item;
        }
        router.push({ pathname: "/grievance/[id]", params: { id } });
    };

    const ITEM_HEIGHT = 156;
    const getItemLayout = useCallback((_: any, index: number) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    }), []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.headerContainer}>
                <BlurView intensity={90} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.headerGlass}>
                    <LinearGradient
                        colors={theme === 'dark' ? ['rgba(139, 92, 246, 0.15)', 'rgba(0,0,0,0.2)'] : ['rgba(139, 92, 246, 0.25)', 'rgba(255,255,255,0.3)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={[styles.headerContent, { paddingTop: insets.top, height: insets.top + 60 }]}>
                        <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
                            <Feather name="chevron-left" size={28} color={colors.text} />
                        </AnimatedPressable>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{filter} Grievances</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </BlurView>
            </View>

            {loading ? (
                <View style={styles.listContent}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Skeleton width="40%" height={20} borderRadius={4} style={{ marginBottom: 12 }} />
                            <Skeleton width="90%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
                            <Skeleton width="70%" height={14} borderRadius={4} style={{ marginBottom: 16 }} />
                        </View>
                    ))}
                </View>
            ) : (
                <FlatList
                    data={grievances}
                    renderItem={({ item }) => (
                        <Animated.View entering={FadeInDown.duration(300)}>
                            <SwipeableGrievanceRow
                                item={item}
                                onSwipeRight={() => handleStatusUpdate(item.id, 'In-progress')}
                                onSwipeLeft={() => handleStatusUpdate(item.id, 'Resolved')}
                            >
                                <GrievanceCard grievance={item} onPress={() => handleGrievancePress(item.id)} />
                            </SwipeableGrievanceRow>
                        </Animated.View>
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    getItemLayout={getItemLayout}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchGrievances(true)} colors={[colors.primary]} />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            title={`No ${filter} Grievances`}
                            message={`There are currently no grievances with '${filter}' status.`}
                            icon="inbox"
                        />
                    }
                />
            )}

            <ConfirmModal
                visible={confirmVisible}
                title="Confirm Action"
                message={`Are you sure you want to mark this grievance as ${confirmTarget?.status}?`}
                onConfirm={processStatusUpdate}
                onCancel={() => {
                    setConfirmVisible(false);
                    setConfirmTarget(null);
                }}
                confirmText="Confirm"
                cancelText="Cancel"
                icon={confirmTarget?.status === 'Resolved' ? 'check-circle' : 'loader'}
                type={confirmTarget?.status === 'Resolved' ? 'success' : 'primary'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: {
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 10,
    },
    headerGlass: {
        width: '100%',
        overflow: 'hidden',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: { padding: 20 },
    skeletonCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
});
