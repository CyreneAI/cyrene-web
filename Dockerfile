# Use an official Node.js runtime as a build stage
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json package-lock.json ./

# Install necessary build dependencies
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev


# Create a symlink for python
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Install dependencies with --ignore-scripts to avoid native module builds
RUN npm install --ignore-scripts


# Copy the rest of the application code
COPY . .

# Pass build-time environment variables
ARG NEXT_PUBLIC_MESSAGE_API_URL
ARG NEXT_USE_DEV
ARG NEXT_PUBLIC_TTS_API_URL
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_MESSAGE_API_URL=${NEXT_PUBLIC_MESSAGE_API_URL}
ENV NEXT_USE_DEV=${NEXT_USE_DEV}
ENV NEXT_PUBLIC_TTS_API_URL=${NEXT_PUBLIC_TTS_API_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

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

# Set environment variable for runtime
ENV NODE_ENV=production

# Ensure runtime environment variables are available
ENV NEXT_PUBLIC_MESSAGE_API_URL=${NEXT_PUBLIC_MESSAGE_API_URL}
ENV NEXT_USE_DEV=${NEXT_USE_DEV}
ENV NEXT_PUBLIC_TTS_API_URL=${NEXT_PUBLIC_TTS_API_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Use next start to run the app in production mode

CMD ["npm", "run", "start"]

