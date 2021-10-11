# syntax=docker/dockerfile:1

# Pull base node image
FROM node:16.8.0
ENV NODE_ENV=production

# Create a working folder
WORKDIR /app

# Copy the dependency list
COPY ["package.json", "package-lock.json", "./"]

# Install dependencies
RUN npm install --production

# Copy the source code
COPY . .

# Command to run
CMD ["node", "index.js"]