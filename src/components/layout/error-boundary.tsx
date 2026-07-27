'use client';

import * as React from 'react';
import { ErrorState } from '@/components/ui/states';
import { logger } from '@/lib/logger';

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logger.error('ui:error-boundary', { message: error.message, componentStack: info.componentStack });
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="py-10">
          <ErrorState
            title="Nimadir noto'g'ri ketdi"
            description="Sahifani qayta yuklab ko'ring. Muammo takrorlansa, biroz keyinroq urinib ko'ring."
            onAction={() => this.setState({ hasError: false })}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
