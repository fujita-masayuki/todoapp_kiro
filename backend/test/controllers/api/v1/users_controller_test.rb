require 'test_helper'

class Api::V1::UsersControllerTest < ActionDispatch::IntegrationTest
  def setup
    @valid_user_params = {
      user: {
        email: 'test@example.com',
        password: 'Password123!',
        password_confirmation: 'Password123!'
      }
    }
    
    @invalid_user_params = {
      user: {
        email: '',
        password: 'short',
        password_confirmation: 'different'
      }
    }
  end

  test 'should create user with valid params' do
    assert_difference('User.count', 1) do
      post api_v1_users_url, params: @valid_user_params, as: :json
    end

    assert_response :created
    
    response_body = JSON.parse(response.body)
    assert response_body.key?('user')
    assert response_body.key?('token')
    assert_equal 'test@example.com', response_body['user']['email']
    assert response_body['token'].present?
  end

  test 'should not create user with invalid params' do
    assert_no_difference('User.count') do
      post api_v1_users_url, params: @invalid_user_params, as: :json
    end

    assert_response :unprocessable_entity
    
    response_body = JSON.parse(response.body)
    assert response_body.key?('errors')
    assert response_body['errors'].is_a?(Array)
  end

  test 'should not create user with duplicate email' do
    # 最初のユーザーを作成
    User.create!(email: 'duplicate@example.com', password: 'Password123!', password_confirmation: 'Password123!')

    # 同じメールアドレスで再度作成を試行
    duplicate_params = {
      user: {
        email: 'duplicate@example.com',
        password: 'Password123!',
        password_confirmation: 'Password123!'
      }
    }
    
    assert_no_difference('User.count') do
      post api_v1_users_url, params: duplicate_params, as: :json
    end

    assert_response :unprocessable_entity
    
    response_body = JSON.parse(response.body)
    assert response_body.key?('errors')
    assert response_body['errors'].any? { |error| error.include?('Email') }
  end
end