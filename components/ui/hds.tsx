// Health Design System (HDS) - Healthcare Compliance Components
// Based on Australian Government Health Design System

export { HDSButton } from './hds-button';
export { HDSCard } from './hds-card';
export { HDSBadge } from './hds-badge';

// HDS Typography Classes
export const HDSTypography = {
  // Headings
  'hds-heading-xs': 'text-hds-xs font-semibold',
  'hds-heading-sm': 'text-hds-sm font-semibold',
  'hds-heading-base': 'text-hds-base font-semibold',
  'hds-heading-lg': 'text-hds-lg font-semibold',
  'hds-heading-xl': 'text-hds-xl font-semibold',
  'hds-heading-2xl': 'text-hds-2xl font-semibold',
  'hds-heading-3xl': 'text-hds-3xl font-bold',
  'hds-heading-4xl': 'text-hds-4xl font-bold',

  // Body text
  'hds-text-xs': 'text-hds-xs',
  'hds-text-sm': 'text-hds-sm',
  'hds-text-base': 'text-hds-base',
  'hds-text-lg': 'text-hds-lg',

  // Text colors
  'hds-text-muted': 'text-muted-foreground',
  'hds-text-primary': 'text-primary',
  'hds-text-success': 'text-success',
  'hds-text-warning': 'text-warning',
  'hds-text-critical': 'text-destructive',
  'hds-text-info': 'text-blue-600 dark:text-blue-400',

  // Text weights
  'hds-text-light': 'font-light',
  'hds-text-normal': 'font-normal',
  'hds-text-medium': 'font-medium',
  'hds-text-semibold': 'font-semibold',
  'hds-text-bold': 'font-bold',
};

// HDS Layout Classes
export const HDSLayout = {
  'hds-container': 'container mx-auto px-6 lg:px-8',
  'hds-header-section': 'mb-8 space-y-2',
  'hds-spacing-xs': 'space-y-2',
  'hds-spacing-sm': 'space-y-4',
  'hds-spacing-md': 'space-y-6',
  'hds-spacing-lg': 'space-y-8',
  'hds-spacing-xl': 'space-y-12',
  'hds-grid-responsive': 'grid gap-4 md:grid-cols-2 lg:grid-cols-4',
};

// HDS Compliance Score Classes
export const HDSCompliance = {
  'hds-score-excellent': 'text-green-600 dark:text-green-400',
  'hds-score-good': 'text-blue-600 dark:text-blue-400', 
  'hds-score-needs-attention': 'text-amber-600 dark:text-amber-400',
  'hds-score-critical': 'text-red-600 dark:text-red-400',
};
