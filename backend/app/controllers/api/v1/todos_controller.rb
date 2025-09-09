class Api::V1::TodosController < ApplicationController
  include JwtAuthenticatable
  
  before_action :authenticate_user!
  before_action :set_todo, only: [:show, :update, :destroy]
  before_action :authorize_todo_access, only: [:show, :update, :destroy]

  def index
    @todos = current_user.todos
    render json: @todos
  end

  def show
    render json: @todo
  end

  def create
    @todo = current_user.todos.build(todo_params)
    
    if @todo.save
      render json: @todo, status: :created
    else
      render json: @todo.errors, status: :unprocessable_entity
    end
  end

  def update
    if @todo.update(todo_params)
      render json: @todo
    else
      render json: @todo.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @todo.destroy
    head :no_content
  end

  private

  def set_todo
    @todo = current_user.todos.find_by(id: params[:id])
    unless @todo
      render json: { error: 'Todo not found' }, status: :not_found
    end
  end

  def authorize_todo_access
    unless @todo && @todo.user_id == current_user.id
      render json: { error: 'Forbidden: You can only access your own todos' }, status: :forbidden
    end
  end

  def todo_params
    params.require(:todo).permit(:title, :completed)
  end
end