/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, PUT } from '../../app/api/user/profile/route';
import User from '../../lib/models/User';

// Mock the auth and database dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../lib/mongodb', () => jest.fn());
jest.mock('../../lib/models/User', () => ({
  User: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

describe('/api/user/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/profile', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return user profile when authenticated', async () => {
      const { getServerSession } = require('next-auth');
      const { User } = require('../../lib/models/User');
      const connectToDatabase = require('../../lib/mongodb');

      getServerSession.mockResolvedValue({
        user: { email: 'test@example.com', organization: 'test-org' }
      });
      connectToDatabase.mockResolvedValue({});
      User.findOne.mockResolvedValue({
        _id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization: 'test-org'
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.email).toBe('test@example.com');
    });
  });

  describe('PUT /api/user/profile', () => {
    it('should update user profile when valid data is provided', async () => {
      const { getServerSession } = require('next-auth');
      const { User } = require('../../lib/models/User');
      const connectToDatabase = require('../../lib/mongodb');

      getServerSession.mockResolvedValue({
        user: { email: 'test@example.com', organization: 'test-org' }
      });
      connectToDatabase.mockResolvedValue({});
      User.findOneAndUpdate.mockResolvedValue({
        _id: '1',
        email: 'test@example.com',
        name: 'Updated User',
        role: 'admin',
        organization: 'test-org'
      });

      const profileData = {
        name: 'Updated User',
        phone: '+1234567890'
      };

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.name).toBe('Updated User');
      expect(User.findOneAndUpdate).toHaveBeenCalled();
    });
  });
});
