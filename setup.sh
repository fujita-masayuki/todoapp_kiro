#!/bin/bash

# Rails APIアプリケーションを作成するスクリプト

echo "Rails APIアプリケーションを作成中..."

# 既存のbackendディレクトリを削除
rm -rf backend

# Rails APIアプリケーションを作成
docker run --rm -v $(pwd):/app -w /app ruby:3.2 bash -c "
  gem install rails
  rails new backend --api --database=mysql --skip-git --skip-bundle
"

# 必要なgemを追加
cat >> backend/Gemfile << 'EOF'

# CORS対応
gem 'rack-cors'
EOF

# CORS設定を追加
mkdir -p backend/config/initializers
cat > backend/config/initializers/cors.rb << 'EOF'
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'http://localhost:3000'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
EOF

# database.ymlを更新
cat > backend/config/database.yml << 'EOF'
default: &default
  adapter: mysql2
  encoding: utf8mb4
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  username: root
  password: password
  host: db

development:
  <<: *default
  database: todo_app_development

test:
  <<: *default
  database: todo_app_test

production:
  <<: *default
  database: todo_app_production
  username: <%= ENV['DATABASE_USERNAME'] %>
  password: <%= ENV['DATABASE_PASSWORD'] %>
EOF

echo "セットアップ完了！"
echo "次のコマンドを実行してください："
echo "1. chmod +x setup.sh && ./setup.sh"
echo "2. docker-compose up --build"
echo "3. docker-compose exec backend rails db:create db:migrate"