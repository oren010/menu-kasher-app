FROM node:18-alpine

# Install necessary dependencies for Prisma
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    libc6-compat \
    && ln -s /lib/libc.musl-x86_64.so.1 /lib/ld-linux-x86-64.so.2

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Generate Prisma client for the correct platform
RUN npx prisma generate

# Copy application code
COPY . .

EXPOSE 3001

CMD ["npm", "start"]