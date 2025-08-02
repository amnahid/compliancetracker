# Task Management System Documentation

## Overview

The Task Management System provides role-based task assignment and tracking functionality with strict permission controls. Users can only view and interact with tasks according to their role within the organization.

## User Roles & Permissions

### Permission Matrix

| Action | Admin | User/Viewer |
|--------|-------|-------------|
| View Tasks | All organization tasks | Own assigned tasks only |
| Create Tasks | ✅ Can assign to anyone | ✅ Can only assign to self |
| Edit Task Details | ✅ All fields | ❌ Not allowed |
| Update Task Status | ✅ Any task | ✅ Own tasks only |
| Delete Tasks | ✅ Any task | ❌ Not allowed |
| View Documents | All organization documents | Public + assigned restricted documents + own uploads |
| Upload Documents | ✅ Can set any visibility/assignment | ✅ Public documents only |
| Edit Documents | ✅ All documents | ✅ Own uploads only |
| Delete Documents | ✅ Any document | ✅ Own uploads only |
| Access Staff Panel | ✅ Full access | ❌ Access denied |
| Access Billing | ✅ Full access | ❌ Access denied |
| Admin Panel | ✅ Full access | ❌ Access denied |
| Organization Settings | ✅ Full access | ❌ Access denied |

### Admin Permissions
- **Full Task Management**: Create, read, update, and delete any task in their organization
- **Team Assignment**: Can assign tasks to any team member
- **Bulk Operations**: Can manage multiple tasks across the organization
- **Reporting**: Access to organization-wide task analytics and reports

### User/Viewer Permissions
- **Limited Visibility**: Can only see tasks assigned to them
- **Status Updates**: Can mark their tasks as pending, in-progress, or completed
- **Self-Assignment**: Can create new tasks but only assigned to themselves
- **Read-Only Details**: Cannot modify task title, description, due date, priority, or assignee

## API Endpoints

### GET `/api/tasks`
**Purpose**: Retrieve tasks based on user role

**Authentication**: Required
**Authorization**: Organization membership required

**Behavior by Role**:
- **Admin**: Returns all tasks in the organization
- **User/Viewer**: Returns only tasks assigned to the requesting user

**Response Format**:
```json
[
  {
    "_id": "task_id",
    "title": "Task Title",
    "description": "Task description",
    "dueDate": "2025-07-30T09:00:00Z",
    "assignee": "user_id",
    "assigneeName": "John Doe",
    "status": "pending",
    "priority": "medium",
    "category": "hipaa-training",
    "createdAt": "2025-07-25T10:00:00Z"
  }
]
```

### POST `/api/tasks`
**Purpose**: Create a new task

**Authentication**: Required
**Authorization**: Organization membership required

**Permission Rules**:
- **Admin**: Can assign tasks to any organization member
- **User/Viewer**: Can only create tasks assigned to themselves (403 error if trying to assign to others)

**Request Body**:
```json
{
  "title": "Task Title",
  "description": "Optional description",
  "dueDate": "2025-07-30T09:00:00Z",
  "assignee": "user_id",
  "priority": "medium",
  "category": "hipaa-training"
}
```

### PUT `/api/tasks/[id]`
**Purpose**: Update an existing task

**Authentication**: Required
**Authorization**: Organization membership required

**Permission Rules**:
- **Admin**: Can update all fields of any organization task
- **User/Viewer**: Can only update the `status` field of their assigned tasks
  - Attempting to modify other fields returns 403 error
  - Can only access tasks assigned to them (404 if not assigned)

