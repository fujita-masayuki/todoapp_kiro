import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from './LoadingSpinner';
import { DeleteAccountModal } from './DeleteAccountModal';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      showSuccess('ログアウトしました');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      showError('ログアウト処理でエラーが発生しましたが、セッションはクリアされました');
      // Even if logout API fails, we still redirect to login
      navigate('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Todo App
        </Link>
        
        <div className="navbar-menu">
          {isAuthenticated ? (
            <div className="navbar-auth">
              <span className="navbar-user-email">{user?.email}</span>
              <div className="navbar-buttons">
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="btn btn-danger navbar-delete-account"
                  disabled={loggingOut}
                  style={{ marginRight: '8px' }}
                >
                  アカウント削除
                </button>
                <button 
                  onClick={handleLogout}
                  className="btn btn-outline navbar-logout"
                  disabled={loggingOut}
                >
                  {loggingOut && <LoadingSpinner size="small" />}
                  {loggingOut ? 'ログアウト中...' : 'ログアウト'}
                </button>
              </div>
            </div>
          ) : (
            <div className="navbar-links">
              <Link to="/login" className="navbar-link">
                ログイン
              </Link>
              <Link to="/register" className="navbar-link">
                登録
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <DeleteAccountModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </nav>
  );
};

export default Navbar;