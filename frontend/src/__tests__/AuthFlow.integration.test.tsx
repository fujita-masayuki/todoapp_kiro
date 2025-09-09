import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

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

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('認証フロー統合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // localStorageのモックを安全に設定
    localStorageMock.getItem.mockImplementation(() => null);
    localStorageMock.setItem.mockImplementation(() => { });
    localStorageMock.removeItem.mockImplementation(() => { });
    // 初期パスをリセット
    window.history.pushState({}, 'Test page', '/');
  });

  it('未認証ユーザーがアプリにアクセスするとログインページにリダイレクトされる', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
    });
  });

  it('ログインフローが正常に動作する', async () => {
    const mockResponse = {
      user: { id: 1, email: 'test@example.com', created_at: '2023-01-01' },
      token: 'jwt-token'
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [], // Todos API のモック
      });

    render(<App />);

    // ログインページが表示されることを確認
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
    });

    // ログインフォームに入力
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(loginButton);

    // ログイン成功後、Todosページにリダイレクトされることを確認
    await waitFor(() => {
      expect(screen.getByText('Todo アプリ')).toBeInTheDocument();
    }, { timeout: 3000 });

    // 認証情報がlocalStorageに保存されることを確認
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockResponse.user));
  });

  it('登録フローが正常に動作する', async () => {
    const mockResponse = {
      user: { id: 1, email: 'newuser@example.com', created_at: '2023-01-01' },
      token: 'new-jwt-token'
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [], // Todos API のモック
      });

    render(<App />);

    // ログインページから登録ページに移動
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
    });

    // 登録ページへのリンクをクリック（ナビゲーションバーから）
    const registerLink = screen.getByText('登録');
    fireEvent.click(registerLink);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'アカウント登録' })).toBeInTheDocument();
    });

    // 登録フォームに入力
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const passwordConfirmationInput = screen.getByLabelText('パスワード確認');
    const registerButton = screen.getByRole('button', { name: 'アカウント登録' });

    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(passwordConfirmationInput, { target: { value: 'Password123!' } });
    fireEvent.click(registerButton);

    // 登録成功後、Todosページにリダイレクトされることを確認
    await waitFor(() => {
      expect(screen.getByText('Todo アプリ')).toBeInTheDocument();
    }, { timeout: 3000 });

    // 認証情報がlocalStorageに保存されることを確認
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-jwt-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockResponse.user));
  });

  it('ログアウトフローが正常に動作する', async () => {
    // 認証済み状態でアプリを開始
    const mockUser = { id: 1, email: 'test@example.com', created_at: '2023-01-01' };
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'auth_token') return 'valid-token';
      if (key === 'auth_user') return JSON.stringify(mockUser);
      return null;
    });

    // ログアウトAPIのモック
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [], // Todos API のモック
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Logged out successfully' }),
      });

    render(<App />);

    // Todosページが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('Todo アプリ')).toBeInTheDocument();
    });

    // ログアウトボタンをクリック
    const logoutButton = screen.getByText('ログアウト');
    fireEvent.click(logoutButton);

    // ログインページにリダイレクトされることを確認
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
    });

    // 認証情報がlocalStorageから削除されることを確認
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
  });

  it('保護されたルートへの直接アクセスがログインページにリダイレクトされる', async () => {
    // 未認証状態で保護されたルートにアクセス
    window.history.pushState({}, 'Test page', '/todos');

    render(<App />);

    // ログインページにリダイレクトされることを確認
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
    });
  });

  it('認証エラー時の処理が正常に動作する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
    });

    // 無効な認証情報でログインを試行
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('メールアドレスまたはパスワードが正しくありません')).toBeInTheDocument();
    });

    // ログインページに留まることを確認
    expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
  });

  it('ネットワークエラー時の処理が正常に動作する', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
    });

    // ログインを試行
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(loginButton);

    // ネットワークエラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getAllByText('Network error')).toHaveLength(2); // フォームとトーストの両方に表示される
    });
  });

  it('認証状態の復元が正常に動作する', async () => {
    // 有効な認証情報をlocalStorageに設定
    const mockUser = { id: 1, email: 'test@example.com', created_at: '2023-01-01' };
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'auth_token') return 'valid-token';
      if (key === 'auth_user') return JSON.stringify(mockUser);
      return null;
    });

    // Todos API のモック
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<App />);

    // 認証状態が復元され、Todosページが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('Todo アプリ')).toBeInTheDocument();
    });

    // ナビゲーションバーにユーザー情報が表示されることを確認
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});