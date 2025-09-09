import React from 'react';
import { render, screen } from '@testing-library/react';
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

// Simple test component
const TestComponent: React.FC = () => {
  const { user, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
    </div>
  );
};

describe('AuthContext - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
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

  it('renders without crashing', () => {
    render(
      <AuthProvider>
        <div>Test content</div>
      </AuthProvider>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});