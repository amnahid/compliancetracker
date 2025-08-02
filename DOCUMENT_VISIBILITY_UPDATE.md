# Document Visibility System Update

## Overview

The document management system has been updated to implement more restrictive visibility controls based on user roles and document ownership. This ensures better security and privacy for documents uploaded by normal users.

## Previous Behavior

- **Admins**: Could see all documents in their organization
- **Normal Users**: Could see ALL public documents + restricted documents they were assigned to + documents they uploaded

## New Behavior

### For Administrators
- Can see **all documents** in their organization (no change)
- Can upload documents with full visibility control
- Can assign access to restricted documents
- Public documents uploaded by admins are visible to all users

### For Normal Users
- Can see **only**:
  1. Documents they uploaded themselves
  2. Restricted documents where they are specifically assigned access
  3. Public documents uploaded by administrators only
- **Cannot see** public documents uploaded by other normal users
- When uploading documents marked as "public", they remain private to the uploader and admins

## Key Changes Made

### 1. API Route Updates

#### `/api/documents` (GET)
- **File**: `app/api/documents/route.ts`
- **Change**: Modified query logic for normal users to exclude public documents uploaded by other normal users
- **Logic**: Added filtering to only show public documents uploaded by admins

#### `/api/documents/[id]/download` (GET)
- **File**: `app/api/documents/[id]/download/route.ts`
- **Change**: Updated access control to check uploader role for public documents
- **Logic**: Normal users can only download public documents if uploaded by admin

#### `/api/documents/[id]` (PUT)
- **File**: `app/api/documents/[id]/route.ts`
- **Change**: Simplified modification access to admin + owner only
- **Logic**: Removed ability for users to modify documents just because they're public

### 2. UI Updates

#### Document Upload Modal
- **File**: `components/dashboard/DocumentModal.tsx`
- **Change**: Updated visibility descriptions and added informational note
- **Features**:
  - Dynamic description based on user role
  - Warning note for normal users about public document behavior
  - Clear indication that only admins can make truly public documents

## Security Benefits

1. **Data Privacy**: Normal users' documents remain private unless explicitly shared
2. **Access Control**: Only admins can create organization-wide public documents
3. **Clear Ownership**: Documents are clearly tied to their creators
4. **Granular Permissions**: Restricted documents allow specific user access

## User Experience Impact

### For Normal Users
- **Uploading**: Clear indication that their "public" documents won't be visible to all users
- **Viewing**: Only see relevant documents (their own + admin-shared + specifically assigned)
- **Understanding**: Better clarity about document visibility through UI hints

### For Administrators
- **Full Control**: Can still manage all documents as before
- **Public Sharing**: Can upload truly public documents visible to all users
- **Access Management**: Can assign specific users to restricted documents

## Implementation Details

### Database Query Changes
```typescript
// New query for normal users
Document.find({
  organization: authResult.organization?.id,
  $or: [
    { uploadedBy: currentUser._id },                           // Own documents
    { visibility: 'restricted', assignedTo: currentUser._id }, // Assigned restricted
    { visibility: 'public', uploadedBy: { $in: adminUserIds } } // Admin public only
  ]
});
```

### Access Control Logic
```typescript
// Download/view permissions
const canAccess = isAdmin || 
                  isOwner || 
                  (document.visibility === 'restricted' && document.assignedTo?.includes(currentUser._id)) ||
                  (document.visibility === 'public' && uploaderIsAdmin);
```

## Migration Notes

- **Existing Documents**: All existing documents maintain their current visibility settings
- **No Data Loss**: No documents are deleted or hidden from their original uploaders
- **Backward Compatibility**: Admin functionality remains unchanged
- **Gradual Impact**: Users will gradually notice they see fewer documents, but only those they shouldn't have access to

## Testing Recommendations

1. **Admin Testing**: Verify admins can still see and manage all documents
2. **User Testing**: Confirm normal users only see appropriate documents
3. **Upload Testing**: Test document creation with different visibility settings
4. **Download Testing**: Verify download permissions work correctly
5. **Assignment Testing**: Test restricted document access assignment

## Future Enhancements

1. **Notification System**: Notify users when documents are shared with them
2. **Audit Trail**: Log document access and sharing activities
3. **Bulk Sharing**: Allow admins to share multiple documents at once
4. **Department-Based Access**: Expand access control to department level
5. **Time-Limited Access**: Allow temporary access to documents

## Configuration

No additional configuration is required. The changes are applied automatically when the application starts.

## Support

If users have questions about document visibility:
1. Explain that documents they upload are private by default
2. Direct them to administrators for access to organization-wide documents
3. Show them how to check if they have access to restricted documents in their document list

---

**This update enhances security while maintaining usability for all user types.**
