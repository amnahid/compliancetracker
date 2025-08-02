import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/lib/models/Task';
import User from '@/lib/models/User';
import { requireAuthWithOrganization } from '@/lib/organization-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, dueDate, assignee, status, priority, category } = body;

    await connectDB();

    // Get current user from database to check role and get ObjectId
    const currentUser = await User.findOne({ email: authResult.user!.email });
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Build task query based on user role
    let taskQuery: any = { 
      _id: id,
      organization: authResult.organization?.id
    };

    // Non-admin users can only modify tasks assigned to them
    if (currentUser.role !== 'admin') {
      taskQuery.assignee = currentUser._id;
    }

    // Find the existing task first
    const existingTask = await Task.findOne(taskQuery);
    if (!existingTask) {
      return NextResponse.json(
        { message: 'Task not found or you do not have permission to modify this task' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    if (currentUser.role === 'admin') {
      // Admin users can update all fields
      updateData = {
        title,
        description,
        dueDate: new Date(dueDate),
        assignee,
        status,
        priority,
        category,
        updatedAt: new Date()
      };
    } else {
      // Non-admin users can only update the status
      if (title !== existingTask.title || 
          description !== existingTask.description ||
          new Date(dueDate).getTime() !== existingTask.dueDate.getTime() ||
          assignee !== existingTask.assignee.toString() ||
          priority !== existingTask.priority ||
          category !== existingTask.category) {
        return NextResponse.json(
          { message: 'You can only update the status of your assigned tasks' },
          { status: 403 }
        );
      }
      updateData = {
        status,
        updatedAt: new Date()
      };
    }

    // Find and update the task
    const task = await Task.findOneAndUpdate(
      taskQuery,
      updateData,
      { new: true }
    ).populate('assignee', 'name email');

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found or you do not have permission to modify this task' },
        { status: 404 }
      );
    }

    const responseTask = {
      _id: task._id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      assignee: task.assignee._id,
      assigneeName: task.assignee.name,
      status: task.status,
      priority: task.priority,
      category: task.category,
      createdAt: task.createdAt
    };

    return NextResponse.json(responseTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await params;

    await connectDB();

    // Get current user from database to check role and get ObjectId
    const currentUser = await User.findOne({ email: authResult.user!.email });
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Only admin users can delete tasks
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { message: 'Only administrators can delete tasks' },
        { status: 403 }
      );
    }

    // Find and delete the task (admin can delete any task in their organization)
    const task = await Task.findOneAndDelete({
      _id: id,
      organization: authResult.organization?.id
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}