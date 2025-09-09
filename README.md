# Todo App

React TypeScript + Rails API + MySQL を使用したシンプルなToDoアプリです。

## 構成

- **フロントエンド**: React 18 + TypeScript
- **バックエンド**: Rails 7 API
- **データベース**: MySQL 8.0
- **コンテナ**: Docker + Docker Compose

## セットアップ

1. リポジトリをクローンします：
```bash
git clone <repository-url>
cd todo-app
```

2. Docker Composeでアプリケーションを起動します：
```bash
docker-compose up --build
```

3. 別のターミナルでデータベースのマイグレーションを実行します：
```bash
docker-compose exec backend rails db:migrate
```

## アクセス

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001

## API エンドポイント

- `GET /api/v1/todos` - 全てのTodoを取得
- `POST /api/v1/todos` - 新しいTodoを作成
- `PUT /api/v1/todos/:id` - Todoを更新
- `DELETE /api/v1/todos/:id` - Todoを削除

## 機能

- Todoの追加
- Todoの完了/未完了の切り替え
- Todoの削除
- リアルタイムでのデータ同期

## 開発

### バックエンド（Rails）

```bash
# コンテナに入る
docker-compose exec backend bash

# マイグレーション作成
rails generate migration CreateTodos

# マイグレーション実行
rails db:migrate
```

### フロントエンド（React）

```bash
# コンテナに入る
docker-compose exec frontend bash

# 依存関係の追加
npm install <package-name>
```