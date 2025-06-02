import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { AuthContext } from '../contexts/AuthContext';
import { UserRole } from '../types';

describe('ProtectedRoute', () => {
  const mockNavigate = vi.fn();

  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => mockNavigate,
      useLocation: () => ({ pathname: '/test', state: {} })
    };
  });

  const renderProtectedRoute = (authContextValue: any) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authContextValue}>
          <Routes>
            <Route
              path="/test"
              element={
                <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  it('renders loading screen when authentication is loading', () => {
    renderProtectedRoute({
      isLoading: true,
      isAuthenticated: false,
      user: null
    });

    expect(screen.getByText('Chargement en cours...')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    renderProtectedRoute({
      isLoading: false,
      isAuthenticated: false,
      user: null
    });

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders protected content for authorized user', () => {
    renderProtectedRoute({
      isLoading: false,
      isAuthenticated: true,
      user: {
        id: '1',
        role: UserRole.STUDENT
      }
    });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects unauthorized user to appropriate dashboard', () => {
    renderProtectedRoute({
      isLoading: false,
      isAuthenticated: true,
      user: {
        id: '1',
        role: UserRole.COMPANY_ADMIN
      }
    });

    expect(mockNavigate).toHaveBeenCalledWith('/company-admin/dashboard', { replace: true });
  });
});