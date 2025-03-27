FROM node:20.10.0-alpine3.17 as builder

# Set working directory
WORKDIR /app

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

# Create a simple script to generate config.json
RUN echo '#!/bin/sh\n\
PARAMS=$(echo "{\\"erigonURL\\": \\"$RPC_URL\\"}")\n\
echo $PARAMS > /usr/share/nginx/html/config.json\n\
exec nginx -g "daemon off;"' > /docker-entrypoint.sh \
    && chmod +x /docker-entrypoint.sh

# Set environment variable
ENV RPC_URL=""

# Start nginx
CMD ["/docker-entrypoint.sh"]
