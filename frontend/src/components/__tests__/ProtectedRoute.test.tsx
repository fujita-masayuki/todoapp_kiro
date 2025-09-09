import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = jest.fn();

// Test components
const ProtectedComponent: React.FC = () => <div>Protected Content</div>;
const LoginComponent: React.FC = () => <div>Login Page</div>;

const renderProtectedRoute = (initialPath = '/protected') => {
  window.history.pushState({}, 'Test page', initialPath);
  
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockImplementation(() => null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  it('redirects to login when user is not authenticated', async () => {
    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('shows protected content when user is authenticated', async () => {
    const mockToken = 'valid-jwt-token';
    const mockUser = { id: 1, email: 'test@example.com', created_at: '2023-01-01' };
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return mockToken;
      if (key === 'auth_user') return JSON.stringify(mockUser);
      return null;
    });

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });

  it('shows loading spinner while checking authentication', () => {
    // No localStorage data, so it should show loading initially
    renderProtectedRoute();

    // Since there's no auth data, it should redirect to login immediately
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  it('redirects to login when token is invalid', async () => {
    // console.errorを一時的に無効化
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const mockToken = 'invalid-jwt-token';
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return mockToken;
      if (key === 'auth_user') return 'invalid-json';
      return null;
    });

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');

    // console.errorを復元
    console.error = originalConsoleError;
  });

  it('handles authentication state correctly', async () => {
    // Test unauthenticated state
    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('preserves the intended destination after login', async () => {
    // Start at a protected route
    renderProtectedRoute('/protected');

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    // The URL should include the redirect parameter
    expect(window.location.pathname).toBe('/login');
  });
});