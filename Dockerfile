# Use an official Node.js runtime as a build stage
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .
ENV NEXT_PUBLIC_ESLINT_DISABLE=true
# Build the Next.js application
RUN npm run build

# Use a minimal base image for the final stage
FROM node:20-alpine AS runner

# Set the working directory
WORKDIR /app

# Copy necessary files from the builder stage
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public
COPY --from=builder /app/node_modules /app/node_modules


# Expose the port Next.js runs on
EXPOSE 3000

# Set environment variable
ENV NODE_ENV=production

# Use next start to run the app in production mode
CMD ["npm", "run", "start"]
