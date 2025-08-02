/**
 * @jest-environment node
 */

import { authOptions } from '../lib/auth';

// Mock NextAuth dependencies
jest.mock('next-auth/providers/credentials', () => {
  return jest.fn(() => ({
    id: 'credentials',
    name: 'credentials',
    type: 'credentials',
  }));
});

jest.mock('../lib/mongodb', () => jest.fn());
jest.mock('../lib/models/User', () => ({
  User: {
    findOne: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('Authentication Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authOptions', () => {
    it('should have correct session configuration', () => {
      expect(authOptions.session.strategy).toBe('jwt');
    });

    it('should have credentials provider configured', () => {
      expect(authOptions.providers).toHaveLength(1);
      expect(authOptions.providers[0]).toBeDefined();
    });

    it('should have correct callback configuration', () => {
      expect(authOptions.callbacks).toBeDefined();
      expect(authOptions.callbacks.jwt).toBeDefined();
      expect(authOptions.callbacks.session).toBeDefined();
    });
  });

  describe('JWT callback', () => {
    it('should add user data to token', async () => {
      const token = {};
      const user = {
        id: '1',
        email: 'test@example.com',
        role: 'admin',
        organization: 'test-org'
      };

      const result = await authOptions.callbacks.jwt({ token, user });

      expect(result.role).toBe('admin');
      expect(result.organization).toBe('test-org');
    });
  });

  describe('Session callback', () => {
    it('should add token data to session', async () => {
      const session = {
        user: { email: 'test@example.com' }
      };
      const token = {
        sub: '1',
        role: 'admin',
        organization: 'test-org'
      };

      const result = await authOptions.callbacks.session({ session, token });

      expect(result.user.id).toBe('1');
      expect(result.user.role).toBe('admin');
      expect(result.user.organization).toBe('test-org');
    });
  });
});
