require 'rails_helper'

RSpec.describe JwtAuthenticatable do
  let(:dummy_controller) do
    Class.new(ApplicationController) do
      include JwtAuthenticatable
      
      # privateメソッドをテスト用にpublicにする
      public :encode_token, :decode_token, :current_user, :extract_token_from_header, :logged_in?, :authenticate_user!
    end
  end
  
  let(:controller) { dummy_controller.new }
  let(:user) { create(:user) }

  before do
    # requestオブジェクトをモック
    allow(controller).to receive(:request).and_return(double('request', headers: {}))
  end

  describe '#encode_token' do
    it 'encodes a JWT token with user_id' do
      token = controller.encode_token(user_id: user.id)
      expect(token).to be_a(String)
      expect(token.split('.').length).to eq(3) # JWT has 3 parts
    end

    it 'includes expiration time' do
      token = controller.encode_token(user_id: user.id)
      decoded = JWT.decode(token, Rails.application.credentials.secret_key_base || 'fallback_secret_key', true, { algorithm: 'HS256' })
      
      expect(decoded[0]).to have_key('user_id')
      expect(decoded[0]).to have_key('exp')
      expect(decoded[0]['user_id']).to eq(user.id)
    end
  end

  describe '#decode_token' do
    let(:valid_token) { controller.encode_token(user_id: user.id) }

    context 'with valid token' do
      it 'decodes the token successfully' do
        decoded = controller.decode_token(valid_token)
        expect(decoded).to be_a(Hash)
        expect(decoded['user_id']).to eq(user.id)
      end
    end

    context 'with invalid token' do
      it 'returns nil for malformed token' do
        decoded = controller.decode_token('invalid.token.here')
        expect(decoded).to be_nil
      end

      it 'returns nil for expired token' do
        # Create an expired token
        expired_payload = { user_id: user.id, exp: 1.hour.ago.to_i }
        expired_token = JWT.encode(expired_payload, Rails.application.credentials.secret_key_base || 'fallback_secret_key', 'HS256')
        
        decoded = controller.decode_token(expired_token)
        expect(decoded).to be_nil
      end
    end
  end

  describe '#current_user' do
    context 'with valid authorization header' do
      let(:token) { controller.encode_token(user_id: user.id) }
      let(:headers) { { 'Authorization' => "Bearer #{token}" } }

      before do
        allow(controller).to receive(:request).and_return(double('request', headers: headers))
      end

      it 'returns the current user' do
        current_user = controller.current_user
        expect(current_user).to eq(user)
      end
    end

    context 'without authorization header' do
      let(:headers) { {} }

      before do
        allow(controller).to receive(:request).and_return(double('request', headers: headers))
      end

      it 'returns nil' do
        current_user = controller.current_user
        expect(current_user).to be_nil
      end
    end

    context 'with invalid token' do
      let(:headers) { { 'Authorization' => 'Bearer invalid.token.here' } }

      before do
        allow(controller).to receive(:request).and_return(double('request', headers: headers))
      end

      it 'returns nil' do
        current_user = controller.current_user
        expect(current_user).to be_nil
      end
    end
  end

  describe '#extract_token_from_header' do
    context 'with valid Bearer token' do
      let(:headers) { { 'Authorization' => 'Bearer abc123' } }

      before do
        allow(controller).to receive(:request).and_return(double('request', headers: headers))
      end

      it 'extracts the token' do
        token = controller.extract_token_from_header
        expect(token).to eq('abc123')
      end
    end

    context 'without Authorization header' do
      let(:headers) { {} }

      before do
        allow(controller).to receive(:request).and_return(double('request', headers: headers))
      end

      it 'returns nil' do
        token = controller.extract_token_from_header
        expect(token).to be_nil
      end
    end

    context 'with invalid Authorization format' do
      let(:headers) { { 'Authorization' => 'Basic abc123' } }

      before do
        allow(controller).to receive(:request).and_return(double('request', headers: headers))
      end

      it 'returns nil' do
        token = controller.extract_token_from_header
        expect(token).to be_nil
      end
    end

    context 'with empty Bearer token' do
      let(:headers) { { 'Authorization' => 'Bearer token' } }

      before do
        allow(controller).to receive(:request).and_return(double('request', headers: headers))
      end

      it 'returns the token' do
        token = controller.extract_token_from_header
        expect(token).to eq('token')
      end
    end

    context 'with malformed Authorization header' do
      let(:headers) { { 'Authorization' => 'Bearer' } }

      before do
        allow(controller).to receive(:request).and_return(double('request', headers: headers))
      end

      it 'returns nil because it does not start with Bearer ' do
        token = controller.extract_token_from_header
        expect(token).to be_nil
      end
    end
  end

  describe '#logged_in?' do
    context 'when user is authenticated' do
      let(:token) { controller.encode_token(user_id: user.id) }
      let(:headers) { { 'Authorization' => "Bearer #{token}" } }

      before do
        allow(controller).to receive(:request).and_return(double('request', headers: headers))
      end

      it 'returns true' do
        expect(controller.logged_in?).to be true
      end
    end

    context 'when user is not authenticated' do
      let(:headers) { {} }

      before do
        allow(controller).to receive(:request).and_return(double('request', headers: headers))
      end

      it 'returns false' do
        expect(controller.logged_in?).to be false
      end
    end
  end

  describe '#authenticate_user!' do
    let(:response_double) { double('response') }

    before do
      allow(controller).to receive(:render)
      allow(controller).to receive(:response).and_return(response_double)
    end

    context 'when user is authenticated' do
      let(:token) { controller.encode_token(user_id: user.id) }
      let(:headers) { { 'Authorization' => "Bearer #{token}" } }

      before do
        allow(controller).to receive(:request).and_return(double('request', headers: headers))
      end

      it 'does not render error' do
        controller.authenticate_user!
        expect(controller).not_to have_received(:render)
      end
    end

    context 'when user is not authenticated' do
      let(:headers) { {} }

      before do
        allow(controller).to receive(:request).and_return(double('request', headers: headers))
      end

      it 'renders unauthorized error' do
        controller.authenticate_user!
        expect(controller).to have_received(:render).with(
          json: { error: 'Unauthorized' }, 
          status: :unauthorized
        )
      end
    end
  end
end