FROM node:20.10.0-alpine3.17 as builder

# Set working directory
WORKDIR /app

# Build arguments
ARG VITE_RPC_URL
ENV VITE_RPC_URL=${VITE_RPC_URL}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --fetch-timeout 600000

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Use nginx for serving the built app
FROM nginx:alpine

# Copy nginx configuration
COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set environment variable
ENV VITE_RPC_URL=""

# Start nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
