require 'test_helper'

class Api::V1::SessionsControllerTest < ActionDispatch::IntegrationTest
  def setup
    @user = User.create!(
      email: 'test@example.com',
      password: 'Password123!',
      password_confirmation: 'Password123!'
    )
    
    @valid_login_params = {
      email: 'test@example.com',
      password: 'Password123!'
    }
    
    @invalid_login_params = {
      email: 'test@example.com',
      password: 'wrongpassword'
    }
  end

  test 'should login with valid credentials' do
    post api_v1_sessions_url, params: @valid_login_params, as: :json
    
    assert_response :ok
    
    response_body = JSON.parse(response.body)
    assert response_body.key?('user')
    assert response_body.key?('token')
    assert_equal 'test@example.com', response_body['user']['email']
    assert response_body['token'].present?
  end

  test 'should not login with invalid credentials' do
    post api_v1_sessions_url, params: @invalid_login_params, as: :json
    
    assert_response :unauthorized
    
    response_body = JSON.parse(response.body)
    assert response_body.key?('errors')
    assert response_body['errors'].include?('Invalid email or password')
  end

  test 'should not login with non-existent email' do
    invalid_params = {
      email: 'nonexistent@example.com',
      password: 'Password123!'
    }
    
    post api_v1_sessions_url, params: invalid_params, as: :json
    
    assert_response :unauthorized
    
    response_body = JSON.parse(response.body)
    assert response_body.key?('errors')
    assert response_body['errors'].include?('Invalid email or password')
  end

  test 'should logout successfully' do
    delete api_v1_session_url(1), as: :json
    
    assert_response :ok
    
    response_body = JSON.parse(response.body)
    assert response_body.key?('message')
    assert_equal 'Logged out successfully', response_body['message']
  end

  test 'should handle case insensitive email login' do
    login_params = {
      email: 'TEST@EXAMPLE.COM',
      password: 'Password123!'
    }
    
    post api_v1_sessions_url, params: login_params, as: :json
    
    assert_response :ok
    
    response_body = JSON.parse(response.body)
    assert response_body.key?('user')
    assert_equal 'test@example.com', response_body['user']['email']
  end
end