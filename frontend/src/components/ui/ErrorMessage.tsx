'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title = 'Error',
  message = 'Something went wrong. Please try again.',
  onRetry,
  className,
}: ErrorMessageProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  error: Error | null;
  reset?: () => void;
}

export function ErrorState({ error, reset }: ErrorStateProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <ErrorMessage
        message={error?.message || 'Failed to load data'}
        onRetry={reset}
      />
    </div>
  );
}