FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all server files
COPY . .

# Build the server
RUN npm run build

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "dist/index.js"]
