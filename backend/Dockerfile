FROM ruby:3.2

WORKDIR /app

# Install dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential default-libmysqlclient-dev && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy Gemfile and install gems
COPY Gemfile ./
RUN bundle install

# Copy application code
COPY . .

EXPOSE 3000

CMD ["rails", "server", "-b", "0.0.0.0"]
