require 'rails_helper'

RSpec.describe 'Authentication Flow', type: :request do
  describe 'Complete authentication workflow' do
    let(:user_params) do
      {
        user: {
          email: 'integration@example.com',
          password: 'Password123!',
          password_confirmation: 'Password123!'
        }
      }
    end

    let(:login_params) do
      {
        email: 'integration@example.com',
        password: 'Password123!'
      }
    end

    it 'allows user to register, login, access protected resources, and logout' do
      # Step 1: User registration
      post '/api/v1/users', params: user_params, as: :json
      expect(response).to have_http_status(:created)
      
      registration_response = JSON.parse(response.body)
      expect(registration_response).to have_key('user')
      expect(registration_response).to have_key('token')
      
      registration_token = registration_response['token']
      user_id = registration_response['user']['id']

      # Step 2: Verify token works for protected resources
      get '/api/v1/todos', headers: { 'Authorization' => "Bearer #{registration_token}" }
      expect(response).to have_http_status(:ok)

      # Step 3: Create a todo with the registration token
      todo_params = { todo: { title: 'Integration Test Todo', completed: false } }
      post '/api/v1/todos', params: todo_params, headers: { 'Authorization' => "Bearer #{registration_token}" }
      expect(response).to have_http_status(:created)
      
      todo_response = JSON.parse(response.body)
      expect(todo_response['user_id']).to eq(user_id)

      # Step 4: Login with the same credentials
      post '/api/v1/sessions', params: login_params, as: :json
      expect(response).to have_http_status(:ok)
      
      login_response = JSON.parse(response.body)
      expect(login_response).to have_key('user')
      expect(login_response).to have_key('token')
      
      login_token = login_response['token']

      # Step 5: Verify login token works and returns the same user's todos
      get '/api/v1/todos', headers: { 'Authorization' => "Bearer #{login_token}" }
      expect(response).to have_http_status(:ok)
      
      todos_response = JSON.parse(response.body)
      expect(todos_response.length).to eq(1)
      expect(todos_response.first['title']).to eq('Integration Test Todo')

      # Step 6: Access profile with login token
      get '/api/v1/profile', headers: { 'Authorization' => "Bearer #{login_token}" }
      expect(response).to have_http_status(:ok)
      
      profile_response = JSON.parse(response.body)
      expect(profile_response['email']).to eq('integration@example.com')

      # Step 7: Logout
      delete '/api/v1/sessions/1', headers: { 'Authorization' => "Bearer #{login_token}" }
      expect(response).to have_http_status(:ok)
      
      logout_response = JSON.parse(response.body)
      expect(logout_response['message']).to eq('Logged out successfully')
    end

    it 'prevents access to protected resources without authentication' do
      # Try to access protected resources without token
      get '/api/v1/todos'
      expect(response).to have_http_status(:unauthorized)

      get '/api/v1/profile'
      expect(response).to have_http_status(:unauthorized)

      post '/api/v1/todos', params: { todo: { title: 'Test' } }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'prevents access with invalid token' do
      invalid_token = 'invalid.jwt.token'
      
      get '/api/v1/todos', headers: { 'Authorization' => "Bearer #{invalid_token}" }
      expect(response).to have_http_status(:unauthorized)

      get '/api/v1/profile', headers: { 'Authorization' => "Bearer #{invalid_token}" }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'prevents access with expired token' do
      # Create user first
      post '/api/v1/users', params: user_params, as: :json
      user_id = JSON.parse(response.body)['user']['id']

      # Create an expired token manually
      expired_payload = { user_id: user_id, exp: 1.hour.ago.to_i }
      expired_token = JWT.encode(
        expired_payload, 
        Rails.application.credentials.secret_key_base || 'fallback_secret_key', 
        'HS256'
      )

      get '/api/v1/todos', headers: { 'Authorization' => "Bearer #{expired_token}" }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'isolates user data between different users' do
      # Create first user
      user1_params = user_params.deep_dup
      user1_params[:user][:email] = 'user1@example.com'
      
      post '/api/v1/users', params: user1_params, as: :json
      user1_response = JSON.parse(response.body)
      user1_token = user1_response['token']

      # Create second user
      user2_params = user_params.deep_dup
      user2_params[:user][:email] = 'user2@example.com'
      
      post '/api/v1/users', params: user2_params, as: :json
      user2_response = JSON.parse(response.body)
      user2_token = user2_response['token']

      # Create todos for each user
      post '/api/v1/todos', 
           params: { todo: { title: 'User 1 Todo', completed: false } },
           headers: { 'Authorization' => "Bearer #{user1_token}" }
      expect(response).to have_http_status(:created)

      post '/api/v1/todos', 
           params: { todo: { title: 'User 2 Todo', completed: false } },
           headers: { 'Authorization' => "Bearer #{user2_token}" }
      expect(response).to have_http_status(:created)

      # Verify user 1 only sees their todos
      get '/api/v1/todos', headers: { 'Authorization' => "Bearer #{user1_token}" }
      user1_todos = JSON.parse(response.body)
      expect(user1_todos.length).to eq(1)
      expect(user1_todos.first['title']).to eq('User 1 Todo')

      # Verify user 2 only sees their todos
      get '/api/v1/todos', headers: { 'Authorization' => "Bearer #{user2_token}" }
      user2_todos = JSON.parse(response.body)
      expect(user2_todos.length).to eq(1)
      expect(user2_todos.first['title']).to eq('User 2 Todo')
    end
  end
end