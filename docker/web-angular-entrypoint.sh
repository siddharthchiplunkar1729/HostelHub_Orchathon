#!/bin/bash
set -e

# Default PORT to 80 for local docker-compose, Render overrides it to 10000
export PORT="${PORT:-80}"

# Default API_URL for local docker-compose where nginx can reach api-java by container name
export API_URL="${API_URL:-http://api-java:8080}"

echo "Starting nginx on port $PORT, proxying API to $API_URL"

# Substitute env vars into the nginx config template
envsubst '${PORT} ${API_URL}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

# Start nginx in the foreground
exec nginx -g "daemon off;"
