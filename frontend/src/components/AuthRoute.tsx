import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AuthRouteProps {
  children: React.ReactNode;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 認証状態の読み込み中は何も表示しない
  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <div>認証状態を確認中...</div>
      </div>
    );
  }

  // 認証済みの場合はTodosページにリダイレクト
  // ログイン前にアクセスしようとしていたページがあればそこにリダイレクト
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/todos';
    return <Navigate to={from} replace />;
  }

  // 未認証の場合は認証ページを表示
  return <>{children}</>;
};

export default AuthRoute;