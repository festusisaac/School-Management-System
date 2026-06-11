# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# API URL is baked in at build time (Vite)
ARG VITE_API_URL=https://sms.festus.com.ng/api/v1
ARG VITE_UPLOAD_URL=https://sms.festus.com.ng
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_UPLOAD_URL=$VITE_UPLOAD_URL

# Build application
RUN npm run build

# Production stage - using nginx for serving static files
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy built application from builder and assign ownership to the built-in nginx user
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]