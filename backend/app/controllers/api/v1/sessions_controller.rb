class Api::V1::SessionsController < ApplicationController
  def create
    user = User.find_by(email: params[:email]&.downcase)
    
    if user&.authenticate(params[:password])
      token = encode_token({ user_id: user.id })
      render json: {
        user: user_response(user),
        token: token
      }, status: :ok
    else
      render json: {
        errors: ['Invalid email or password']
      }, status: :unauthorized
    end
  end

  def destroy
    # JWTトークンはステートレスなので、クライアント側でトークンを削除するだけで十分
    # サーバー側では特別な処理は不要
    render json: {
      message: 'Logged out successfully'
    }, status: :ok
  end

  private

  def user_response(user)
    {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  end
end