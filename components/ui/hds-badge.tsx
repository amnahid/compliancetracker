import { cn } from '@/lib/utils';
import { Badge as BaseBadge, BadgeProps } from '@/components/ui/badge';
import { forwardRef } from 'react';

interface HDSBadgeProps extends BadgeProps {
  hdsVariant?: 'default' | 'excellent' | 'good' | 'needs-attention' | 'critical' | 'compliant' | 'non-compliant' | 'pending' | 'overdue' | 'expired';
}

const HDSBadge = forwardRef<HTMLDivElement, HDSBadgeProps>(
  ({ className, hdsVariant = 'default', children, ...props }, ref) => {
    const hdsVariantClasses = {
      default: 'hds-badge-default',
      excellent: 'hds-badge-excellent',
      good: 'hds-badge-good',
      'needs-attention': 'hds-badge-needs-attention',
      critical: 'hds-badge-critical',
      compliant: 'hds-badge-compliant',
      'non-compliant': 'hds-badge-non-compliant',
      pending: 'hds-badge-pending',
      overdue: 'hds-badge-overdue',
      expired: 'hds-badge-expired',
    };

    return (
      <BaseBadge
        className={cn(
          hdsVariantClasses[hdsVariant],
          'hds-badge-base',
          className
        )}
        {...props}
      >
        {children}
      </BaseBadge>
    );
  }
);

HDSBadge.displayName = 'HDSBadge';

export { HDSBadge };
