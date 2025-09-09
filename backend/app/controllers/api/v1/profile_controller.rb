class Api::V1::ProfileController < ApplicationController
  # 認証が必要なアクションで使用するbefore_action
  before_action :authenticate_user!

  def show
    render json: {
      id: current_user.id,
      email: current_user.email,
      name: current_user.name,
      created_at: current_user.created_at
    }
  end

  def update
    if current_user.update(profile_params)
      render json: {
        id: current_user.id,
        email: current_user.email,
        name: current_user.name,
        updated_at: current_user.updated_at
      }
    else
      render json: { errors: current_user.errors }, status: :unprocessable_entity
    end
  end

  private

  def profile_params
    params.require(:user).permit(:name, :email)
  end
end