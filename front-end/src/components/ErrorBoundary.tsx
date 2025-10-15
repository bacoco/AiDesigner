import { AlertTriangle } from 'lucide-react';
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6">
          <Alert className="bg-red-900/30 border border-red-600/50 text-red-100">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-red-100">Something went wrong</AlertTitle>
            <AlertDescription className="text-sm text-red-200/80">
              {this.state.error?.message ?? 'An unexpected error occurred while rendering the interface.'}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
