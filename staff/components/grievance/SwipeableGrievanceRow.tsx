import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated as RNAnimated, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Grievance } from '../GrievanceCard';

interface SwipeableGrievanceRowProps {
    item: Grievance;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    children: React.ReactNode;
}

export const SwipeableGrievanceRow = React.memo(({ item, onSwipeLeft, onSwipeRight, children }: SwipeableGrievanceRowProps) => {
    const swipeableRef = useRef<Swipeable>(null);
    const normalizedStatus = (item.status || '').toLowerCase().trim();
    const isQueueOpen = normalizedStatus === 'submitted' || normalizedStatus === 'pending';

    const renderLeftActions = (progress: any, dragX: any) => {
        // Only show "In Progress" action if it's currently in the open queue.
        if (!isQueueOpen) return null;

        const scale = dragX.interpolate({
            inputRange: [0, 80],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.leftActionContainer}>
                <RNAnimated.View style={[styles.actionIcon, { transform: [{ scale }] }]}>
                    <Feather name="loader" size={24} color="#fff" />
                    <Text style={styles.actionText}>In Progress</Text>
                </RNAnimated.View>
            </View>
        );
    };

    const renderRightActions = (progress: any, dragX: any) => {
        const scale = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.rightActionContainer}>
                <RNAnimated.View style={[styles.actionIcon, { transform: [{ scale }] }]}>
                    <Feather name="check-circle" size={24} color="#fff" />
                    <Text style={styles.actionText}>Resolve</Text>
                </RNAnimated.View>
            </View>
        );
    };

    const close = () => {
        swipeableRef.current?.close();
    };

    const s = (item.status || '').toLowerCase().trim();
    if (s === 'resolved' || s === 'rejected' || s === 'unresponsive') {
        return <>{children}</>;
    }

    return (
        <Swipeable
            ref={swipeableRef}
            friction={2}
            enableTrackpadTwoFingerGesture
            renderLeftActions={renderLeftActions}
            renderRightActions={renderRightActions}
            onSwipeableLeftOpen={() => {
                if (!isQueueOpen) {
                    close();
                    return;
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                close();
                onSwipeRight();
            }}
            onSwipeableRightOpen={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                close();
                onSwipeLeft();
            }}
        >
            {children}
        </Swipeable>
    );
}, (prevProps, nextProps) => {
    // Only re-render if item status changed
    return prevProps.item.id === nextProps.item.id && prevProps.item.status === nextProps.item.status;
});

const styles = StyleSheet.create({
    leftActionContainer: {
        flex: 1,
        backgroundColor: '#38bdf8',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 20,
        marginBottom: 12,
        borderRadius: 14,
    },
    rightActionContainer: {
        flex: 1,
        backgroundColor: '#4ade80',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 20,
        marginBottom: 12,
        borderRadius: 14,
    },
    actionIcon: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
        marginTop: 4,
    },
});
