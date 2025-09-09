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
end