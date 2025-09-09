require 'rails_helper'

RSpec.describe 'Api::V1::Profile', type: :request do
  let(:user) { create(:user, email: 'test@example.com', password: 'Password123!') }

  describe 'GET /api/v1/profile' do
    context 'without authentication' do
      it 'returns unauthorized status' do
        get '/api/v1/profile'
        expect(response).to have_http_status(:unauthorized)
      end

      it 'returns error message' do
        get '/api/v1/profile'
        
        response_body = JSON.parse(response.body)
        expect(response_body).to have_key('error')
        expect(response_body['error']).to eq('Unauthorized')
      end
    end

    context 'with authentication' do
      it 'returns success status' do
        get '/api/v1/profile', headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
      end

      it 'returns user profile data' do
        get '/api/v1/profile', headers: auth_headers(user)
        
        response_body = JSON.parse(response.body)
        expect(response_body).to have_key('id')
        expect(response_body).to have_key('email')
        expect(response_body).to have_key('created_at')
        expect(response_body['id']).to eq(user.id)
        expect(response_body['email']).to eq(user.email)
      end
    end
  end

  describe 'PATCH /api/v1/profile' do
    let(:valid_params) do
      {
        user: {
          email: 'updated@example.com'
        }
      }
    end

    let(:invalid_params) do
      {
        user: {
          email: 'invalid-email'
        }
      }
    end

    context 'without authentication' do
      it 'returns unauthorized status' do
        patch '/api/v1/profile', params: valid_params
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with authentication' do
      context 'with valid parameters' do
        it 'returns success status' do
          patch '/api/v1/profile', params: valid_params, headers: auth_headers(user)
          expect(response).to have_http_status(:ok)
        end

        it 'updates user profile' do
          patch '/api/v1/profile', params: valid_params, headers: auth_headers(user)
          
          response_body = JSON.parse(response.body)
          expect(response_body['email']).to eq('updated@example.com')
          
          user.reload
          expect(user.email).to eq('updated@example.com')
        end

        it 'returns updated user data' do
          patch '/api/v1/profile', params: valid_params, headers: auth_headers(user)
          
          response_body = JSON.parse(response.body)
          expect(response_body).to have_key('id')
          expect(response_body).to have_key('email')
          expect(response_body).to have_key('updated_at')
        end
      end

      context 'with invalid parameters' do
        it 'returns unprocessable content status' do
          patch '/api/v1/profile', params: invalid_params, headers: auth_headers(user)
          expect(response).to have_http_status(:unprocessable_content)
        end

        it 'returns validation errors' do
          patch '/api/v1/profile', params: invalid_params, headers: auth_headers(user)
          
          response_body = JSON.parse(response.body)
          expect(response_body).to have_key('errors')
        end

        it 'does not update user profile' do
          original_email = user.email
          patch '/api/v1/profile', params: invalid_params, headers: auth_headers(user)
          
          user.reload
          expect(user.email).to eq(original_email)
        end
      end
    end
  end
end