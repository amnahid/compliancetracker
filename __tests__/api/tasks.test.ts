/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/tasks/route';
import Task from '../../lib/models/Task';

// Mock the auth and database dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../lib/mongodb', () => jest.fn());
jest.mock('../../lib/models/Task', () => ({
  Task: {
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe('/api/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return tasks when user is authenticated', async () => {
      const { getServerSession } = require('next-auth');
      const { Task } = require('../../lib/models/Task');
      const connectToDatabase = require('../../lib/mongodb');

      getServerSession.mockResolvedValue({
        user: { email: 'test@example.com', organization: 'test-org' }
      });
      connectToDatabase.mockResolvedValue({});
      Task.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([
            {
              _id: '1',
              title: 'Test Task',
              status: 'pending',
              priority: 'medium'
            }
          ])
        })
      });
      Task.countDocuments.mockResolvedValue(1);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
      expect(data.total).toBe(1);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task when valid data is provided', async () => {
      const { getServerSession } = require('next-auth');
      const { Task } = require('../../lib/models/Task');
      const connectToDatabase = require('../../lib/mongodb');

      getServerSession.mockResolvedValue({
        user: { email: 'test@example.com', organization: 'test-org' }
      });
      connectToDatabase.mockResolvedValue({});
      Task.create.mockResolvedValue({
        _id: '1',
        title: 'New Task',
        description: 'Task description',
        status: 'pending',
        priority: 'medium',
        category: 'training'
      });

      const taskData = {
        title: 'New Task',
        description: 'Task description',
        priority: 'medium',
        category: 'training',
        dueDate: '2024-12-31'
      };

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.task.title).toBe('New Task');
      expect(Task.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Task',
        organization: 'test-org'
      }));
    });
  });
});
