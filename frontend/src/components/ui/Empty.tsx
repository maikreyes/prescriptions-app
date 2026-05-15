'use client';

import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function Empty({
  title = 'No data',
  description = 'There are no items to display.',
  icon,
  className,
}: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon || <Inbox className="w-12 h-12 text-gray-400 mb-4" />}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export function EmptyState({ message = 'No items found' }: { message?: string }) {
  return (
    <div className="min-h-[300px] flex items-center justify-center">
      <Empty title="No results" description={message} />
    </div>
  );
}