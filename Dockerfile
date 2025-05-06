FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build --prod

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the built Angular app from previous stage
COPY --from=build /app/dist/fuse /usr/share/nginx/html

# Optional: Replace default Nginx config (if needed)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
