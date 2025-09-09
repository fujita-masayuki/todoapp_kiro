require 'rails_helper'

RSpec.describe 'Security', type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }

  describe 'JWT Token Security' do
    context 'with expired token' do
      let(:expired_payload) { { user_id: user.id, exp: 1.hour.ago.to_i } }
      let(:expired_token) { JWT.encode(expired_payload, Rails.application.credentials.secret_key_base || 'fallback_secret_key', 'HS256') }
      let(:expired_headers) { { 'Authorization' => "Bearer #{expired_token}" } }

      it 'rejects expired tokens for protected endpoints' do
        get '/api/v1/todos', headers: expired_headers
        expect(response).to have_http_status(:unauthorized)
      end

      it 'rejects expired tokens for profile access' do
        get '/api/v1/profile', headers: expired_headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with malformed token' do
      let(:malformed_headers) { { 'Authorization' => 'Bearer invalid.token.format' } }

      it 'rejects malformed tokens' do
        get '/api/v1/todos', headers: malformed_headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with missing Authorization header' do
      it 'rejects requests without authorization header' do
        get '/api/v1/todos'
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with wrong Authorization format' do
      let(:wrong_format_headers) { { 'Authorization' => 'Basic dGVzdDp0ZXN0' } }

      it 'rejects non-Bearer authorization' do
        get '/api/v1/todos', headers: wrong_format_headers
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'Data Access Control' do
    let!(:user_todo) { create(:todo, user: user, title: 'User Todo') }
    let!(:other_user_todo) { create(:todo, user: other_user, title: 'Other User Todo') }

    context 'Todo access control' do
      it 'prevents access to other users todos in list' do
        get '/api/v1/todos', headers: auth_headers(user)
        
        response_data = JSON.parse(response.body)
        todo_titles = response_data.map { |todo| todo['title'] }
        
        expect(todo_titles).to include('User Todo')
        expect(todo_titles).not_to include('Other User Todo')
      end

      it 'prevents direct access to other users todo by ID' do
        get "/api/v1/todos/#{other_user_todo.id}", headers: auth_headers(user)
        expect(response).to have_http_status(:not_found)
      end

      it 'prevents updating other users todo' do
        patch "/api/v1/todos/#{other_user_todo.id}", 
              params: { todo: { title: 'Hacked Todo' } }, 
              headers: auth_headers(user)
        
        expect(response).to have_http_status(:not_found)
        
        other_user_todo.reload
        expect(other_user_todo.title).to eq('Other User Todo')
      end

      it 'prevents deleting other users todo' do
        expect {
          delete "/api/v1/todos/#{other_user_todo.id}", headers: auth_headers(user)
        }.not_to change(Todo, :count)
        
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'Password Security' do
    context 'password storage' do
      it 'does not store passwords in plain text' do
        user = create(:user, password: 'TestPassword123!', password_confirmation: 'TestPassword123!')
        expect(user.password_digest).not_to eq('TestPassword123!')
        expect(user.password_digest).to be_present
      end

      it 'uses bcrypt for password hashing' do
        user = create(:user, password: 'TestPassword123!', password_confirmation: 'TestPassword123!')
        expect(user.password_digest).to start_with('$2a$')
      end
    end

    context 'password validation' do
      it 'enforces minimum length requirement' do
        user = build(:user, password: 'short', password_confirmation: 'short')
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include('is too short (minimum is 8 characters)')
      end

      it 'enforces complexity requirements' do
        weak_passwords = [
          'password123',  # no uppercase
          'PASSWORD123',  # no lowercase  
          'Password',     # no numbers
          'Password123'   # no special characters
        ]

        weak_passwords.each do |weak_password|
          user = build(:user, password: weak_password, password_confirmation: weak_password)
          expect(user).not_to be_valid, "#{weak_password} should be invalid"
          expect(user.errors[:password]).to include('must include at least one lowercase letter, one uppercase letter, one digit, and one special character')
        end
      end
    end
  end

  describe 'Email Security' do
    context 'email uniqueness' do
      let!(:existing_user) { create(:user, email: 'test@example.com') }

      it 'prevents duplicate email registration (case insensitive)' do
        duplicate_user = build(:user, email: 'TEST@EXAMPLE.COM')
        expect(duplicate_user).not_to be_valid
        expect(duplicate_user.errors[:email]).to include('has already been taken')
      end
    end

    context 'email normalization' do
      it 'normalizes email to lowercase' do
        user = create(:user, email: 'TEST@EXAMPLE.COM')
        expect(user.email).to eq('test@example.com')
      end
    end
  end
end