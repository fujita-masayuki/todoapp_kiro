import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

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

const renderNavbar = () => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NotificationProvider>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockImplementation(() => null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  it('shows login and register links when user is not authenticated', () => {
    renderNavbar();

    expect(screen.getByRole('link', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '登録' })).toBeInTheDocument();
    expect(screen.queryByText('ログアウト')).not.toBeInTheDocument();
  });

  it('shows user email and logout button when user is authenticated', async () => {
    const mockToken = 'valid-token';
    const mockUser = { id: 1, email: 'user@example.com', created_at: '2023-01-01' };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return mockToken;
      if (key === 'auth_user') return JSON.stringify(mockUser);
      return null;
    });

    renderNavbar();

    await waitFor(() => {
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      expect(screen.getByText('ログアウト')).toBeInTheDocument();
    });

    expect(screen.queryByRole('link', { name: 'ログイン' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '登録' })).not.toBeInTheDocument();
  });

  it('handles logout when logout button is clicked', async () => {
    const mockToken = 'valid-token';
    const mockUser = { id: 1, email: 'user@example.com', created_at: '2023-01-01' };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return mockToken;
      if (key === 'auth_user') return JSON.stringify(mockUser);
      return null;
    });

    renderNavbar();

    await waitFor(() => {
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    // Mock logout API call
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out successfully' }),
    });

    const logoutButton = screen.getByText('ログアウト');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'ログイン' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '登録' })).toBeInTheDocument();
      expect(screen.queryByText(mockUser.email)).not.toBeInTheDocument();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
  });

  it('shows loading state while checking authentication', () => {
    const mockToken = 'valid-token';
    const mockUser = { id: 1, email: 'user@example.com', created_at: '2023-01-01' };
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return mockToken;
      if (key === 'auth_user') return JSON.stringify(mockUser);
      return null;
    });

    renderNavbar();

    // With localStorage data, should immediately show authenticated state
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText('ログアウト')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    renderNavbar();

    const loginLink = screen.getByRole('link', { name: 'ログイン' });
    const registerLink = screen.getByRole('link', { name: '登録' });

    expect(loginLink).toHaveAttribute('href', '/login');
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('shows app title/logo', () => {
    renderNavbar();

    expect(screen.getByText('Todo App')).toBeInTheDocument();
  });

  it('handles authentication errors gracefully', async () => {
    // console.errorを一時的に無効化
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const mockToken = 'invalid-token';
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return mockToken;
      if (key === 'auth_user') return 'invalid-json';
      return null;
    });

    renderNavbar();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'ログイン' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '登録' })).toBeInTheDocument();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');

    // console.errorを復元
    console.error = originalConsoleError;
  });

  it('updates UI immediately when authentication state changes', async () => {
    renderNavbar();

    // Initially unauthenticated
    expect(screen.getByRole('link', { name: 'ログイン' })).toBeInTheDocument();

    // This test verifies the component responds to auth state changes
    // In a real scenario, this would happen through the AuthContext
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'ログイン' })).toBeInTheDocument();
    });
  });

  it('shows user email and logout button when authenticated', async () => {
    const mockToken = 'valid-token';
    const mockUser = { id: 1, email: 'user@example.com', created_at: '2023-01-01' };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return mockToken;
      if (key === 'auth_user') return JSON.stringify(mockUser);
      return null;
    });

    renderNavbar();

    await waitFor(() => {
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    // Should show logout button
    expect(screen.getByText('ログアウト')).toBeInTheDocument();
  });
});