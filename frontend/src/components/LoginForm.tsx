import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { handleApiError, handleValidationErrors, isAuthError } from '../utils/errorHandler';
import LoadingSpinner from './LoadingSpinner';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useNotification();

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // メールバリデーション
    if (!email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // パスワードバリデーション
    if (!password) {
      newErrors.password = 'パスワードを入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await login(email, password);
      
      // ログイン成功時の処理
      showSuccess('ログインしました');
      
      // リダイレクト処理
      const from = (location.state as any)?.from?.pathname || '/todos';
      navigate(from, { replace: true });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      // 統一エラーハンドリングを使用
      const apiError = handleApiError(error);
      
      // 認証エラーの場合
      if (isAuthError(error)) {
        setErrors({ general: 'メールアドレスまたはパスワードが正しくありません' });
      } else {
        // バリデーションエラーの処理
        const validationErrors = handleValidationErrors(error);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
        } else {
          // 一般的なエラーの場合
          setErrors({ general: apiError.message });
          showError(apiError.message, 'ログインエラー');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className={`auth-form ${isSubmitting ? 'form-submitting' : ''}`}>
        <h2>ログイン</h2>
        
        {errors.general && (
          <div className="error-message general-error">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="メールアドレスを入力"
              disabled={isSubmitting}
              autoComplete="email"
            />
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="パスワードを入力"
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting && <LoadingSpinner size="small" color="white" />}
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;