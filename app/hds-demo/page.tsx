import { HDSButton } from '@/components/ui/hds-button';
import { HDSCard } from '@/components/ui/hds-card';
import { HDSBadge } from '@/components/ui/hds-badge';
import { Shield, CheckCircle, AlertTriangle, Clock, Users } from 'lucide-react';

export default function HDSDemo() {
  return (
    <div className="hds-container hds-spacing-lg min-h-screen bg-background">
      {/* Header */}
      <header className="hds-header-section text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Shield className="h-12 w-12 text-primary" />
          <h1 className="hds-heading-4xl">Health Design System</h1>
        </div>
        <p className="hds-text-lg hds-text-muted max-w-2xl mx-auto">
          A comprehensive design system for healthcare compliance applications, 
          following Australian Government Health Design System principles.
        </p>
      </header>

      {/* Buttons Demo */}
      <section className="hds-spacing-md">
        <h2 className="hds-heading-2xl mb-6">HDS Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <HDSButton hdsVariant="primary">Primary Action</HDSButton>
          <HDSButton hdsVariant="secondary">Secondary</HDSButton>
          <HDSButton hdsVariant="outline">Outline</HDSButton>
          <HDSButton hdsVariant="ghost">Ghost</HDSButton>
          <HDSButton hdsVariant="critical">Critical</HDSButton>
          <HDSButton hdsVariant="success">Success</HDSButton>
          <HDSButton hdsVariant="warning">Warning</HDSButton>
        </div>
      </section>

      {/* Badges Demo */}
      <section className="hds-spacing-md">
        <h2 className="hds-heading-2xl mb-6">HDS Badges</h2>
        <div className="flex flex-wrap gap-3">
          <HDSBadge hdsVariant="excellent">Excellent</HDSBadge>
          <HDSBadge hdsVariant="good">Good</HDSBadge>
          <HDSBadge hdsVariant="needs-attention">Needs Attention</HDSBadge>
          <HDSBadge hdsVariant="critical">Critical</HDSBadge>
          <HDSBadge hdsVariant="compliant">Compliant</HDSBadge>
          <HDSBadge hdsVariant="non-compliant">Non-Compliant</HDSBadge>
          <HDSBadge hdsVariant="pending">Pending</HDSBadge>
          <HDSBadge hdsVariant="overdue">Overdue</HDSBadge>
          <HDSBadge hdsVariant="expired">Expired</HDSBadge>
        </div>
      </section>

      {/* Cards Demo */}
      <section className="hds-spacing-md">
        <h2 className="hds-heading-2xl mb-6">HDS Cards</h2>
        <div className="hds-grid-responsive gap-6">
          <HDSCard hdsVariant="metric" hdsShadow="lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="hds-heading-lg">Compliance Score</h3>
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div className="hds-metric-value hds-metric-success">94%</div>
              <p className="hds-metric-description">Excellent compliance rating</p>
            </div>
          </HDSCard>

          <HDSCard hdsVariant="critical" hdsShadow="md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="hds-heading-lg">Overdue Tasks</h3>
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="hds-metric-value hds-metric-critical">3</div>
              <p className="hds-metric-description">Require immediate attention</p>
            </div>
          </HDSCard>

          <HDSCard hdsVariant="warning" hdsShadow="md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="hds-heading-lg">Pending Reviews</h3>
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div className="hds-metric-value hds-metric-warning">7</div>
              <p className="hds-metric-description">Awaiting review</p>
            </div>
          </HDSCard>

          <HDSCard hdsVariant="action" hdsShadow="md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="hds-heading-lg">Team Management</h3>
                <Users className="h-6 w-6 text-primary" />
              </div>
              <p className="hds-text-muted mb-4">Manage your healthcare team members and roles</p>
              <HDSButton hdsVariant="primary" className="w-full">
                Manage Team
              </HDSButton>
            </div>
          </HDSCard>
        </div>
      </section>

      {/* Typography Demo */}
      <section className="hds-spacing-md">
        <h2 className="hds-heading-2xl mb-6">HDS Typography</h2>
        <div className="space-y-4">
          <div>
            <h1 className="hds-heading-4xl">Heading 4XL - Main Title</h1>
            <h2 className="hds-heading-3xl">Heading 3XL - Section Title</h2>
            <h3 className="hds-heading-2xl">Heading 2XL - Subsection</h3>
            <h4 className="hds-heading-xl">Heading XL - Card Title</h4>
            <h5 className="hds-heading-lg">Heading LG - Component Title</h5>
          </div>
          <div>
            <p className="hds-text-lg">Large body text for important information and descriptions.</p>
            <p className="hds-text-base">Base body text for general content and paragraphs.</p>
            <p className="hds-text-sm">Small text for metadata and secondary information.</p>
            <p className="hds-text-xs">Extra small text for captions and fine print.</p>
          </div>
          <div>
            <p className="hds-text-primary">Primary text color</p>
            <p className="hds-text-success">Success text color</p>
            <p className="hds-text-warning">Warning text color</p>
            <p className="hds-text-critical">Critical text color</p>
            <p className="hds-text-muted">Muted text color</p>
          </div>
        </div>
      </section>

      {/* Color System Demo */}
      <section className="hds-spacing-md">
        <h2 className="hds-heading-2xl mb-6">HDS Color System</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="hds-card-primary p-4 rounded-hds-md">
            <div className="text-primary-foreground hds-text-semibold">Primary</div>
            <div className="text-primary-foreground hds-text-sm">Healthcare Blue</div>
          </div>
          <div className="hds-card-success p-4 rounded-hds-md">
            <div className="text-success-foreground hds-text-semibold">Success</div>
            <div className="text-success-foreground hds-text-sm">Compliant Green</div>
          </div>
          <div className="hds-card-warning p-4 rounded-hds-md">
            <div className="text-warning-foreground hds-text-semibold">Warning</div>
            <div className="text-warning-foreground hds-text-sm">Attention Amber</div>
          </div>
          <div className="hds-card-critical p-4 rounded-hds-md">
            <div className="text-destructive-foreground hds-text-semibold">Critical</div>
            <div className="text-destructive-foreground hds-text-sm">Alert Red</div>
          </div>
        </div>
      </section>
    </div>
  );
}
