import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSession } from 'next-auth/react';

// Mock all the complex dependencies first
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../components/dashboard/layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const mockSession = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    organization: 'test-org',
    role: 'admin' as const,
  },
  expires: '2024-12-31',
};

// Only import the Dashboard component after all mocks are set up
import Dashboard from '../app/dashboard/page';

describe('Dashboard Page', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        tasks: [],
        documents: [],
        recentActivity: []
      })
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard header', () => {
    render(<Dashboard />);

    expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument();
  });

  it('displays compliance metrics cards', () => {
    render(<Dashboard />);

    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Compliance Score')).toBeInTheDocument();
    expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
  });

  it('shows manage tasks and view documents buttons', () => {
    render(<Dashboard />);

    expect(screen.getByText('Manage Tasks')).toBeInTheDocument();
    expect(screen.getByText('View Documents')).toBeInTheDocument();
  });
});
