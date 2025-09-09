class Api::V1::UsersController < ApplicationController
  before_action :authenticate_user!, only: [:destroy]

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
      }, status: :unprocessable_content
    end
  end

  def destroy
    begin
      User.transaction do
        # 現在のユーザーのみが自分のアカウントを削除可能
        if current_user.id != params[:id].to_i
          render json: { 
            error: 'You can only delete your own account' 
          }, status: :forbidden
          return
        end

        # ユーザーを削除（associated todosも自動削除される）
        current_user.destroy!
        
        render json: { 
          message: 'Account successfully deleted' 
        }, status: :ok
      end
    rescue ActiveRecord::RecordNotDestroyed => e
      render json: {
        error: 'Failed to delete account',
        details: e.record.errors.full_messages
      }, status: :unprocessable_content
    rescue StandardError => e
      render json: { 
        error: 'An error occurred while deleting the account' 
      }, status: :internal_server_error
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