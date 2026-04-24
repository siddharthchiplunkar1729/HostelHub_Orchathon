FROM node:20-alpine AS build
WORKDIR /workspace

# Copy dependencies first for layer caching
COPY apps/web-angular/package.json apps/web-angular/package.json
COPY apps/web-angular/package-lock.json apps/web-angular/package-lock.json
WORKDIR /workspace/apps/web-angular
RUN npm ci

# Copy source and build
COPY apps/web-angular/ .
RUN npm run build -- --configuration production

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM nginx:1.25-alpine

# Install bash for the entrypoint script
RUN apk add --no-cache bash

# Copy the nginx config template (uses $PORT and $API_URL placeholders)
COPY docker/nginx-angular.conf /etc/nginx/templates/default.conf.template

# Copy built Angular app
COPY --from=build /workspace/apps/web-angular/dist/web-angular/browser /usr/share/nginx/html

# Copy and enable our startup entrypoint
COPY docker/web-angular-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 10000

ENTRYPOINT ["/entrypoint.sh"]
