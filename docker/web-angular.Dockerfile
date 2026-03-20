FROM node:20-alpine AS build
WORKDIR /workspace

# Copy dependencies first
COPY apps/web-angular/package.json apps/web-angular/package.json
COPY apps/web-angular/package-lock.json apps/web-angular/package-lock.json
WORKDIR /workspace/apps/web-angular
RUN npm ci

# Copy source and build
COPY apps/web-angular/ .
RUN npm run build -- --configuration production

FROM nginx:1.25-alpine
COPY docker/nginx-angular.conf /etc/nginx/conf.d/default.conf
# Angular 19 output path is usually dist/web-angular/browser
COPY --from=build /workspace/apps/web-angular/dist/web-angular/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
