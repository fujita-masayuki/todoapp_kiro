import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const { deleteAccount } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE') {
      showError('削除を確認するために "DELETE" と入力してください');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      showSuccess('アカウントが正常に削除されました');
      onClose();
    } catch (error: any) {
      console.error('Account deletion error:', error);
      const errorMessage = error?.apiError?.message || error?.message || 'アカウントの削除に失敗しました';
      showError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-red-600">アカウント削除</h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
            disabled={isDeleting}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            この操作は取り消すことができません。あなたのアカウントと関連するすべてのTodoが完全に削除されます。
          </p>
          
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
            <p className="text-red-800 text-sm font-medium">
              ⚠️ 警告: この操作により以下のデータが削除されます：
            </p>
            <ul className="text-red-700 text-sm mt-2 list-disc list-inside">
              <li>ユーザーアカウント</li>
              <li>すべてのTodo項目</li>
              <li>関連するすべてのデータ</li>
            </ul>
          </div>
          
          <div>
            <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-2">
              削除を確認するために <strong>"DELETE"</strong> と入力してください：
            </label>
            <input
              type="text"
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={isDeleting}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isDeleting}
          >
            キャンセル
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting || confirmationText !== 'DELETE'}
            className={`px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500 ${
              isDeleting || confirmationText !== 'DELETE'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isDeleting ? '削除中...' : 'アカウントを削除'}
          </button>
        </div>
      </div>
    </div>
  );
};