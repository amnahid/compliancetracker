import { cn } from '@/lib/utils';
import { Button as BaseButton, ButtonProps } from '@/components/ui/button';
import { forwardRef } from 'react';

interface HDSButtonProps extends ButtonProps {
  hdsVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'critical' | 'success' | 'warning';
  hdsSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const HDSButton = forwardRef<HTMLButtonElement, HDSButtonProps>(
  ({ className, hdsVariant = 'primary', hdsSize = 'md', children, ...props }, ref) => {
    const hdsVariantClasses = {
      primary: 'hds-btn-primary',
      secondary: 'hds-btn-secondary', 
      outline: 'hds-btn-outline',
      ghost: 'hds-btn-ghost',
      critical: 'hds-btn-critical',
      success: 'hds-btn-success',
      warning: 'hds-btn-warning',
    };

    const hdsSizeClasses = {
      sm: 'hds-btn-sm',
      md: 'hds-btn-md',
      lg: 'hds-btn-lg', 
      xl: 'hds-btn-xl',
    };

    return (
      <BaseButton
        className={cn(
          hdsVariantClasses[hdsVariant],
          hdsSizeClasses[hdsSize],
          'hds-btn-base',
          className
        )}
        {...props}
      >
        {children}
      </BaseButton>
    );
  }
);

HDSButton.displayName = 'HDSButton';

export { HDSButton };
