module JwtAuthenticatable
  extend ActiveSupport::Concern

  private

  # JWTトークンをエンコードする
  def encode_token(payload)
    # 有効期限を24時間に設定
    payload[:exp] = 24.hours.from_now.to_i
    JWT.encode(payload, jwt_secret, 'HS256')
  end

  # JWTトークンをデコードする
  def decode_token(token)
    begin
      decoded = JWT.decode(token, jwt_secret, true, { algorithm: 'HS256' })
      decoded[0]
    rescue JWT::DecodeError => e
      Rails.logger.error "JWT Decode Error: #{e.message}"
      nil
    rescue JWT::ExpiredSignature => e
      Rails.logger.error "JWT Expired: #{e.message}"
      nil
    end
  end

  # リクエストヘッダーからJWTトークンを抽出する
  def extract_token_from_header
    auth_header = request.headers['Authorization']
    return nil unless auth_header

    # "Bearer <token>" 形式からトークンを抽出
    token = auth_header.split(' ').last
    token if auth_header.start_with?('Bearer ')
  end

  # 現在のユーザーを取得する
  def current_user
    return @current_user if defined?(@current_user)

    token = extract_token_from_header
    return @current_user = nil unless token

    decoded_token = decode_token(token)
    return @current_user = nil unless decoded_token

    user_id = decoded_token['user_id']
    @current_user = User.find_by(id: user_id)
  end

  # ユーザーがログインしているかチェックする
  def logged_in?
    !!current_user
  end

  # 認証が必要なアクションで使用するbefore_action
  def authenticate_user!
    unless logged_in?
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end

  # JWT秘密鍵を取得する
  def jwt_secret
    Rails.application.credentials.secret_key_base || 'fallback_secret_key'
  end
end