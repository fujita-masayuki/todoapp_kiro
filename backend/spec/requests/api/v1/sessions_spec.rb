require 'rails_helper'

RSpec.describe 'Api::V1::Sessions', type: :request do
  let!(:user) { create(:user, email: 'test@example.com', password: 'Password123!') }

  describe 'POST /api/v1/sessions' do
    let(:valid_params) do
      {
        email: 'test@example.com',
        password: 'Password123!'
      }
    end

    let(:invalid_params) do
      {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
    end

    context 'with valid credentials' do
      it 'returns success status' do
        post '/api/v1/sessions', params: valid_params, as: :json
        expect(response).to have_http_status(:ok)
      end

      it 'returns user data and token' do
        post '/api/v1/sessions', params: valid_params, as: :json
        
        response_body = JSON.parse(response.body)
        expect(response_body).to have_key('user')
        expect(response_body).to have_key('token')
        expect(response_body['user']['email']).to eq('test@example.com')
        expect(response_body['token']).to be_present
      end
    end

    context 'with invalid credentials' do
      it 'returns unauthorized status' do
        post '/api/v1/sessions', params: invalid_params, as: :json
        expect(response).to have_http_status(:unauthorized)
      end

      it 'returns error message' do
        post '/api/v1/sessions', params: invalid_params, as: :json
        
        response_body = JSON.parse(response.body)
        expect(response_body).to have_key('errors')
        expect(response_body['errors']).to include('Invalid email or password')
      end
    end

    context 'with non-existent email' do
      let(:nonexistent_params) do
        {
          email: 'nonexistent@example.com',
          password: 'Password123!'
        }
      end

      it 'returns unauthorized status' do
        post '/api/v1/sessions', params: nonexistent_params, as: :json
        expect(response).to have_http_status(:unauthorized)
      end

      it 'returns error message' do
        post '/api/v1/sessions', params: nonexistent_params, as: :json
        
        response_body = JSON.parse(response.body)
        expect(response_body).to have_key('errors')
        expect(response_body['errors']).to include('Invalid email or password')
      end
    end

    context 'with case insensitive email' do
      let(:case_insensitive_params) do
        {
          email: 'TEST@EXAMPLE.COM',
          password: 'Password123!'
        }
      end

      it 'returns success status' do
        post '/api/v1/sessions', params: case_insensitive_params, as: :json
        expect(response).to have_http_status(:ok)
      end

      it 'returns user data with normalized email' do
        post '/api/v1/sessions', params: case_insensitive_params, as: :json
        
        response_body = JSON.parse(response.body)
        expect(response_body['user']['email']).to eq('test@example.com')
      end
    end
  end

  describe 'DELETE /api/v1/sessions/:id' do
    it 'returns success status' do
      delete '/api/v1/sessions/1', as: :json
      expect(response).to have_http_status(:ok)
    end

    it 'returns logout message' do
      delete '/api/v1/sessions/1', as: :json
      
      response_body = JSON.parse(response.body)
      expect(response_body).to have_key('message')
      expect(response_body['message']).to eq('Logged out successfully')
    end
  end
end