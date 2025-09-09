module JwtAuthenticatable
  def generate_token(user)
    payload = { user_id: user.id, exp: 24.hours.from_now.to_i }
    JWT.encode(payload, Rails.application.credentials.secret_key_base || 'fallback_secret_key', 'HS256')
  end

  def auth_headers(user)
    { 'Authorization' => "Bearer #{generate_token(user)}" }
  end
end