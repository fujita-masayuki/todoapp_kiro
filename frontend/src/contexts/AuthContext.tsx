import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/User';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  setAuthData: (userData: User, authToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // アプリケーション起動時の認証状態復元
  useEffect(() => {
    const restoreAuthState = () => {
      try {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);
        
        if (savedToken && savedUser) {
          // JSONパースの前にデータの妥当性をチェック
          if (savedUser.trim().startsWith('{') && savedUser.trim().endsWith('}')) {
            const parsedUser = JSON.parse(savedUser);
            // ユーザーオブジェクトの基本的な構造をチェック
            if (parsedUser && typeof parsedUser === 'object' && parsedUser.id && parsedUser.email) {
              setToken(savedToken);
              setUser(parsedUser);
              // APIクライアントにトークンを設定
              authApi.setToken(savedToken);
            } else {
              throw new Error('Invalid user data structure');
            }
          } else {
            throw new Error('Invalid JSON format in localStorage');
          }
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
        // エラーが発生した場合は認証情報をクリア
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setLoading(false);
      }
    };

    // 認証エラーイベントのリスナーを設定
    const handleAuthError = () => {
      setUser(null);
      setToken(null);
      // 認証エラー時の通知は呼び出し元で処理
    };

    window.addEventListener('auth-error', handleAuthError);
    restoreAuthState();

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const authResponse = await authApi.login(email, password);
      setAuthData(authResponse.user, authResponse.token);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    try {
      const authResponse = await authApi.register(email, password);
      setAuthData(authResponse.user, authResponse.token);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Logout API failed:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  };

  // 認証状態を永続化するヘルパー関数
  const setAuthData = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
    setAuthData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

