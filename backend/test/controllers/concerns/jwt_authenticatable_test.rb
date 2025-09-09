require 'test_helper'

class JwtAuthenticatableTest < ActionDispatch::IntegrationTest
  include JwtAuthenticatable

  def setup
    @user = User.create!(
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    )
  end

  test 'encode_token creates valid JWT token' do
    payload = { user_id: @user.id }
    token = encode_token(payload)
    
    assert_not_nil token
    assert token.is_a?(String)
    assert token.split('.').length == 3 # JWT has 3 parts
  end

  test 'decode_token decodes valid JWT token' do
    payload = { user_id: @user.id }
    token = encode_token(payload)
    decoded = decode_token(token)
    
    assert_not_nil decoded
    assert_equal @user.id, decoded['user_id']
    assert decoded['exp'].present?
  end

  test 'decode_token returns nil for invalid token' do
    invalid_token = 'invalid.token.here'
    decoded = decode_token(invalid_token)
    
    assert_nil decoded
  end

  test 'extract_token_from_header extracts token from Bearer header' do
    token = 'sample_token_123'
    request = OpenStruct.new(headers: { 'Authorization' => "Bearer #{token}" })
    
    # Mock the request method
    define_singleton_method(:request) { request }
    
    extracted_token = extract_token_from_header
    assert_equal token, extracted_token
  end

  test 'extract_token_from_header returns nil for missing header' do
    request = OpenStruct.new(headers: {})
    
    # Mock the request method
    define_singleton_method(:request) { request }
    
    extracted_token = extract_token_from_header
    assert_nil extracted_token
  end

  test 'extract_token_from_header returns nil for invalid header format' do
    request = OpenStruct.new(headers: { 'Authorization' => 'InvalidFormat token123' })
    
    # Mock the request method
    define_singleton_method(:request) { request }
    
    extracted_token = extract_token_from_header
    assert_nil extracted_token
  end
end