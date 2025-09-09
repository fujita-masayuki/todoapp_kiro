FactoryBot.define do
  factory :todo do
    title { Faker::Lorem.sentence(word_count: 3) }
    completed { false }
    association :user

    trait :completed do
      completed { true }
    end
  end
end