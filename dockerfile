FROM ubuntu:latest

# Install Node.js, npm and other dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    gnupg \
    ca-certificates \
    lsb-release \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x (LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Fix Tailwind CSS issues - downgrade to v3
RUN npm uninstall tailwindcss @tailwindcss/postcss \
    && npm install tailwindcss@3 postcss autoprefixer

# Update PostCSS config for compatibility
RUN if [ -f postcss.config.js ]; then \
    sed -i 's/@tailwindcss\/postcss/tailwindcss/g' postcss.config.js; \
    fi

# Commands for testing and linting
CMD ["npm", "run", "dev"]