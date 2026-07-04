import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface CountdownTimerProps {
    deadline: string;
    status: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ deadline, status }) => {
    const { colors, theme } = useTheme();
    const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number; total: number }>({ h: 0, m: 0, s: 0, total: 0 });

    useEffect(() => {
        const calculate = () => {
            const now = new Date().getTime();
            const target = new Date(deadline).getTime();
            const diff = target - now;

            if (diff <= 0) return { h: 0, m: 0, s: 0, total: 0 };

            return {
                h: Math.floor((diff / (1000 * 60 * 60))),
                m: Math.floor((diff / (1000 * 60)) % 60),
                s: Math.floor((diff / 1000) % 60),
                total: diff
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculate());
        }, 1000);

        setTimeLeft(calculate());
        return () => clearInterval(timer);
    }, [deadline]);

    if (status === 'Resolved' || status === 'Rejected' || status === 'Unresponsive' || timeLeft.total <= 0) return null;

    const isUrgent = timeLeft.total < 15 * 60 * 1000; // < 15 mins
    const isWarning = timeLeft.total < 45 * 60 * 1000; // < 45 mins

    const accentColor = isUrgent ? '#EF4444' : (isWarning ? '#F59E0B' : '#10B981');

    return (
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.timerContainer, { borderColor: accentColor + '40', backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)' }]}>
            <View style={[styles.timerIcon, { backgroundColor: accentColor + '20' }]}>
                <Clock size={20} color={accentColor} />
            </View>
            <View style={styles.timerContent}>
                <Text style={[styles.timerLabel, { color: colors.icon }]}>ESCALATION DEADLINE</Text>
                <View style={styles.row}>
                    <Text style={[styles.timerValue, { color: colors.text }]}>
                        {timeLeft.h.toString().padStart(2, '0')}:
                        {timeLeft.m.toString().padStart(2, '0')}:
                        {timeLeft.s.toString().padStart(2, '0')}
                    </Text>
                    <Text style={[styles.timerUnit, { color: colors.icon }]}> remaining</Text>
                </View>
            </View>
            {isUrgent && (
                <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>URGENT</Text>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
    },
    timerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    timerContent: {
        flex: 1,
    },
    timerLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    timerValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    timerUnit: {
        fontSize: 12,
        fontWeight: '500',
    },
    urgentBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    urgentText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    }
});
