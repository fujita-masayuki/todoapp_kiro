# 設計文書

## 概要

ユーザーアカウント機能は、既存のTodoアプリケーションにユーザー認証とアクセス制御を追加します。この設計では、Rails APIバックエンドにユーザーモデルと認証機能を実装し、React TypeScriptフロントエンドに認証UI とセッション管理を追加します。

## アーキテクチャ

### 全体構成

```
Frontend (React + TypeScript)
├── 認証コンポーネント (Login, Register)
├── 認証コンテキスト (AuthContext)
├── 保護されたルート (ProtectedRoute)
└── 認証済みTodoアプリ

Backend (Rails API)
├── User モデル (bcrypt認証)
├── 認証コントローラー (Sessions, Users)
├── JWT トークン管理
└── 認証ミドルウェア
```

### 認証フロー

1. ユーザーがログイン情報を送信
2. Rails APIが認証情報を検証
3. 成功時にJWTトークンを発行
4. フロントエンドがトークンをlocalStorageに保存
5. 以降のAPIリクエストでトークンを送信
6. バックエンドがトークンを検証してユーザーを識別

## コンポーネントとインターフェース

### バックエンドコンポーネント

#### 1. User モデル
```ruby
class User < ApplicationRecord
  has_secure_password
  has_many :todos, dependent: :destroy
  
  validates :email, presence: true, uniqueness: true
  validates :password, length: { minimum: 8 }
end
```

#### 2. 認証コントローラー
- `Api::V1::SessionsController` - ログイン/ログアウト
- `Api::V1::UsersController` - ユーザー登録・削除

#### 3. 認証ミドルウェア
- JWTトークンの検証
- 現在のユーザーの設定
- 認証が必要なエンドポイントの保護

#### 4. 更新されたTodosController
- ユーザー固有のTodoのみを返す
- Todo作成時にuser_idを自動設定
- 他のユーザーのTodoへのアクセスを防止

#### 5. アカウント削除機能
- `DELETE /api/v1/users/:id` エンドポイント
- ユーザーアカウントと関連Todoの完全削除
- 削除前の認証確認

### フロントエンドコンポーネント

#### 1. 認証コンテキスト
```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  loading: boolean;
}
```

#### 2. 認証コンポーネント
- `LoginForm` - ログインフォーム
- `RegisterForm` - 登録フォーム
- `AuthLayout` - 認証ページのレイアウト

#### 3. ナビゲーションコンポーネント
- `Navbar` - 認証状態に応じたナビゲーション
- ログイン済み: ユーザーメール + ログアウトボタン + アカウント削除ボタン
- 未ログイン: ログイン + 登録リンク

#### 4. アカウント削除コンポーネント
- `DeleteAccountButton` - アカウント削除ボタン
- `DeleteAccountModal` - 削除確認ダイアログ

#### 5. 保護されたルート
- `ProtectedRoute` - 認証が必要なページを保護
- 未認証ユーザーをログインページにリダイレクト

## データモデル

### User テーブル
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_digest VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

### Todos テーブル（更新）
```sql
ALTER TABLE todos ADD COLUMN user_id BIGINT NOT NULL;
ALTER TABLE todos ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

### データ削除戦略
- ユーザー削除時に関連するすべてのTodoを自動削除（CASCADE）
- 削除操作はトランザクション内で実行
- 削除前の認証確認必須

### TypeScript型定義

#### User型
```typescript
export interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}
```

#### 認証レスポンス型
```typescript
export interface AuthResponse {
  user: User;
  token: string;
}
```

## エラーハンドリング

### バックエンドエラー処理
- 認証失敗: 401 Unauthorized
- 認可失敗: 403 Forbidden
- バリデーションエラー: 422 Unprocessable Entity
- 統一されたエラーレスポンス形式

### フロントエンドエラー処理
- APIエラーの統一処理
- ユーザーフレンドリーなエラーメッセージ
- 認証エラー時の自動ログアウト
- フォームバリデーションエラーの表示

## テスト戦略

### バックエンドテスト
- **単体テスト**
  - User モデルのバリデーション
  - 認証ヘルパーメソッド
  - JWT トークン生成/検証
  
- **統合テスト**
  - 認証API エンドポイント
  - 保護されたTodos API
  - 認証ミドルウェア

### フロントエンドテスト
- **コンポーネントテスト**
  - LoginForm, RegisterForm
  - AuthContext の状態管理
  - ProtectedRoute の動作
  
- **統合テスト**
  - 認証フロー全体
  - API との連携
  - ルーティングとリダイレクト

## セキュリティ考慮事項

### パスワードセキュリティ
- bcrypt を使用したパスワードハッシュ化
- 最小8文字、複雑性要件
- パスワードの平文保存禁止

### トークンセキュリティ
- JWT トークンの適切な有効期限設定
- トークンのローテーション機能
- XSS 攻撃対策（適切なトークン保存）

### API セキュリティ
- CORS 設定の適切な構成
- レート制限の実装検討
- SQL インジェクション対策（Rails の標準機能）

## 実装の段階的アプローチ

### フェーズ1: バックエンド基盤
1. User モデルとマイグレーション
2. 認証コントローラーの実装
3. JWT 認証ミドルウェア
4. Todos コントローラーの更新

### フェーズ2: フロントエンド認証
1. 認証コンテキストの実装
2. ログイン・登録フォーム
3. API サービスの更新
4. 保護されたルートの実装

### フェーズ3: UI/UX 統合
1. ナビゲーションの更新
2. 認証状態の永続化
3. エラーハンドリングの改善
4. ユーザビリティの向上