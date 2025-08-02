/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/documents/route';
import Document from '../../lib/models/Document';

// Mock the auth and database dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../lib/mongodb', () => jest.fn());
jest.mock('../../lib/models/Document', () => ({
  Document: {
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe('/api/documents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/documents', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return documents when user is authenticated', async () => {
      const { getServerSession } = require('next-auth');
      const { Document } = require('../../lib/models/Document');
      const connectToDatabase = require('../../lib/mongodb');

      getServerSession.mockResolvedValue({
        user: { email: 'test@example.com', organization: 'test-org' }
      });
      connectToDatabase.mockResolvedValue({});
      Document.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([
            {
              _id: '1',
              name: 'Test Document',
              type: 'policy',
              status: 'active'
            }
          ])
        })
      });
      Document.countDocuments.mockResolvedValue(1);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.documents).toHaveLength(1);
      expect(data.total).toBe(1);
    });
  });

  describe('POST /api/documents', () => {
    it('should create a new document when valid data is provided', async () => {
      const { getServerSession } = require('next-auth');
      const { Document } = require('../../lib/models/Document');
      const connectToDatabase = require('../../lib/mongodb');

      getServerSession.mockResolvedValue({
        user: { email: 'test@example.com', organization: 'test-org' }
      });
      connectToDatabase.mockResolvedValue({});
      Document.create.mockResolvedValue({
        _id: '1',
        name: 'New Document',
        type: 'policy',
        status: 'active',
        version: '1.0'
      });

      const documentData = {
        name: 'New Document',
        type: 'policy',
        version: '1.0',
        expiryDate: '2024-12-31'
      };

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: JSON.stringify(documentData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.document.name).toBe('New Document');
      expect(Document.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Document',
        organization: 'test-org'
      }));
    });
  });
});
