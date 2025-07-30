# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY .env.example .env

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R mcp:nodejs /app
USER mcp

# Expose port (for REST API if needed)
EXPOSE 3000

# Default command runs MCP server
CMD ["node", "src/mcp-server.js"]

# Alternative commands available:
# For REST API: CMD ["node", "src/server.js"]
# For development: CMD ["npm", "run", "dev"]