// 統一エラーハンドリングユーティリティ

export interface ApiError {
  message: string;
  status?: number;
  field?: string;
  code?: string;
}

export interface ValidationErrors {
  [field: string]: string;
}

// APIエラーレスポンスの型定義
export interface ApiErrorResponse {
  error?: string;
  errors?: { [key: string]: string[] };
  message?: string;
}

// エラーメッセージのマッピング
const ERROR_MESSAGES: { [key: string]: string } = {
  // 認証関連
  'invalid_credentials': 'メールアドレスまたはパスワードが正しくありません',
  'unauthorized': '認証が必要です',
  'forbidden': 'アクセス権限がありません',
  'token_expired': 'セッションが期限切れです。再度ログインしてください',
  
  // バリデーション関連
  'email_taken': 'このメールアドレスは既に登録されています',
  'email_invalid': '有効なメールアドレスを入力してください',
  'password_too_short': 'パスワードは8文字以上である必要があります',
  'password_weak': 'パスワードは大文字・小文字・数字をそれぞれ1文字以上含む必要があります',
  
  // ネットワーク関連
  'network_error': 'ネットワークエラーが発生しました。接続を確認してください',
  'server_error': 'サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください',
  'timeout': 'リクエストがタイムアウトしました。再度お試しください',
  
  // 一般的なエラー
  'unknown_error': '予期しないエラーが発生しました',
  'validation_failed': '入力内容に問題があります',
};

// HTTPステータスコードに基づくエラーメッセージ
const STATUS_MESSAGES: { [status: number]: string } = {
  400: '不正なリクエストです',
  401: '認証が必要です',
  403: 'アクセス権限がありません',
  404: 'リソースが見つかりません',
  422: '入力内容に問題があります',
  429: 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください',
  500: 'サーバーエラーが発生しました',
  502: 'サーバーに接続できません',
  503: 'サービスが一時的に利用できません',
  504: 'サーバーの応答がタイムアウトしました',
};

/**
 * APIエラーを統一的に処理する関数
 */
export const handleApiError = (error: any): ApiError => {
  // ネットワークエラーの場合
  if (!error.response && error.request) {
    return {
      message: ERROR_MESSAGES.network_error,
      code: 'network_error',
    };
  }

  // レスポンスがある場合
  if (error.response) {
    const { status, data } = error.response;
    const errorResponse: ApiErrorResponse = data || {};

    // 認証エラーの特別処理
    if (status === 401) {
      return {
        message: ERROR_MESSAGES.unauthorized,
        status,
        code: 'unauthorized',
      };
    }

    // バリデーションエラーの処理
    if (status === 422 && errorResponse.errors) {
      const firstField = Object.keys(errorResponse.errors)[0];
      const firstError = errorResponse.errors[firstField]?.[0];
      
      return {
        message: firstError || ERROR_MESSAGES.validation_failed,
        status,
        field: firstField,
        code: 'validation_error',
      };
    }

    // サーバーから返されたエラーメッセージを使用
    if (errorResponse.error) {
      return {
        message: errorResponse.error,
        status,
      };
    }

    if (errorResponse.message) {
      return {
        message: errorResponse.message,
        status,
      };
    }

    // ステータスコードに基づくメッセージ
    if (STATUS_MESSAGES[status]) {
      return {
        message: STATUS_MESSAGES[status],
        status,
      };
    }
  }

  // Error オブジェクトの場合
  if (error instanceof Error) {
    return {
      message: error.message || ERROR_MESSAGES.unknown_error,
    };
  }

  // その他の場合
  return {
    message: ERROR_MESSAGES.unknown_error,
  };
};

/**
 * バリデーションエラーを処理する関数
 */
export const handleValidationErrors = (error: any): ValidationErrors => {
  const validationErrors: ValidationErrors = {};

  if (error.response?.data?.errors) {
    const serverErrors = error.response.data.errors;
    
    Object.keys(serverErrors).forEach(field => {
      const fieldErrors = serverErrors[field];
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        // 特定のエラーメッセージをマッピング
        let errorMessage = fieldErrors[0];
        
        if (field === 'email' && fieldErrors.includes('has already been taken')) {
          errorMessage = ERROR_MESSAGES.email_taken;
        } else if (field === 'email' && fieldErrors.includes('is invalid')) {
          errorMessage = ERROR_MESSAGES.email_invalid;
        } else if (field === 'password' && fieldErrors.includes('is too short')) {
          errorMessage = ERROR_MESSAGES.password_too_short;
        }
        
        validationErrors[field] = errorMessage;
      }
    });
  }

  return validationErrors;
};

/**
 * 認証エラーかどうかを判定する関数
 */
export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || error.code === 'unauthorized';
};

/**
 * ネットワークエラーかどうかを判定する関数
 */
export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request;
};

/**
 * サーバーエラーかどうかを判定する関数
 */
export const isServerError = (error: any): boolean => {
  return error.response?.status >= 500;
};