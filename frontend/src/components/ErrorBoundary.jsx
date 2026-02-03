import { Component } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        // Log error to console (can send to error tracking service)
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRefresh = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-xl font-bold text-gray-800 mb-2">
                            Something went wrong
                        </h1>

                        <p className="text-gray-500 mb-6">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>

                        <button
                            onClick={this.handleRefresh}
                            className="btn btn-primary inline-flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh Page
                        </button>

                        {/* Show error details in development */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-6 text-left p-4 bg-gray-100 rounded-lg overflow-auto max-h-40">
                                <p className="text-xs font-mono text-red-600">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
