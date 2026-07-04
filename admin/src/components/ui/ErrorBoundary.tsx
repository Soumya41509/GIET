import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });

        // TODO: Send error to logging service (e.g., Sentry, LogRocket)
        // logErrorToService(error, errorInfo);
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
                    <div className="max-w-2xl w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-cyan-900/10 border border-white/60 p-8 md:p-12">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center shadow-inner border border-red-100">
                                <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-center text-teal-900 mb-4">
                            Oops! Something went wrong
                        </h1>

                        {/* Description */}
                        <p className="text-center text-slate-600 mb-8 text-lg">
                            We encountered an unexpected error. Don't worry, your data is safe. Please try refreshing the page or contact support if the problem persists.
                        </p>

                        {/* Error Details (Development Only) */}
                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                                <summary className="cursor-pointer font-semibold text-slate-700 hover:text-teal-700 transition-colors">
                                    View Error Details
                                </summary>
                                <div className="mt-4 space-y-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-1">Error Message:</h3>
                                        <p className="text-sm text-red-600 font-mono bg-red-50 p-3 rounded-lg border border-red-100">
                                            {this.state.error.toString()}
                                        </p>
                                    </div>
                                    {this.state.errorInfo && (
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-1">Component Stack:</h3>
                                            <pre className="text-xs text-slate-700 bg-slate-100 p-3 rounded-lg border border-slate-200 overflow-auto max-h-40">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-full shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105 transition-all duration-300"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-3 bg-white border-2 border-teal-500 text-teal-700 font-semibold rounded-full hover:bg-teal-50 transition-all duration-300"
                            >
                                Go to Dashboard
                            </button>
                        </div>

                        {/* Footer */}
                        <p className="text-center text-sm text-slate-400 mt-8">
                            Error ID: {Date.now().toString(36).toUpperCase()}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
