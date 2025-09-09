import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <LoginForm />
        <div className="auth-links">
          <p>
            アカウントをお持ちでない方は{' '}
            <Link to="/register" className="auth-link">
              こちらから登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;