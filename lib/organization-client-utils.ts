/**
 * Client-side utility functions for organization handling
 * These functions don't require server-side imports
 */

/**
 * Utility function to safely display organization name
 */
export function getOrganizationDisplayName(organization: string | object | null): string {
  if (!organization) return 'No Organization';
  if (typeof organization === 'string') return organization;
  if (typeof organization === 'object' && (organization as any).name) {
    return (organization as any).name;
  }
  return 'Unknown Organization';
}

/**
 * Get organization ID from organization object or string
 */
export function getOrganizationId(organization: string | object | null): string | null {
  if (!organization) return null;
  if (typeof organization === 'string') return organization;
  if (typeof organization === 'object' && (organization as any).id) {
    return (organization as any).id;
  }
  if (typeof organization === 'object' && (organization as any)._id) {
    return (organization as any)._id.toString();
  }
  return null;
}