**Admin Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "dueDate": "2025-07-30T09:00:00Z",
  "assignee": "user_id",
  "status": "in-progress",
  "priority": "high",
  "category": "safety-training"
}
```

**User Request Body** (only status allowed):
```json
{
  "status": "completed"
}
```

### DELETE `/api/tasks/[id]`
**Purpose**: Delete a task

**Authentication**: Required
**Authorization**: Admin role required

**Permission Rules**:
- **Admin**: Can delete any task in their organization
- **User/Viewer**: Cannot delete any tasks (403 error)

## User Interface Components

### Task Management Page (`/dashboard/tasks`)

**Admin View**:
- "Add Task" button visible in header
- Can view and interact with all organization tasks
- Full filtering and search capabilities
- Delete and edit options available for all tasks

**User View**:
- No "Add Task" button (unless creating for themselves)
- Can only see tasks assigned to them
- Limited interaction - can only change status
- Appropriate empty state messages

### Task Modal (`TaskModal.tsx`)

**Creating Tasks**:
- **Admin**: Can assign to any team member
- **User**: Can only assign to themselves (dropdown filtered)

**Editing Tasks**:
- **Admin**: All fields editable, delete button visible
- **User**: Only status field editable, other fields disabled/readonly
  - Visual indicators (muted background) show disabled fields
  - Information notice explains permission limitations
  - Delete button hidden
  - Save button text changes to "Update Status"

## Database Schema

### Task Model
```typescript
interface ITask {
  title: string;
  description?: string;
  dueDate: Date;
  assignee: mongoose.Types.ObjectId;  // Reference to User
  organization: string;               // Organization ID
  createdBy: mongoose.Types.ObjectId; // Reference to User who created
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  category: 'hipaa-training' | 'license-renewal' | 'safety-training' | 'documentation' | 'other';
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes
- `{ organization: 1, assignee: 1 }` - Efficient user task queries
- `{ organization: 1, status: 1 }` - Status-based filtering
- `{ organization: 1, dueDate: 1 }` - Due date sorting
- `{ organization: 1, category: 1 }` - Category filtering

## Security Implementation

### API Security
1. **Authentication Check**: All endpoints require valid session
2. **Organization Validation**: Users can only access tasks within their organization
3. **Role-Based Filtering**: Database queries automatically filter based on user role
4. **Permission Validation**: Server-side checks prevent unauthorized operations
5. **Input Validation**: Request body validation ensures data integrity

### UI Security
1. **Role-Based Rendering**: UI elements show/hide based on user permissions
2. **Disabled States**: Form fields visually indicate when editing is not allowed
3. **Error Handling**: Clear error messages for permission violations
4. **Client-Side Validation**: Prevents unnecessary API calls for unauthorized actions

### Administrative Access Controls

#### Document Management System
- **Admin Access**: Full access to all documents including public and restricted visibility settings
- **User Permissions**: Can view public documents, restricted documents they're assigned to, and documents they uploaded
- **Upload Control**: Admins can set visibility and assign users; regular users can only upload public documents
- **Edit/Delete**: Users can only modify documents they uploaded; admins can modify any document

#### Staff Management Panel
- **Admin Access**: Full access to staff management, user creation, role assignments, and invitations
- **User Restriction**: Complete access denial through AuthGuard component with admin role requirement
- **Navigation Controls**: Staff links hidden from non-admin users in both sidebar navigation
- **Route Protection**: Middleware and component-level protection prevents any access attempts

#### Billing System
- **Admin Access**: Full access to billing dashboard, subscription management, and payment history
- **User Restriction**: Complete access denial with informative error page
- **Navigation Controls**: Billing links hidden from non-admin users in both sidebar and dropdown menus
- **Route Protection**: Server-side role validation prevents direct URL access

#### Implementation Details
- **Page-Level Protection**: Staff, billing, and document pages check user role and access permissions
- **Navigation Filtering**: Dashboard layout conditionally renders admin-only links based on role
- **Access Denied UI**: Clean error pages explaining access restrictions for non-admin users
- **Middleware Protection**: Server-side route protection at protected path levels
- **Database Filtering**: Document queries automatically filter based on user permissions and visibility settings

## Error Handling

### Common Error Responses

**403 Forbidden**:
```json
{
  "message": "You can only create tasks assigned to yourself"
}
```

**404 Not Found**:
```json
{
  "message": "Task not found or you do not have permission to modify this task"
}
```

**400 Bad Request**:
```json
{
  "message": "Title, due date, and assignee are required"
}
```

## Dashboard Integration

### Statistics
- Dashboard stats automatically reflect user-specific data
- **Admin**: Organization-wide metrics
- **User**: Personal task metrics only

### Recent Activity
- Activity logs show only relevant activities based on user role
- Task-related activities filtered by permission level

### Reports
- Report generation respects user permissions
- Data automatically filtered based on role and assigned tasks

## Best Practices

### For Administrators
1. **Task Assignment**: Assign tasks based on user roles and capabilities
2. **Due Date Management**: Set realistic deadlines and monitor overdue tasks
3. **Priority Setting**: Use priority levels to help users focus on important tasks
4. **Regular Review**: Monitor task completion rates and team performance

### For Users
1. **Status Updates**: Keep task status current to provide accurate progress tracking
2. **Communication**: Use task comments or external communication for clarification
3. **Time Management**: Focus on high-priority and overdue tasks first
4. **Completion**: Mark tasks as completed promptly for accurate reporting

### For Developers
1. **Permission Checks**: Always validate permissions at the API level
2. **Data Filtering**: Use database-level filtering for performance and security
3. **Error Messages**: Provide clear, actionable error messages
4. **UI Consistency**: Maintain consistent permission-based UI patterns across components

## Future Enhancements

### Potential Features
1. **Task Comments**: Allow communication within tasks
2. **File Attachments**: Support for task-related documents
3. **Subtasks**: Break down complex tasks into smaller items
4. **Time Tracking**: Track time spent on tasks
5. **Notifications**: Email/push notifications for task assignments and deadlines
6. **Task Templates**: Predefined task templates for common compliance activities
7. **Bulk Operations**: Mass task updates for administrators
8. **Advanced Reporting**: More detailed analytics and custom reports

### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live task updates
2. **Offline Support**: Progressive Web App capabilities
3. **Mobile Optimization**: Enhanced mobile experience
4. **API Rate Limiting**: Protect against abuse
5. **Audit Logging**: Detailed change tracking for compliance
6. **Data Export**: CSV/PDF export capabilities
7. **Integration APIs**: Connect with external project management tools

## Troubleshooting

### Common Issues

**Users can't see their tasks**:
1. Check user organization assignment
2. Verify task assignee field is correctly set
3. Confirm user has proper authentication

**Permission errors when editing**:
1. Verify user role in database
2. Check if user is assigned to the task
3. Ensure API endpoints have proper authorization middleware

**Tasks not appearing in dashboard**:
1. Check API response in browser dev tools
2. Verify database connection and indexes
3. Confirm organization filtering is working correctly

### Debug Steps
1. Check browser console for JavaScript errors
2. Monitor API responses in Network tab
3. Verify user session and organization data
4. Check database queries and indexes
5. Review server logs for authentication issues

---

*Last Updated: July 30, 2025*
*Version: 1.0*
