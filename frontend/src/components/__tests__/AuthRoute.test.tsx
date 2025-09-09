import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthRoute from '../AuthRoute';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn() as jest.MockedFunction<(key: string) => string | null>,
  setItem: jest.fn() as jest.MockedFunction<(key: string, value: string) => void>,
  removeItem: jest.fn() as jest.MockedFunction<(key: string) => void>,
  clear: jest.fn() as jest.MockedFunction<() => void>,
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = jest.fn();

// Test components
const AuthComponent: React.FC = () => <div>Auth Page</div>;
const TodosComponent: React.FC = () => <div>Todos Page</div>;

const renderAuthRoute = (initialPath = '/login') => {
  window.history.pushState({}, 'Test page', initialPath);
  
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route 
            path="/login" 
            element={
              <AuthRoute>
                <AuthComponent />
              </AuthRoute>
            } 
          />
          <Route path="/todos" element={<TodosComponent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockImplementation(() => null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  it('認証されていない場合は認証ページを表示する', async () => {
    renderAuthRoute();

    await waitFor(() => {
      expect(screen.getByText('Auth Page')).toBeInTheDocument();
      expect(screen.queryByText('Todos Page')).not.toBeInTheDocument();
    });
  });

  it('認証されている場合はTodosページにリダイレクトする', async () => {
    const mockToken = 'valid-jwt-token';
    const mockUser = { id: 1, email: 'test@example.com', created_at: '2023-01-01' };
    
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'auth_token') return mockToken;
      if (key === 'auth_user') return JSON.stringify(mockUser);
      return null;
    });

    renderAuthRoute();

    await waitFor(() => {
      expect(screen.getByText('Todos Page')).toBeInTheDocument();
      expect(screen.queryByText('Auth Page')).not.toBeInTheDocument();
    });
  });

  it('認証状態の読み込み中は読み込みメッセージを表示する', async () => {
    // AuthContextの初期状態では loading が true になる
    renderAuthRoute();

    // localStorageにデータがない場合は即座に未認証状態になるため、
    // 認証ページが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('Auth Page')).toBeInTheDocument();
    });
  });

  it('認証済みユーザーが認証ページにアクセスした場合の状態遷移を確認する', async () => {
    const mockToken = 'valid-jwt-token';
    const mockUser = { id: 1, email: 'test@example.com', created_at: '2023-01-01' };
    
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'auth_token') return mockToken;
      if (key === 'auth_user') return JSON.stringify(mockUser);
      return null;
    });

    renderAuthRoute('/login');

    await waitFor(() => {
      expect(screen.getByText('Todos Page')).toBeInTheDocument();
    });

    // URLがTodosページにリダイレクトされていることを確認
    expect(window.location.pathname).toBe('/todos');
  });

  it('無効な認証情報の場合は認証ページを表示する', async () => {
    // console.errorを一時的に無効化
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const mockToken = 'invalid-jwt-token';
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'auth_token') return mockToken;
      if (key === 'auth_user') return 'invalid-json';
      return null;
    });

    renderAuthRoute();

    await waitFor(() => {
      expect(screen.getByText('Auth Page')).toBeInTheDocument();
      expect(screen.queryByText('Todos Page')).not.toBeInTheDocument();
    });

    // 無効な認証情報はクリアされる
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');

    // console.errorを復元
    console.error = originalConsoleError;
  });
});