import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteAccountModal } from '../DeleteAccountModal';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

// API関数のモック
jest.mock('../../services/api', () => ({
  authApi: {
    deleteAccount: jest.fn(),
  },
}));

const mockDeleteAccount = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();

// AuthContextのモック
const mockAuthContext = {
  user: { id: 1, email: 'test@example.com' },
  token: 'test-token',
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  deleteAccount: mockDeleteAccount,
  loading: false,
  isAuthenticated: true,
  setAuthData: jest.fn(),
};

// NotificationContextのモック
const mockNotificationContext = {
  showNotification: jest.fn(),
  showSuccess: mockShowSuccess,
  showError: mockShowError,
  showWarning: jest.fn(),
};

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockAuthContext,
}));

jest.mock('../../contexts/NotificationContext', () => ({
  ...jest.requireActual('../../contexts/NotificationContext'),
  useNotification: () => mockNotificationContext,
}));

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
};

const renderComponent = (props = {}) => {
  const finalProps = { ...defaultProps, ...props };
  return render(
    <AuthProvider>
      <NotificationProvider>
        <DeleteAccountModal {...finalProps} />
      </NotificationProvider>
    </AuthProvider>
  );
};

describe('DeleteAccountModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when modal is closed', () => {
    it('does not render when isOpen is false', () => {
      renderComponent({ isOpen: false });
      expect(screen.queryByText('アカウント削除')).not.toBeInTheDocument();
    });
  });

  describe('when modal is open', () => {
    it('renders the modal with warning message', () => {
      renderComponent();
      
      expect(screen.getByText('アカウント削除')).toBeInTheDocument();
      expect(screen.getByText(/この操作は取り消すことができません/)).toBeInTheDocument();
      expect(screen.getByText(/ユーザーアカウント/)).toBeInTheDocument();
      expect(screen.getByText(/すべてのTodo項目/)).toBeInTheDocument();
    });

    it('renders confirmation input field', () => {
      renderComponent();
      
      expect(screen.getByLabelText(/削除を確認するために/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
    });

    it('renders cancel and delete buttons', () => {
      renderComponent();
      
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
      expect(screen.getByText('アカウントを削除')).toBeInTheDocument();
    });

    it('delete button is disabled when confirmation text is empty', () => {
      renderComponent();
      
      const deleteButton = screen.getByText('アカウントを削除');
      expect(deleteButton).toBeDisabled();
    });

    it('delete button is enabled when "DELETE" is entered', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const confirmationInput = screen.getByPlaceholderText('DELETE');
      await user.type(confirmationInput, 'DELETE');
      
      const deleteButton = screen.getByText('アカウントを削除');
      expect(deleteButton).not.toBeDisabled();
    });

    it('shows error when wrong confirmation text is entered', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const confirmationInput = screen.getByPlaceholderText('DELETE');
      
      await user.type(confirmationInput, 'wrong');
      
      // 削除ボタンが無効化されていることを確認
      const deleteButton = screen.getByText('アカウントを削除');
      expect(deleteButton).toBeDisabled();
      
      // 削除ボタンをクリックしても何も起こらないことを確認
      await user.click(deleteButton);
      
      // エラーメッセージは表示されない（ボタンが無効化されているため）
      expect(mockShowError).not.toHaveBeenCalled();
      expect(mockDeleteAccount).not.toHaveBeenCalled();
    });

    it('calls deleteAccount when correct confirmation is entered', async () => {
      const user = userEvent.setup();
      mockDeleteAccount.mockResolvedValue(undefined);
      renderComponent();
      
      const confirmationInput = screen.getByPlaceholderText('DELETE');
      const deleteButton = screen.getByText('アカウントを削除');
      
      await user.type(confirmationInput, 'DELETE');
      await user.click(deleteButton);
      
      expect(mockDeleteAccount).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith(
          'アカウントが正常に削除されました'
        );
      });
    });

    it('shows error message when deletion fails', async () => {
      const user = userEvent.setup();
      const errorMessage = '削除に失敗しました';
      mockDeleteAccount.mockRejectedValue(new Error(errorMessage));
      renderComponent();
      
      const confirmationInput = screen.getByPlaceholderText('DELETE');
      const deleteButton = screen.getByText('アカウントを削除');
      
      await user.type(confirmationInput, 'DELETE');
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          errorMessage
        );
      });
    });

    it('shows loading state during deletion', async () => {
      const user = userEvent.setup();
      mockDeleteAccount.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();
      
      const confirmationInput = screen.getByPlaceholderText('DELETE');
      const deleteButton = screen.getByText('アカウントを削除');
      
      await user.type(confirmationInput, 'DELETE');
      await user.click(deleteButton);
      
      expect(screen.getByText('削除中...')).toBeInTheDocument();
      expect(deleteButton).toBeDisabled();
    });

    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      renderComponent({ onClose: mockOnClose });
      
      const cancelButton = screen.getByText('キャンセル');
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      renderComponent({ onClose: mockOnClose });
      
      const closeButton = screen.getByText('✕');
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('clears confirmation text when cancelled', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      renderComponent({ onClose: mockOnClose });
      
      const confirmationInput = screen.getByPlaceholderText('DELETE') as HTMLInputElement;
      const cancelButton = screen.getByText('キャンセル');
      
      await user.type(confirmationInput, 'DELETE');
      expect(confirmationInput.value).toBe('DELETE');
      
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});