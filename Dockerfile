# Stage 1: Build the Angular app
FROM node:18 AS build

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Clean npm cache and install dependencies
RUN npm cache clean --force && npm install --verbose

# Copy the rest of the application files
COPY . .

# Build the Angular app
RUN npm run build --prod

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the built Angular app from the build stage
COPY --from=build /app/dist/fuse /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
