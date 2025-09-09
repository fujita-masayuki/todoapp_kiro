import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterForm from '../RegisterForm';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Mock fetch
global.fetch = jest.fn();

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

const renderRegisterForm = () => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NotificationProvider>
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockImplementation(() => null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  it('renders registration form elements', () => {
    renderRegisterForm();

    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード確認')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'アカウント登録' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderRegisterForm();

    const submitButton = screen.getByRole('button', { name: 'アカウント登録' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
      expect(screen.getByText('パスワードを入力してください')).toBeInTheDocument();
      expect(screen.getByText('パスワード確認を入力してください')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderRegisterForm();

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText('パスワード確認');
    const submitButton = screen.getByRole('button', { name: 'アカウント登録' });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument();
    });
  });

  it('validates password complexity', async () => {
    renderRegisterForm();

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText('パスワード確認');
    const submitButton = screen.getByRole('button', { name: 'アカウント登録' });

    // Test password without special characters
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/特殊文字（@\$!%\*\?&）を1文字以上含む必要があります/)).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    renderRegisterForm();

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText('パスワード確認');
    const submitButton = screen.getByRole('button', { name: 'アカウント登録' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockResponse = {
      user: { id: 1, email: 'test@example.com', created_at: '2023-01-01' },
      token: 'jwt-token'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderRegisterForm();

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText('パスワード確認');
    const submitButton = screen.getByRole('button', { name: 'アカウント登録' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            email: 'test@example.com',
            password: 'Password123!',
          },
        }),
      });
    });
  });

  it('shows loading state during submission', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    renderRegisterForm();

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText('パスワード確認');
    const submitButton = screen.getByRole('button', { name: 'アカウント登録' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('登録中...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('shows password strength indicator', () => {
    renderRegisterForm();

    const passwordInput = screen.getByLabelText('パスワード');
    
    // Test weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    expect(screen.getByText('弱い')).toBeInTheDocument();

    // Test very strong password (includes special character)
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
    expect(screen.getByText('非常に強い')).toBeInTheDocument();
  });
});