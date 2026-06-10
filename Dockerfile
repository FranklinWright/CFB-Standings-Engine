# Stage 1: Build the React App
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the App using Nginx
FROM nginx:alpine
# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy the built Vite static files
COPY --from=build /app/dist /usr/share/nginx/html

# Cloud run expects port 8080 by default
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]