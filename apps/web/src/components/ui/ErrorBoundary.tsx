'use client';

import { Component, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-[40vh] flex items-center justify-center p-8 text-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-lg font-medium text-aph-ink mb-2">Something went wrong</p>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="text-aph-gold hover:underline text-sm"
              >
                Try again
              </button>
            </motion.div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
