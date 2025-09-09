require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    subject { build(:user) }

    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email).case_insensitive }
    it { should validate_presence_of(:password) }
    it { should validate_length_of(:password).is_at_least(8) }
    it { should have_secure_password }

    describe 'email format validation' do
      it 'accepts valid email formats' do
        valid_emails = %w[
          user@example.com
          test.email@example.co.jp
          user+tag@example.org
        ]

        valid_emails.each do |email|
          user = build(:user, email: email)
          expect(user).to be_valid, "#{email} should be valid"
        end
      end

      it 'rejects invalid email formats' do
        invalid_emails = %w[
          invalid_email
          @example.com
          user@
        ]

        invalid_emails.each do |email|
          user = build(:user, email: email)
          expect(user).not_to be_valid, "#{email} should be invalid"
        end
      end
    end

    describe 'password complexity validation' do
      it 'accepts passwords with uppercase, lowercase, and numbers' do
        user = build(:user, password: 'Password123!', password_confirmation: 'Password123!')
        expect(user).to be_valid
      end

      it 'rejects passwords without uppercase letters' do
        user = build(:user, password: 'password123!', password_confirmation: 'password123!')
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include('は大文字・小文字・数字・特殊文字（@$!%*?&）をそれぞれ1文字以上含む必要があります')
      end

      it 'rejects passwords without lowercase letters' do
        user = build(:user, password: 'PASSWORD123!', password_confirmation: 'PASSWORD123!')
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include('は大文字・小文字・数字・特殊文字（@$!%*?&）をそれぞれ1文字以上含む必要があります')
      end

      it 'rejects passwords without numbers' do
        user = build(:user, password: 'Password!', password_confirmation: 'Password!')
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include('は大文字・小文字・数字・特殊文字（@$!%*?&）をそれぞれ1文字以上含む必要があります')
      end

      it 'rejects passwords without special characters' do
        user = build(:user, password: 'Password123', password_confirmation: 'Password123')
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include('は大文字・小文字・数字・特殊文字（@$!%*?&）をそれぞれ1文字以上含む必要があります')
      end
    end
  end

  describe 'associations' do
    it { should have_many(:todos).dependent(:destroy) }
  end

  describe 'email normalization' do
    it 'normalizes email to lowercase before saving' do
      user = build(:user, email: 'TEST@EXAMPLE.COM')
      user.save!
      expect(user.email).to eq('test@example.com')
    end
  end

  describe 'password authentication' do
    let(:user) { create(:user, password: 'Password123!') }

    it 'authenticates with correct password' do
      expect(user.authenticate('Password123!')).to eq(user)
    end

    it 'does not authenticate with incorrect password' do
      expect(user.authenticate('wrongpassword')).to be_falsey
    end
  end
end