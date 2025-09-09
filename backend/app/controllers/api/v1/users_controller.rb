class Api::V1::UsersController < ApplicationController
  def create
    @user = User.new(user_params)
    
    if @user.save
      token = encode_token({ user_id: @user.id })
      render json: {
        user: user_response(@user),
        token: token
      }, status: :created
    else
      render json: {
        errors: @user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end

  def user_response(user)
    {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  end
end