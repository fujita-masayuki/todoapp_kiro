import { Todo } from '../types/Todo';
import { AuthResponse } from '../types/User';
import { handleApiError } from '../utils/errorHandler';

const API_BASE_URL = 'http://localhost:3001/api/v1';

// 認証トークンを管理するクラス
class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  // 共通のfetchメソッド
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // JWTトークンを自動的にリクエストヘッダーに追加
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // 認証エラー時の自動ログアウト処理
      if (response.status === 401) {
        this.handleAuthError();
      }

      return response;
    } catch (error) {
      // ネットワークエラーなどの場合
      throw error;
    }
  }

  private handleAuthError() {
    // 認証エラー時にトークンをクリアし、ログアウト処理を実行
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    // カスタムイベントを発火してAuthContextに通知
    window.dispatchEvent(new CustomEvent('auth-error'));
  }
}

const apiClient = new ApiClient();

// 認証API
export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || 'ログインに失敗しました');
        (error as any).response = { status: response.status, data: errorData };
        throw error;
      }

      const authResponse: AuthResponse = await response.json();
      
      // トークンをAPIクライアントに設定
      apiClient.setToken(authResponse.token);
      
      return authResponse;
    } catch (error) {
      // 統一エラーハンドリングを適用
      const apiError = handleApiError(error);
      const enhancedError = new Error(apiError.message);
      (enhancedError as any).response = (error as any).response;
      (enhancedError as any).apiError = apiError;
      throw enhancedError;
    }
  },

  async register(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        body: JSON.stringify({ user: { email, password } }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || '登録に失敗しました');
        (error as any).response = { status: response.status, data: errorData };
        throw error;
      }

      const authResponse: AuthResponse = await response.json();
      
      // トークンをAPIクライアントに設定
      apiClient.setToken(authResponse.token);
      
      return authResponse;
    } catch (error) {
      // 統一エラーハンドリングを適用
      const apiError = handleApiError(error);
      const enhancedError = new Error(apiError.message);
      (enhancedError as any).response = (error as any).response;
      (enhancedError as any).apiError = apiError;
      throw enhancedError;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.fetch(`${API_BASE_URL}/sessions`, {
        method: 'DELETE',
      });
    } catch (error) {
      // ログアウトAPIが失敗してもクライアント側のクリーンアップは実行
      console.warn('Logout API failed:', error);
    } finally {
      // トークンをクリア
      apiClient.setToken(null);
    }
  },

  // トークンを設定する関数（AuthContextから呼び出される）
  setToken(token: string | null) {
    apiClient.setToken(token);
  },
};

export const todoApi = {
  async getAllTodos(): Promise<Todo[]> {
    try {
      const response = await apiClient.fetch(`${API_BASE_URL}/todos`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error('Todoの取得に失敗しました');
        (error as any).response = { status: response.status, data: errorData };
        throw error;
      }
      return response.json();
    } catch (error) {
      const apiError = handleApiError(error);
      const enhancedError = new Error(apiError.message);
      (enhancedError as any).response = (error as any).response;
      (enhancedError as any).apiError = apiError;
      throw enhancedError;
    }
  },

  async createTodo(title: string): Promise<Todo> {
    try {
      const response = await apiClient.fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        body: JSON.stringify({ todo: { title, completed: false } }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error('Todoの作成に失敗しました');
        (error as any).response = { status: response.status, data: errorData };
        throw error;
      }
      return response.json();
    } catch (error) {
      const apiError = handleApiError(error);
      const enhancedError = new Error(apiError.message);
      (enhancedError as any).response = (error as any).response;
      (enhancedError as any).apiError = apiError;
      throw enhancedError;
    }
  },

  async updateTodo(id: number, updates: Partial<Todo>): Promise<Todo> {
    try {
      const response = await apiClient.fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ todo: updates }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error('Todoの更新に失敗しました');
        (error as any).response = { status: response.status, data: errorData };
        throw error;
      }
      return response.json();
    } catch (error) {
      const apiError = handleApiError(error);
      const enhancedError = new Error(apiError.message);
      (enhancedError as any).response = (error as any).response;
      (enhancedError as any).apiError = apiError;
      throw enhancedError;
    }
  },

  async deleteTodo(id: number): Promise<void> {
    try {
      const response = await apiClient.fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error('Todoの削除に失敗しました');
        (error as any).response = { status: response.status, data: errorData };
        throw error;
      }
    } catch (error) {
      const apiError = handleApiError(error);
      const enhancedError = new Error(apiError.message);
      (enhancedError as any).response = (error as any).response;
      (enhancedError as any).apiError = apiError;
      throw enhancedError;
    }
  },
};