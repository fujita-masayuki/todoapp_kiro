import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

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

// Test component to access auth context
const TestComponent: React.FC = () => {
  const { user, login, register, logout, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register('test@example.com', 'password')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // localStorageのモックをリセット（nullを返すように設定）
    localStorageMock.getItem.mockImplementation((key: string) => {
      // テスト中は常にnullを返して、無効なJSONデータを避ける
      return null;
    });
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    // APIクライアントのトークンをクリア
    require('../../services/api').authApi.setToken(null);
  });

  it('provides initial state with no user', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
  });

  it('restores user from localStorage on mount', async () => {
    const mockToken = 'mock-jwt-token';
    const mockUser = { id: 1, email: 'test@example.com', created_at: '2023-01-01' };
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return mockToken;
      if (key === 'auth_user') return JSON.stringify(mockUser);
      return null;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });
  });

  it('handles login successfully', async () => {
    const mockResponse = {
      user: { id: 1, email: 'test@example.com', created_at: '2023-01-01' },
      token: 'new-jwt-token'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password',
      }),
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-jwt-token');
  });

  it('handles register successfully', async () => {
    const mockResponse = {
      user: { id: 1, email: 'test@example.com', created_at: '2023-01-01' },
      token: 'new-jwt-token'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Register').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: {
          email: 'test@example.com',
          password: 'password',
        },
      }),
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-jwt-token');
  });

  it('handles logout', async () => {
    const mockUser = { id: 1, email: 'test@example.com', created_at: '2023-01-01' };
    
    // Set up initial authenticated state
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return 'mock-token';
      if (key === 'auth_user') return JSON.stringify(mockUser);
      return null;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    // Mock logout API call
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out successfully' }),
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
  });

  it('clears user data when token is invalid', async () => {
    // console.errorを一時的に無効化
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const mockToken = 'invalid-token';
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return mockToken;
      if (key === 'auth_user') return 'invalid-json';
      return null;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');

    // console.errorを復元
    console.error = originalConsoleError;
  });
});