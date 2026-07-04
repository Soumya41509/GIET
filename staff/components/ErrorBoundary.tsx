import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Updates from 'expo-updates';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react-native';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = async () => {
        try {
            await Updates.reloadAsync();
        } catch (e) {
            // Fallback if Updates.reloadAsync fails
            this.setState({ hasError: false, error: null });
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <StatusBar barStyle="light-content" />
                    <LinearGradient
                        colors={['#0F172A', '#1E293B', '#0F172A']}
                        style={StyleSheet.absoluteFill}
                    />

                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.content}>
                            <View style={styles.iconContainer}>
                                <BlurView intensity={20} tint="dark" style={styles.iconBlur}>
                                    <AlertTriangle size={48} color="#F59E0B" />
                                </BlurView>
                            </View>

                            <Text style={styles.title}>Something went wrong</Text>
                            <Text style={styles.subtitle}>
                                An unexpected error occurred. Don't worry, we've logged the issue and are working on it.
                            </Text>

                            {__DEV__ && (
                                <View style={styles.errorDetails}>
                                    <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
                                </View>
                            )}

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={this.handleReload}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#8B5CF6', '#6366F1']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.gradientButton}
                                    >
                                        <RefreshCcw size={20} color="#FFFFFF" style={styles.buttonIcon} />
                                        <Text style={styles.primaryButtonText}>Reload Application</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={() => this.setState({ hasError: false, error: null })}
                                    activeOpacity={0.7}
                                >
                                    <BlurView intensity={10} tint="light" style={styles.secondaryBlur}>
                                        <Home size={20} color="#FFFFFF" style={styles.buttonIcon} />
                                        <Text style={styles.secondaryButtonText}>Try to Recover</Text>
                                    </BlurView>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>GIET Grievance Staff Portal</Text>
                            <Text style={styles.versionText}>v1.0.0 Stable</Text>
                        </View>
                    </SafeAreaView>
                </View>
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
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        marginBottom: 32,
        borderRadius: 30,
        overflow: 'hidden',
        padding: 2,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
    },
    iconBlur: {
        padding: 24,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    errorDetails: {
        width: '100%',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    errorText: {
        color: '#F43F5E',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradientButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    secondaryBlur: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonIcon: {
        marginRight: 10,
    },
    footer: {
        paddingBottom: 32,
        alignItems: 'center',
    },
    footerText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
    versionText: {
        color: '#475569',
        fontSize: 12,
        marginTop: 4,
    },
});
