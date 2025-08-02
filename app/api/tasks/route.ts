import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task, { ITask } from '@/lib/models/Task';
import User from '@/lib/models/User';
import { requireAuthWithOrganization } from '@/lib/organization-utils';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    await connectDB();

    // Get current user from database to check role and get ObjectId
    const currentUser = await User.findOne({ email: authResult.user!.email });
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let taskQuery: any = { 
      organization: authResult.organization?.id 
    };

    // Filter tasks based on user role
    if (currentUser.role !== 'admin') {
      // Non-admin users can only see tasks assigned to them
      taskQuery.assignee = currentUser._id;
    }
    // Admin users can see all tasks in their organization (no additional filter)

    const tasks = await Task.find(taskQuery)
      .populate('assignee', 'name email')
      .sort({ dueDate: 1 });

    // Transform the data to include assignee name
    const transformedTasks = tasks.map(task => ({
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
    }));

    return NextResponse.json(transformedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const { title, description, dueDate, assignee, priority, category } = body;

    if (!title || !dueDate || !assignee) {
      return NextResponse.json(
        { message: 'Title, due date, and assignee are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the current user by email to get their proper MongoDB _id
    const currentUser = await User.findOne({ email: authResult.user!.email });
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check permissions: non-admin users can only create tasks assigned to themselves
    if (currentUser.role !== 'admin' && assignee !== currentUser._id.toString()) {
      return NextResponse.json(
        { message: 'You can only create tasks assigned to yourself' },
        { status: 403 }
      );
    }

    // Verify the assignee exists and belongs to the same organization
    const assigneeUser = await User.findOne({
      _id: assignee,
      organization: authResult.organization?.id
    });

    if (!assigneeUser) {
      return NextResponse.json(
        { message: 'Invalid assignee' },
        { status: 400 }
      );
    }

    const task = new Task({
      title,
      description,
      dueDate: new Date(dueDate),
      assignee,
      organization: authResult.organization?.id,
      createdBy: currentUser._id,
      priority: priority || 'medium',
      category: category || 'other',
      status: 'pending'
    });

    await task.save();

    // Populate the assignee for response
    await task.populate('assignee', 'name email');

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

    return NextResponse.json(responseTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

