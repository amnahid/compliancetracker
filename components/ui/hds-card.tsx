import { cn } from '@/lib/utils';
import { Card as BaseCard } from '@/components/ui/card';
import { forwardRef } from 'react';
import * as React from 'react';

interface HDSCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hdsVariant?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'critical' | 'metric' | 'action';
  hdsShadow?: 'sm' | 'md' | 'lg' | 'xl';
}

const HDSCard = forwardRef<HTMLDivElement, HDSCardProps>(
  ({ className, hdsVariant = 'default', hdsShadow = 'md', children, ...props }, ref) => {
    const hdsVariantClasses = {
      default: 'hds-card-default',
      primary: 'hds-card-primary',
      info: 'hds-card-info',
      success: 'hds-card-success',
      warning: 'hds-card-warning',
      critical: 'hds-card-critical',
      metric: 'hds-card-metric',
      action: 'hds-card-action',
    };

    const hdsShadowClasses = {
      sm: 'hds-shadow-sm',
      md: 'hds-shadow-md',
      lg: 'hds-shadow-lg',
      xl: 'hds-shadow-xl',
    };

    return (
      <BaseCard
        className={cn(
          hdsVariantClasses[hdsVariant],
          hdsShadowClasses[hdsShadow],
          'hds-card-base',
          className
        )}
        {...props}
      >
        {children}
      </BaseCard>
    );
  }
);

HDSCard.displayName = 'HDSCard';

export { HDSCard };
