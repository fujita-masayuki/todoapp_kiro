FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    password { 'Password123!' }
    password_confirmation { 'Password123!' }

    trait :with_todos do
      after(:create) do |user|
        create_list(:todo, 3, user: user)
      end
    end
  end
end