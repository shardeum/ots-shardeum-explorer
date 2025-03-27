#!/bin/sh

# Generate config.json with RPC URL and additional settings
cat > /usr/share/nginx/html/config.json << EOF
{
  "erigonURL": "${VITE_RPC_URL}",
  "experimental": true,
  "branding": {
    "siteName": "Shardeum Explorer"
  }
}
EOF

# Start nginx
exec nginx -g "daemon off;"
