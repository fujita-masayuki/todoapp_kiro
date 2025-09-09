require 'rails_helper'

RSpec.describe 'Error Handling', type: :request do
  let(:user) { create(:user) }

  describe 'Authentication errors' do
    it 'handles missing Authorization header gracefully' do
      get '/api/v1/todos'
      
      expect(response).to have_http_status(:unauthorized)
      response_body = JSON.parse(response.body)
      expect(response_body['error']).to eq('Unauthorized')
    end

    it 'handles malformed Authorization header gracefully' do
      get '/api/v1/todos', headers: { 'Authorization' => 'InvalidFormat' }
      
      expect(response).to have_http_status(:unauthorized)
      response_body = JSON.parse(response.body)
      expect(response_body['error']).to eq('Unauthorized')
    end

    it 'handles invalid JWT token gracefully' do
      get '/api/v1/todos', headers: { 'Authorization' => 'Bearer invalid.jwt.token' }
      
      expect(response).to have_http_status(:unauthorized)
      response_body = JSON.parse(response.body)
      expect(response_body['error']).to eq('Unauthorized')
    end

    it 'handles JWT token for non-existent user gracefully' do
      # Create a token with a non-existent user ID
      fake_payload = { user_id: 99999, exp: 24.hours.from_now.to_i }
      fake_token = JWT.encode(
        fake_payload, 
        Rails.application.credentials.secret_key_base || 'fallback_secret_key', 
        'HS256'
      )

      get '/api/v1/todos', headers: { 'Authorization' => "Bearer #{fake_token}" }
      
      expect(response).to have_http_status(:unauthorized)
      response_body = JSON.parse(response.body)
      expect(response_body['error']).to eq('Unauthorized')
    end
  end

  describe 'Validation errors' do
    it 'handles user registration validation errors properly' do
      invalid_params = {
        user: {
          email: 'invalid-email',
          password: 'short',
          password_confirmation: 'different'
        }
      }

      post '/api/v1/users', params: invalid_params, as: :json
      
      expect(response).to have_http_status(:unprocessable_content)
      response_body = JSON.parse(response.body)
      expect(response_body).to have_key('errors')
      expect(response_body['errors']).to be_an(Array)
      expect(response_body['errors']).not_to be_empty
    end

    it 'handles todo validation errors properly' do
      invalid_todo_params = {
        todo: {
          title: '', # Empty title should be invalid
          completed: false
        }
      }

      post '/api/v1/todos', 
           params: invalid_todo_params, 
           headers: auth_headers(user),
           as: :json
      
      expect(response).to have_http_status(:unprocessable_content)
      response_body = JSON.parse(response.body)
      # Railsのデフォルトエラー形式は { "field_name": ["error message"] } 
      expect(response_body).to have_key('title')
    end
  end

  describe 'Resource not found errors' do
    it 'handles accessing non-existent todo gracefully' do
      get '/api/v1/todos/99999', headers: auth_headers(user)
      
      expect(response).to have_http_status(:not_found)
    end

    it 'handles updating non-existent todo gracefully' do
      patch '/api/v1/todos/99999', 
            params: { todo: { title: 'Updated' } },
            headers: auth_headers(user)
      
      expect(response).to have_http_status(:not_found)
    end

    it 'handles deleting non-existent todo gracefully' do
      delete '/api/v1/todos/99999', headers: auth_headers(user)
      
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'Authorization errors' do
    let(:other_user) { create(:user) }
    let(:other_user_todo) { create(:todo, user: other_user) }

    it 'prevents accessing other user\'s todo' do
      get "/api/v1/todos/#{other_user_todo.id}", headers: auth_headers(user)
      
      expect(response).to have_http_status(:not_found)
    end

    it 'prevents updating other user\'s todo' do
      patch "/api/v1/todos/#{other_user_todo.id}", 
            params: { todo: { title: 'Hacked' } },
            headers: auth_headers(user)
      
      expect(response).to have_http_status(:not_found)
    end

    it 'prevents deleting other user\'s todo' do
      delete "/api/v1/todos/#{other_user_todo.id}", headers: auth_headers(user)
      
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'Content-Type handling' do
    it 'handles requests without proper Content-Type' do
      post '/api/v1/users', params: {
        user: {
          email: 'test@example.com',
          password: 'Password123!',
          password_confirmation: 'Password123!'
        }
      }
      
      # Should still work, Rails is flexible with content types
      expect(response).to have_http_status(:created)
    end
  end
end