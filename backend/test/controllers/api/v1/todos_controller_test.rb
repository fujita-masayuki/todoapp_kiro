require 'test_helper'

class Api::V1::TodosControllerTest < ActionDispatch::IntegrationTest
  include JwtAuthenticatable

  def setup
    @user = users(:one)
    @other_user = users(:two)
    @todo = todos(:one)
    @todo.update(user: @user)
    @other_todo = todos(:two)
    @other_todo.update(user: @other_user)
    
    @auth_headers = { 'Authorization' => "Bearer #{generate_token(@user)}" }
    @other_auth_headers = { 'Authorization' => "Bearer #{generate_token(@other_user)}" }
  end

  test "should require authentication for index" do
    get api_v1_todos_url
    assert_response :unauthorized
  end

  test "should get index with authentication" do
    get api_v1_todos_url, headers: @auth_headers
    assert_response :success
    
    response_data = JSON.parse(@response.body)
    # ユーザー固有のTodoのみが返されることを確認
    assert_equal 1, response_data.length
    assert_equal @todo.id, response_data.first['id']
  end

  test "should require authentication for show" do
    get api_v1_todo_url(@todo)
    assert_response :unauthorized
  end

  test "should show own todo" do
    get api_v1_todo_url(@todo), headers: @auth_headers
    assert_response :success
    
    response_data = JSON.parse(@response.body)
    assert_equal @todo.id, response_data['id']
  end

  test "should not show other user's todo" do
    get api_v1_todo_url(@other_todo), headers: @auth_headers
    assert_response :not_found
  end

  test "should require authentication for create" do
    post api_v1_todos_url, params: { todo: { title: "New Todo", completed: false } }
    assert_response :unauthorized
  end

  test "should create todo with authentication" do
    assert_difference('Todo.count') do
      post api_v1_todos_url, 
           params: { todo: { title: "New Todo", completed: false } },
           headers: @auth_headers
    end

    assert_response :created
    response_data = JSON.parse(@response.body)
    assert_equal "New Todo", response_data['title']
    assert_equal @user.id, response_data['user_id']
  end

  test "should require authentication for update" do
    patch api_v1_todo_url(@todo), params: { todo: { title: "Updated" } }
    assert_response :unauthorized
  end

  test "should update own todo" do
    patch api_v1_todo_url(@todo), 
          params: { todo: { title: "Updated Todo" } },
          headers: @auth_headers
    assert_response :success
    
    response_data = JSON.parse(@response.body)
    assert_equal "Updated Todo", response_data['title']
  end

  test "should not update other user's todo" do
    patch api_v1_todo_url(@other_todo), 
          params: { todo: { title: "Updated" } },
          headers: @auth_headers
    assert_response :not_found
  end

  test "should require authentication for destroy" do
    delete api_v1_todo_url(@todo)
    assert_response :unauthorized
  end

  test "should destroy own todo" do
    assert_difference('Todo.count', -1) do
      delete api_v1_todo_url(@todo), headers: @auth_headers
    end

    assert_response :no_content
  end

  test "should not destroy other user's todo" do
    assert_no_difference('Todo.count') do
      delete api_v1_todo_url(@other_todo), headers: @auth_headers
    end

    assert_response :not_found
  end

  private

  def generate_token(user)
    payload = { user_id: user.id, exp: 24.hours.from_now.to_i }
    JWT.encode(payload, Rails.application.credentials.secret_key_base || 'fallback_secret_key', 'HS256')
  end
end