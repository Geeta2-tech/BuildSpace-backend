# Use official Node.js LTS image
FROM node:22.16.0

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port the app runs on (e.g., 5000)
EXPOSE 5000

# Start the backend
CMD ["npm", "run", "dev"]