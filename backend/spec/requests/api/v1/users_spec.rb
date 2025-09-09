require 'rails_helper'

RSpec.describe 'Api::V1::Users', type: :request do
  describe 'POST /api/v1/users' do
    let(:valid_params) do
      {
        user: {
          email: 'test@example.com',
          password: 'Password123!',
          password_confirmation: 'Password123!'
        }
      }
    end

    let(:invalid_params) do
      {
        user: {
          email: '',
          password: 'short',
          password_confirmation: 'different'
        }
      }
    end

    context 'with valid parameters' do
      it 'creates a new user' do
        expect {
          post '/api/v1/users', params: valid_params, as: :json
        }.to change(User, :count).by(1)
      end

      it 'returns created status' do
        post '/api/v1/users', params: valid_params, as: :json
        expect(response).to have_http_status(:created)
      end

      it 'returns user data and token' do
        post '/api/v1/users', params: valid_params, as: :json
        
        response_body = JSON.parse(response.body)
        expect(response_body).to have_key('user')
        expect(response_body).to have_key('token')
        expect(response_body['user']['email']).to eq('test@example.com')
        expect(response_body['token']).to be_present
      end
    end

    context 'with invalid parameters' do
      it 'does not create a user' do
        expect {
          post '/api/v1/users', params: invalid_params, as: :json
        }.not_to change(User, :count)
      end

      it 'returns unprocessable content status' do
        post '/api/v1/users', params: invalid_params, as: :json
        expect(response).to have_http_status(:unprocessable_content)
      end

      it 'returns error messages' do
        post '/api/v1/users', params: invalid_params, as: :json
        
        response_body = JSON.parse(response.body)
        expect(response_body).to have_key('errors')
        expect(response_body['errors']).to be_an(Array)
      end
    end

    context 'with duplicate email' do
      before do
        create(:user, email: 'duplicate@example.com')
      end

      let(:duplicate_params) do
        {
          user: {
            email: 'duplicate@example.com',
            password: 'Password123!',
            password_confirmation: 'Password123!'
          }
        }
      end

      it 'does not create a user' do
        expect {
          post '/api/v1/users', params: duplicate_params, as: :json
        }.not_to change(User, :count)
      end

      it 'returns unprocessable content status' do
        post '/api/v1/users', params: duplicate_params, as: :json
        expect(response).to have_http_status(:unprocessable_content)
      end

      it 'returns email validation error' do
        post '/api/v1/users', params: duplicate_params, as: :json
        
        response_body = JSON.parse(response.body)
        expect(response_body['errors']).to be_any { |error| error.include?('Email') }
      end
    end
  end

  describe 'DELETE /api/v1/users/:id' do
    let(:user) { create(:user, email: 'test@example.com', password: 'Password123!') }
    let(:other_user) { create(:user, email: 'other@example.com', password: 'Password123!') }
    
    before do
      # ユーザーにTodoを作成
      create_list(:todo, 3, user: user)
    end

    context 'when authenticated user deletes their own account' do
      before do
        token = encode_token({ user_id: user.id })
        request.headers['Authorization'] = "Bearer #{token}"
      end

      it 'deletes the user' do
        expect {
          delete "/api/v1/users/#{user.id}", as: :json
        }.to change(User, :count).by(-1)
      end

      it 'deletes associated todos' do
        expect {
          delete "/api/v1/users/#{user.id}", as: :json
        }.to change(Todo, :count).by(-3)
      end

      it 'returns success message' do
        delete "/api/v1/users/#{user.id}", as: :json
        expect(response).to have_http_status(:ok)
        
        response_body = JSON.parse(response.body)
        expect(response_body['message']).to eq('Account successfully deleted')
      end
    end

    context 'when user tries to delete another user\'s account' do
      before do
        token = encode_token({ user_id: user.id })
        request.headers['Authorization'] = "Bearer #{token}"
      end

      it 'does not delete the other user' do
        expect {
          delete "/api/v1/users/#{other_user.id}", as: :json
        }.not_to change(User, :count)
      end

      it 'returns forbidden status' do
        delete "/api/v1/users/#{other_user.id}", as: :json
        expect(response).to have_http_status(:forbidden)
      end

      it 'returns error message' do
        delete "/api/v1/users/#{other_user.id}", as: :json
        
        response_body = JSON.parse(response.body)
        expect(response_body['error']).to eq('You can only delete your own account')
      end
    end

    context 'when user is not authenticated' do
      it 'returns unauthorized status' do
        delete "/api/v1/users/#{user.id}", as: :json
        expect(response).to have_http_status(:unauthorized)
      end

      it 'does not delete the user' do
        expect {
          delete "/api/v1/users/#{user.id}", as: :json
        }.not_to change(User, :count)
      end
    end

    context 'when token is invalid' do
      before do
        request.headers['Authorization'] = 'Bearer invalid_token'
      end

      it 'returns unauthorized status' do
        delete "/api/v1/users/#{user.id}", as: :json
        expect(response).to have_http_status(:unauthorized)
      end

      it 'does not delete the user' do
        expect {
          delete "/api/v1/users/#{user.id}", as: :json
        }.not_to change(User, :count)
      end
    end
  end
end