#!/bin/sh

# Generate config.json with RPC URL
echo "{\"erigonURL\": \"$VITE_RPC_URL\"}" > /usr/share/nginx/html/config.json

# Start nginx
exec nginx -g "daemon off;"
