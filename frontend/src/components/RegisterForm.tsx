import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { handleApiError, handleValidationErrors } from '../utils/errorHandler';
import LoadingSpinner from './LoadingSpinner';

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useNotification();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('8文字以上である必要があります');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('大文字を1文字以上含む必要があります');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('小文字を1文字以上含む必要があります');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('数字を1文字以上含む必要があります');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('特殊文字（@$!%*?&）を1文字以上含む必要があります');
    }
    
    return errors;
  };

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
    } else {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors.join('、');
      }
    }

    // パスワード確認バリデーション
    if (!passwordConfirmation) {
      newErrors.passwordConfirmation = 'パスワード確認を入力してください';
    } else if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = 'パスワードが一致しません';
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
      await register(email, password);
      
      // 登録成功時の処理
      showSuccess('アカウントが作成されました');
      
      // リダイレクト処理
      const from = (location.state as any)?.from?.pathname || '/todos';
      navigate(from, { replace: true });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      // 統一エラーハンドリングを使用
      const apiError = handleApiError(error);
      
      // バリデーションエラーの処理
      const validationErrors = handleValidationErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
      } else {
        // 一般的なエラーの場合
        setErrors({ general: apiError.message });
        showError(apiError.message, '登録エラー');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // パスワード強度インジケーター
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    const errors = validatePassword(password);
    const strength = Math.max(0, 5 - errors.length);
    
    switch (strength) {
      case 0:
      case 1:
        return { strength, label: '弱い', color: '#dc3545' };
      case 2:
        return { strength, label: '普通', color: '#ffc107' };
      case 3:
        return { strength, label: '良い', color: '#fd7e14' };
      case 4:
        return { strength, label: '強い', color: '#17a2b8' };
      case 5:
        return { strength, label: '非常に強い', color: '#28a745' };
      default:
        return { strength: 0, label: '', color: '' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="auth-container">
      <div className={`auth-form ${isSubmitting ? 'form-submitting' : ''}`}>
        <h2>アカウント登録</h2>
        
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
              autoComplete="new-password"
            />
            {password && (
              <div className="password-strength">
                <div className="password-strength-bar">
                  <div 
                    className="password-strength-fill"
                    style={{ 
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }}
                  />
                </div>
                <span 
                  className="password-strength-label"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.label}
                </span>
              </div>
            )}
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
            <div className="password-requirements">
              <small>
                パスワードは8文字以上で、大文字・小文字・数字・特殊文字（@$!%*?&）をそれぞれ1文字以上含む必要があります
              </small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="passwordConfirmation">パスワード確認</label>
            <input
              type="password"
              id="passwordConfirmation"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className={`form-input ${errors.passwordConfirmation ? 'error' : ''}`}
              placeholder="パスワードを再入力"
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {errors.passwordConfirmation && (
              <div className="error-message">{errors.passwordConfirmation}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting && <LoadingSpinner size="small" color="white" />}
            {isSubmitting ? '登録中...' : 'アカウント登録'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;