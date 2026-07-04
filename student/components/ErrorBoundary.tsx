import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
    Animated,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
} from 'react-native';

interface Props {
    children: ReactNode;
    fallbackComponent?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Production-Grade Error Boundary
 * Catches React component errors and shows friendly fallback UI
 * Prevents white screen crashes
 */
class ErrorBoundary extends Component<Props, State> {
    private fadeAnim: Animated.Value;

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
        this.fadeAnim = new Animated.Value(0);
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so next render shows fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error details
        console.error('🚨 ErrorBoundary caught an error:');
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Component Stack:', errorInfo.componentStack);

        this.setState({
            error,
            errorInfo,
        });

        // Animate error screen in
        Animated.timing(this.fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // TODO: Send error to logging service (e.g., Sentry)
        // Sentry.captureException(error, { extra: errorInfo });
    }

    handleReset = () => {
        // Animate out
        Animated.timing(this.fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
            });
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback component if provided
            if (this.props.fallbackComponent) {
                return this.props.fallbackComponent;
            }

            // Default error UI
            return (
                <Animated.View
                    style={[
                        styles.container,
                        { opacity: this.fadeAnim },
                    ]}
                >
                    <StatusBar barStyle="light-content" />
                    <LinearGradient
                        colors={['#1E293B', '#0F172A']}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.content}>
                        {/* Error Icon */}
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']}
                                style={styles.iconCircle}
                            >
                                <Feather name="alert-triangle" size={64} color="#EF4444" />
                            </LinearGradient>
                        </View>

                        {/* Error Title */}
                        <Text style={styles.title}>Oops! Something went wrong</Text>

                        {/* Error Message */}
                        <Text style={styles.message}>
                            We're sorry for the inconvenience. The app encountered an unexpected error.
                        </Text>

                        {/* Error Details (Development mode only) */}
                        {__DEV__ && this.state.error && (
                            <View style={styles.detailsContainer}>
                                <Text style={styles.detailsTitle}>Error Details (Dev Only):</Text>
                                <Text style={styles.detailsText} numberOfLines={10}>
                                    {this.state.error.toString()}
                                </Text>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                onPress={this.handleReset}
                                activeOpacity={0.8}
                                style={styles.button}
                            >
                                <LinearGradient
                                    colors={['#3B82F6', '#2563EB']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.buttonGradient}
                                >
                                    <Feather name="refresh-cw" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                                    <Text style={styles.buttonText}>Try Again</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Report Button (if logging service enabled) */}
                            {/* <TouchableOpacity
                onPress={() => {
                  // Report to support
                }}
                activeOpacity={0.8}
                style={[styles.button, styles.secondaryButton]}
              >
                <Feather name="send" size={20} color="#94A3B8" style={styles.buttonIcon} />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Report Issue
                </Text>
              </TouchableOpacity> */}
                        </View>

                        {/* Support Text */}
                        <Text style={styles.supportText}>
                            If this problem persists, please contact support.
                        </Text>
                    </View>
                </Animated.View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        marginBottom: 32,
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    detailsContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    detailsTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#EF4444',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailsText: {
        fontSize: 12,
        color: '#F87171',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        lineHeight: 18,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        width: '100%',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        shadowColor: 'transparent',
        elevation: 0,
    },
    secondaryButtonText: {
        color: '#94A3B8',
    },
    supportText: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 24,
        textAlign: 'center',
    },
});

export default ErrorBoundary;
