import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, AuthContext } from '../contexts/AuthContext';
import { UserRole } from '../types';

describe('AuthContext', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.STUDENT,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides authentication state', () => {
    const TestComponent = () => {
      const { isAuthenticated, isLoading } = React.useContext(AuthContext);
      return (
        <div>
          <div data-testid="auth-status">
            {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
          </div>
          <div data-testid="loading-status">
            {isLoading ? 'Loading' : 'Not loading'}
          </div>
        </div>
      );
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');
  });

  it('handles login successfully', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });

    const mockGetUser = vi.fn().mockResolvedValue({
      data: mockUser,
      error: null
    });

    vi.mocked(createClient).mockImplementation(() => ({
      auth: {
        signInWithPassword: mockSignIn,
        getUser: mockGetUser,
        onAuthStateChange: vi.fn(() => ({
          subscription: { unsubscribe: vi.fn() }
        }))
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUser,
          error: null
        })
      }))
    }));

    const TestComponent = () => {
      const { login, isAuthenticated, user } = React.useContext(AuthContext);
      return (
        <div>
          <button
            onClick={() => login('test@example.com', 'password')}
            data-testid="login-button"
          >
            Login
          </button>
          <div data-testid="auth-status">
            {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
          </div>
          <div data-testid="user-email">{user?.email}</div>
        </div>
      );
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await act(async () => {
      await userEvent.click(screen.getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });
});