class User < ApplicationRecord
  has_secure_password
  has_many :todos, dependent: :destroy
  
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: -> { new_record? || !password.nil? }
  validates :password, format: { 
    with: /\A(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: "は大文字・小文字・数字・特殊文字（@$!%*?&）をそれぞれ1文字以上含む必要があります"
  }, if: -> { new_record? || !password.nil? }
  
  before_save { self.email = email.downcase }
end
