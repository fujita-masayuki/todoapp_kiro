require 'rails_helper'

RSpec.describe Todo, type: :model do
  describe 'validations' do
    it { should validate_presence_of(:title) }
  end

  describe 'associations' do
    it { should belong_to(:user) }
  end

  describe 'default values' do
    it 'sets completed to false by default' do
      todo = build(:todo)
      expect(todo.completed).to be false
    end
  end

  describe 'scopes' do
    let(:user) { create(:user) }
    let!(:completed_todo) { create(:todo, :completed, user: user) }
    let!(:incomplete_todo) { create(:todo, user: user) }

    it 'filters completed todos' do
      expect(user.todos.where(completed: true)).to include(completed_todo)
      expect(user.todos.where(completed: true)).not_to include(incomplete_todo)
    end

    it 'filters incomplete todos' do
      expect(user.todos.where(completed: false)).to include(incomplete_todo)
      expect(user.todos.where(completed: false)).not_to include(completed_todo)
    end
  end
end