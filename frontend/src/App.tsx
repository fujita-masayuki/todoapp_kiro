import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Navbar, ErrorBoundary } from './components';
import NotificationContainer from './components/NotificationContainer';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRoute from './components/AuthRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TodosPage from './pages/TodosPage';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="app">
              <Navbar />
              <Routes>
                <Route 
                  path="/login" 
                  element={
                    <AuthRoute>
                      <LoginPage />
                    </AuthRoute>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <AuthRoute>
                      <RegisterPage />
                    </AuthRoute>
                  } 
                />
                <Route 
                  path="/todos" 
                  element={
                    <ProtectedRoute>
                      <TodosPage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/" element={<Navigate to="/todos" replace />} />
              </Routes>
              <NotificationContainer />
            </div>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;