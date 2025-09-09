require 'rails_helper'

RSpec.describe 'Api::V1::Todos', type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:todo) { create(:todo, user: user) }
  let(:other_todo) { create(:todo, user: other_user) }

  describe 'GET /api/v1/todos' do
    context 'without authentication' do
      it 'returns unauthorized status' do
        get '/api/v1/todos'
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with authentication' do
      let!(:user_todos) { create_list(:todo, 3, user: user) }
      let!(:other_user_todos) { create_list(:todo, 2, user: other_user) }

      it 'returns success status' do
        get '/api/v1/todos', headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
      end

      it 'returns only current user todos' do
        get '/api/v1/todos', headers: auth_headers(user)
        
        response_data = JSON.parse(response.body)
        expect(response_data.length).to eq(3)
        
        returned_user_ids = response_data.map { |todo| todo['user_id'] }.uniq
        expect(returned_user_ids).to eq([user.id])
      end
    end
  end

  describe 'GET /api/v1/todos/:id' do
    context 'without authentication' do
      it 'returns unauthorized status' do
        get "/api/v1/todos/#{todo.id}"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with authentication' do
      context 'when accessing own todo' do
        it 'returns success status' do
          get "/api/v1/todos/#{todo.id}", headers: auth_headers(user)
          expect(response).to have_http_status(:ok)
        end

        it 'returns the todo data' do
          get "/api/v1/todos/#{todo.id}", headers: auth_headers(user)
          
          response_data = JSON.parse(response.body)
          expect(response_data['id']).to eq(todo.id)
          expect(response_data['title']).to eq(todo.title)
        end
      end

      context 'when accessing other user todo' do
        it 'returns not found status' do
          get "/api/v1/todos/#{other_todo.id}", headers: auth_headers(user)
          expect(response).to have_http_status(:not_found)
        end
      end
    end
  end

  describe 'POST /api/v1/todos' do
    let(:valid_params) do
      {
        todo: {
          title: 'New Todo',
          completed: false
        }
      }
    end

    context 'without authentication' do
      it 'returns unauthorized status' do
        post '/api/v1/todos', params: valid_params
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with authentication' do
      it 'creates a new todo' do
        expect {
          post '/api/v1/todos', params: valid_params, headers: auth_headers(user)
        }.to change(Todo, :count).by(1)
      end

      it 'returns created status' do
        post '/api/v1/todos', params: valid_params, headers: auth_headers(user)
        expect(response).to have_http_status(:created)
      end

      it 'returns the created todo with user_id' do
        post '/api/v1/todos', params: valid_params, headers: auth_headers(user)
        
        response_data = JSON.parse(response.body)
        expect(response_data['title']).to eq('New Todo')
        expect(response_data['user_id']).to eq(user.id)
        expect(response_data['completed']).to be false
      end
    end
  end

  describe 'PATCH /api/v1/todos/:id' do
    let(:update_params) do
      {
        todo: {
          title: 'Updated Todo',
          completed: true
        }
      }
    end

    context 'without authentication' do
      it 'returns unauthorized status' do
        patch "/api/v1/todos/#{todo.id}", params: update_params
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with authentication' do
      context 'when updating own todo' do
        it 'returns success status' do
          patch "/api/v1/todos/#{todo.id}", params: update_params, headers: auth_headers(user)
          expect(response).to have_http_status(:ok)
        end

        it 'updates the todo' do
          patch "/api/v1/todos/#{todo.id}", params: update_params, headers: auth_headers(user)
          
          response_data = JSON.parse(response.body)
          expect(response_data['title']).to eq('Updated Todo')
          expect(response_data['completed']).to be true
        end
      end

      context 'when updating other user todo' do
        it 'returns not found status' do
          patch "/api/v1/todos/#{other_todo.id}", params: update_params, headers: auth_headers(user)
          expect(response).to have_http_status(:not_found)
        end
      end
    end
  end

  describe 'DELETE /api/v1/todos/:id' do
    context 'without authentication' do
      it 'returns unauthorized status' do
        delete "/api/v1/todos/#{todo.id}"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with authentication' do
      context 'when deleting own todo' do
        it 'deletes the todo' do
          todo # create the todo
          expect {
            delete "/api/v1/todos/#{todo.id}", headers: auth_headers(user)
          }.to change(Todo, :count).by(-1)
        end

        it 'returns no content status' do
          delete "/api/v1/todos/#{todo.id}", headers: auth_headers(user)
          expect(response).to have_http_status(:no_content)
        end
      end

      context 'when deleting other user todo' do
        it 'does not delete the todo' do
          other_todo # create the todo
          expect {
            delete "/api/v1/todos/#{other_todo.id}", headers: auth_headers(user)
          }.not_to change(Todo, :count)
        end

        it 'returns not found status' do
          delete "/api/v1/todos/#{other_todo.id}", headers: auth_headers(user)
          expect(response).to have_http_status(:not_found)
        end
      end
    end
  end
end