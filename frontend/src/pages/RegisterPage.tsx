import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <RegisterForm />
        <div className="auth-links">
          <p>
            既にアカウントをお持ちの方は{' '}
            <Link to="/login" className="auth-link">
              こちらからログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;